import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";

export default async function DashboardUnmatchedRoute() {
  await requireSession({ redirectToLogin: true });
  notFound();
}
