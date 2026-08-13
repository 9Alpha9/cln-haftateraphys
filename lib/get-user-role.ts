import { auth } from "@/lib/auth";
import { getDb } from "@/db";
import { profiles } from "@/db/schema/profiles";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import type { Role } from "@/lib/permissions";

export async function getUserRole(): Promise<Role> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return "USER";
    }

    const db = getDb();
    const [profile] = await db
      .select({ accountType: profiles.accountType })
      .from(profiles)
      .where(eq(profiles.userId, session.user.id))
      .limit(1);

    return (profile?.accountType as Role) ?? "USER";
  } catch {
    return "USER";
  }
}
