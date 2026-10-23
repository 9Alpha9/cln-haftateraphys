CREATE OR REPLACE FUNCTION patient_mrn_base(p_full_name text, p_created_at timestamptz)
RETURNS text
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_name text;
  v_first text;
  v_last text;
  v_initials text;
BEGIN
  v_name := btrim(regexp_replace(coalesce(p_full_name, ''), '\s+', ' ', 'g'));
  IF v_name = '' THEN
    v_name := 'Pasien';
  END IF;

  v_first := upper(substr(v_name, 1, 1));
  IF position(' ' IN v_name) > 0 THEN
    v_last := upper(substr(regexp_replace(v_name, '^.* ', ''), 1, 1));
  ELSE
    v_last := upper(substr(v_name, length(v_name), 1));
  END IF;

  v_initials := regexp_replace(v_first || v_last, '[^[:alpha:]]', '', 'g');
  IF v_initials = '' THEN
    v_initials := 'PX';
  END IF;

  RETURN v_initials || to_char(coalesce(p_created_at, current_timestamp) AT TIME ZONE 'Asia/Jakarta', 'DDYY');
END;
$$;

CREATE OR REPLACE FUNCTION assign_patient_medical_record_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_base text;
  v_candidate text;
  v_suffix integer := 1;
BEGIN
  IF NEW.medical_record_number IS NOT NULL AND btrim(NEW.medical_record_number) <> '' THEN
    RETURN NEW;
  END IF;

  v_base := patient_mrn_base(NEW.full_name, NEW.created_at);

  LOOP
    v_candidate := CASE WHEN v_suffix = 1 THEN v_base ELSE v_base || '-' || v_suffix END;
    BEGIN
      UPDATE patients SET medical_record_number = v_candidate WHERE id = NEW.id;
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      v_suffix := v_suffix + 1;
      IF v_suffix > 9999 THEN
        RAISE;
      END IF;
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

DO $$
DECLARE
  rec RECORD;
  v_base text;
  v_candidate text;
  v_suffix integer;
BEGIN
  FOR rec IN
    SELECT id, full_name, created_at
    FROM patients
    WHERE medical_record_number IS NULL OR btrim(medical_record_number) = ''
    ORDER BY created_at, id
  LOOP
    v_base := patient_mrn_base(rec.full_name, rec.created_at);
    v_suffix := 1;

    LOOP
      v_candidate := CASE WHEN v_suffix = 1 THEN v_base ELSE v_base || '-' || v_suffix END;
      BEGIN
        UPDATE patients SET medical_record_number = v_candidate WHERE id = rec.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        v_suffix := v_suffix + 1;
        IF v_suffix > 9999 THEN
          RAISE;
        END IF;
      END;
    END LOOP;
  END LOOP;
END;
$$;

DROP TRIGGER IF EXISTS patients_assign_medical_record_number ON patients;
CREATE TRIGGER patients_assign_medical_record_number
AFTER INSERT ON patients
FOR EACH ROW
EXECUTE FUNCTION assign_patient_medical_record_number();
