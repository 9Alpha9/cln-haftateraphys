"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/container";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Beranda", href: "/" },
  { name: "Layanan", href: "#layanan" },
  { name: "Tentang Kami", href: "#tentang" },
  { name: "Kontak", href: "#kontak" },
];

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white">
      <Container>
        <div className="flex h-16 items-center justify-between md:h-18">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logos/logos-text.png"
              alt="Hafta Fisioterapi"
              width={140}
              height={32}
              className="h-18 w-auto"
              priority
            />
          </Link>

          <nav className="hidden md:flex md:items-center md:gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex md:items-center md:gap-3">
            <Link
              href="/login"
              className="inline-flex h-8 items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Daftar
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="ghost"
              size="icon-lg"
              className="h-11 w-11"
            >
              <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                <Phone className="h-5 w-5" />
                <span className="sr-only">Hubungi WhatsApp</span>
              </a>
            </Button>
            <Button
              variant="ghost"
              size="icon-lg"
              className="h-11 w-11"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "overflow-hidden transition-all duration-200 md:hidden",
            mobileMenuOpen ? "max-h-96 pb-4" : "max-h-0"
          )}
        >
          <nav className="flex flex-col gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href="/login"
              className="inline-flex h-10 items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Daftar
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}
