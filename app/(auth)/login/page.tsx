import { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Masuk — Hafta Fisioterapi",
  description:
    "Masuk ke akun Hafta Fisioterapi untuk mengakses patient portal Anda.",
};

export default function LoginPage() {
  return (
    <>
      <LoginForm />
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Dengan masuk, Anda menyetujui{" "}
        <a href="/terms" className="underline hover:text-foreground">
          Syarat & Ketentuan
        </a>{" "}
        dan{" "}
        <a href="/privacy" className="underline hover:text-foreground">
          Kebijakan Privasi
        </a>
        .
      </p>
    </>
  );
}
