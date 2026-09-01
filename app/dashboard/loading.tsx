export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center py-32">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-accent" />
        <p className="text-sm font-medium text-muted-foreground">Memuat...</p>
      </div>
    </div>
  );
}
