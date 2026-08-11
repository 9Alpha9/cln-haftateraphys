import { Container } from "@/components/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, UserPlus, FileText, Settings } from "lucide-react";

export default function UsersPage() {
  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Manajemen Pengguna
            </h1>
            <p className="text-muted-foreground">
              Kelola akun pengguna dan role
            </p>
          </div>
          <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <UserPlus className="mr-2 h-4 w-4" />
            Tambah Pengguna
          </button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daftar Pengguna</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                Belum ada pengguna terdaftar
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Pengguna akan muncul di sini setelah registrasi
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
