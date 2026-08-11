import { Container } from "@/components/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HistoryPage() {
  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Riwayat Terapi</h1>
          <p className="text-muted-foreground">
            Lihat riwayat sesi terapi dan perkembangan Anda
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Riwayat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Belum ada riwayat terapi
              </p>
              <p className="text-sm text-muted-foreground/70 mt-2">
                Riwayat akan muncul setelah Anda menjalani sesi terapi
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
