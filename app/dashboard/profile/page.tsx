import { Container } from "@/components/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Data Saya</h1>
          <p className="text-muted-foreground">
            Kelola informasi profil Anda
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-foreground">
                  Nama Lengkap
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                  - (Belum diisi)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Email
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                  user@example.com
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Nomor Telepon
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                  - (Belum diisi)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">
                  Tanggal Lahir
                </label>
                <p className="mt-1 text-sm text-muted-foreground">
                  - (Belum diisi)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
