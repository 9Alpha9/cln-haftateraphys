export const SETTINGS_DEFAULTS = {
  clinic_name: 'Hafta Fisioterapi',
  clinic_phone: '0812-3293-2872',
  clinic_email: '',
  clinic_address: 'Jl. Pd. Sidokare Indah No.AE-13, Sidokare, Sidoarjo 61214',
  appointment_reminders_enabled: 'true',
} as const;

export type AppSettingKey = keyof typeof SETTINGS_DEFAULTS;

export type AppSettings = Record<AppSettingKey, string>;

export const SETTING_KEYS = Object.keys(SETTINGS_DEFAULTS) as AppSettingKey[];

export function withDefaults(values: Partial<Record<string, string>>): AppSettings {
  return SETTING_KEYS.reduce((acc, key) => {
    acc[key] = values[key]?.trim() || SETTINGS_DEFAULTS[key];
    return acc;
  }, {} as AppSettings);
}
