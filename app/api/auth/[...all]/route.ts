import { NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";

import { betterAuthServer } from "@/lib/auth/better-auth";
import { isDemoAuthEnabled } from "@/lib/demo-auth-session";

const authHandler = toNextJsHandler(betterAuthServer);

export async function GET(request: Request) {
  if (isDemoAuthEnabled()) {
    return NextResponse.json(
      {
        message:
          "Demo auth is enabled. Set DEMO_AUTH=false and configure Better Auth env values to activate these endpoints.",
      },
      { status: 503 },
    );
  }

  return authHandler.GET(request);
}

export async function POST(request: Request) {
  if (isDemoAuthEnabled()) {
    return NextResponse.json(
      {
        message:
          "Demo auth is enabled. Set DEMO_AUTH=false and configure Better Auth env values to activate these endpoints.",
      },
      { status: 503 },
    );
  }

  return authHandler.POST(request);
}
