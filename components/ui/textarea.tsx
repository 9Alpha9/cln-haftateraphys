import * as React from 'react';
import { cn } from '@/lib/utils';

export type TextareaProps = React.ComponentProps<'textarea'> & {
  rows?: number;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, rows, ...props }, ref) => (
  <textarea
    ref={ref}
    rows={rows}
    {...props}
    className={cn(
      'flex w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-resizer]:hidden',
      className,
    )}
  />
));
Textarea.displayName = 'Textarea';

export { Textarea };
