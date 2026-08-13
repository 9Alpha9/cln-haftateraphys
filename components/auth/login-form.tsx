"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/password-field";
import { AuthAlert } from "@/components/auth/auth-alert";
import { signIn } from "@/lib/auth/client";

type LoginError = {
  message: string;
  type: "error" | "success";
};

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<LoginError | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email) {
      setError({ message: "Email wajib diisi.", type: "error" });
      return;
    }

    if (!password) {
      setError({ message: "Kata sandi wajib diisi.", type: "error" });
      return;
    }

    startTransition(async () => {
      try {
        const result = await signIn.email({
          email,
          password,
          callbackURL: "/dashboard",
        });

        if (result?.error) {
          const errData = result.error as { message?: string; code?: string };

          if (errData?.code === "EMAIL_NOT_VERIFIED") {
            setError({
              message:
                "Email belum diverifikasi. Silakan cek inbox Anda untuk link verifikasi.",
              type: "error",
            });
            return;
          }

          setError({
            message: "Email atau kata sandi tidak sesuai.",
            type: "error",
          });
          return;
        }

        router.push("/dashboard");
        router.refresh();
      } catch {
        setError({
          message: "Terjadi kesalahan server. Silakan coba lagi.",
          type: "error",
        });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {error && <AuthAlert type={error.type} message={error.message} />}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="nama@email.com"
          required
          autoComplete="email"
          disabled={isPending}
          className="h-10"
        />
      </div>

      <PasswordField
        id="password"
        name="password"
        label="Kata Sandi"
        placeholder="Masukkan kata sandi"
        autoComplete="current-password"
        disabled={isPending}
      />

      <div className="flex items-center justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-primary hover:underline"
        >
          Lupa kata sandi?
        </Link>
      </div>

      <Button
        type="submit"
        className="h-10 w-full"
        disabled={isPending}
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Memproses...
          </>
        ) : (
          "Masuk"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Buat akun
        </Link>
      </p>
    </form>
  );
}
