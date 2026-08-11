import { Container } from "@/components/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Search, Filter } from "lucide-react";

export default function AuditLogsPage() {
  return (
    <Container>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Log Audit</h1>
          <p className="text-muted-foreground">
            Pantau aktivitas dan perubahan data
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Audit Log</CardTitle>
              <div className="flex items-center gap-2">
                <button className="inline-flex h-8 items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted">
                  <Filter className="mr-2 h-3 w-3" />
                  Filter
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-muted-foreground">
                Belum ada log audit
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Aktivitas akan tercatat di sini
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
