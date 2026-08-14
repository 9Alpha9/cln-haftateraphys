import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'main';
}

export function Container({ children, className, as: Component = 'div' }: ContainerProps) {
  return (
    <Component className={cn('mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8', className)}>{children}</Component>
  );
}
