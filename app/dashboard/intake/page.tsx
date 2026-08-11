import { Container } from "@/components/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function IntakePage() {
  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Form Awal</h1>
          <p className="text-muted-foreground">
            Lengkapi informasi keluhan dan riwayat kesehatan Anda
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Intake Pasien</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Form intake akan diimplementasikan pada tahap berikutnya.
              Form ini akan mencakup:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Keluhan utama
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Lokasi dan onset nyeri
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Faktor pemberat dan peringan
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Riwayat cedera dan operasi
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Riwayat medis dan obat-obatan
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                Tujuan terapi
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
