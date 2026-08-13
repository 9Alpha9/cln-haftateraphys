"use server";

import { getUserRole } from "@/lib/get-user-role";
import type { Role } from "@/lib/permissions";

export async function fetchUserRole(): Promise<Role> {
  return getUserRole();
}
