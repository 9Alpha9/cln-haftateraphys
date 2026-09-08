import { readFileSync } from 'fs';
import { join } from 'path';

type PrintSignatureProps = {
  role?: string;
  name?: string;
  className?: string;
};

function getSignatureDataUrl(): string {
  const filePath = join(process.cwd(), 'public/images/signs/sign_sample.png');
  const buffer = readFileSync(filePath);
  const base64 = buffer.toString('base64');
  return `data:image/png;base64,${base64}`;
}

export function PrintSignature({ role = 'Hafta Fisioterapi', name, className = '' }: PrintSignatureProps) {
  const dataUrl = getSignatureDataUrl();

  return (
    <div className={`text-center w-56 ${className}`}>
      <p className="text-xs text-slate-500">{role},</p>
      <div
        className="h-28 w-56 mx-auto bg-contain bg-no-repeat bg-center print:bg-contain"
        style={{
          backgroundImage: `url("${dataUrl}")`,
          WebkitPrintColorAdjust: 'exact',
          printColorAdjust: 'exact',
        }}
        role="img"
        aria-label="Tanda Tangan"
      />
      {name && (
        <p className="text-sm font-bold text-slate-900 border-t border-slate-300 pt-1">{name}</p>
      )}
    </div>
  );
}
