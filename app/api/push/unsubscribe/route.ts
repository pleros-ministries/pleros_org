import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { siteWebPushSubscriptions } from "@/lib/db/schema";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { endpoint } = (body ?? {}) as { endpoint?: string };

  if (!endpoint) {
    return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
  }

  await db
    .delete(siteWebPushSubscriptions)
    .where(eq(siteWebPushSubscriptions.endpoint, endpoint));

  return NextResponse.json({ ok: true });
}
