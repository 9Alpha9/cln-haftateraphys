import { Container } from "@/components/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SecurityPage() {
  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Keamanan Akun</h1>
          <p className="text-muted-foreground">
            Kelola keamanan akun Anda
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ubah Password</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fitur ubah password akan diimplementasikan pada tahap berikutnya.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sesi Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Informasi sesi aktif akan ditampilkan di sini.
            </p>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
