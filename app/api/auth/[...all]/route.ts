import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

async function handleAuth(request: NextRequest) {
  return "handler" in auth
    ? auth.handler(request as unknown as Request)
    : (auth as unknown as (req: Request) => Promise<Response>)(
        request as unknown as Request
      );
}

export async function GET(request: NextRequest) {
  return handleAuth(request);
}

export async function POST(request: NextRequest) {
  return handleAuth(request);
}
