import { PrintSignature } from '@/components/ui/print-signature';

type PrintFooterProps = {
  clinicName?: string;
  signerRole?: string;
  signerName?: string;
  showDisclaimer?: boolean;
};

export function PrintFooter({
  clinicName = 'Hafta Fisioterapi',
  signerRole = 'Mengetahui',
  signerName,
  showDisclaimer = true,
}: PrintFooterProps) {
  return (
    <div className="mt-auto border-t border-stone-200/80 pt-5 print:border-stone-200/80">
      <div className="flex items-end justify-between">
        <div className="text-[11px] text-stone-400">
          {showDisclaimer && (
            <>
              <p>Dokumen ini dicetak secara otomatis dari sistem {clinicName}.</p>
              <p>Dicetak pada: {new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })} Wib.</p>
            </>
          )}
        </div>
        <PrintSignature role={signerRole} name={signerName} />
      </div>
    </div>
  );
}
