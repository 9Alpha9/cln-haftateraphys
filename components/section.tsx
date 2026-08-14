import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface SectionProps {
  children: ReactNode;
  className?: string;
  as?: 'section' | 'div' | 'article';
  id?: string;
}

export function Section({ children, className, as: Component = 'section', id }: SectionProps) {
  return (
    <Component id={id} className={cn('section-padding', className)}>
      {children}
    </Component>
  );
}
