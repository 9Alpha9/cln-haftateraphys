import Link from "next/link";
import { type ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AuthShell({ children, title, description }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
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

      <div className="hidden lg:fixed lg:inset-0 lg:flex lg:w-1/2 lg:items-center lg:justify-center lg:bg-primary">
        <div className="px-8 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-primary font-bold text-2xl mx-auto">
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
    </div>
  );
}
