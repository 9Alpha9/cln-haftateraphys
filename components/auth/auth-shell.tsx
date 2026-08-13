import Link from "next/link";
import { type ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AuthShell({ children, title, description }: AuthShellProps) {
  return (
    <div className="relative min-h-screen bg-background">
      {/* Brand panel - desktop only, left half */}
      <div className="pointer-events-none fixed inset-0 z-0 hidden w-1/2 bg-primary lg:flex lg:items-center lg:justify-center">
        <div className="px-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-primary font-bold text-2xl">
            H
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            Hafta Fisioterapi
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Klinik fisioterapi profesional untuk pemulihan optimal
          </p>
        </div>
      </div>

      {/* Form area */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6 lg:ml-[50%] lg:w-1/2 lg:px-12 xl:px-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                H
              </div>
              <span className="text-xl font-semibold text-foreground">
                Hafta Fisioterapi
              </span>
            </Link>
            {title && (
              <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
