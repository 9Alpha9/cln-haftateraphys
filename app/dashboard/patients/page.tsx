import { Container } from "@/components/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Users, UserPlus, Search, Filter } from "lucide-react";

export default function PatientsPage() {
  return (
    <Container>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Daftar Pasien
            </h1>
            <p className="text-muted-foreground">
              Kelola data pasien dan riwayat terapi
            </p>
          </div>
          <button className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            <UserPlus className="mr-2 h-4 w-4" />
            Tambah Pasien
          </button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pasien</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Cari pasien..."
                    className="h-8 rounded-md border border-border bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <button className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                  <Filter className="mr-2 h-3 w-3" />
                  Filter
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                Belum ada pasien terdaftar
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Pasien akan muncul di sini setelah melakukan registrasi
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
