import { cn } from '@/lib/utils';

type StatusVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-green-50 text-green-700 border border-green-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  danger: 'bg-red-50 text-red-700 border border-red-200',
  info: 'bg-teal-50 text-teal-700 border border-teal-200',
  muted: 'bg-gray-100 text-gray-600 border border-gray-200',
};

export function StatusBadge({ label, variant = 'default', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}
