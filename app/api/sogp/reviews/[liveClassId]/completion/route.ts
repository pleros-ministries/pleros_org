import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { setSogpReviewComplete } from "@/lib/db/queries/sogp-journey";
import { isReviewCompletionSource } from "@/lib/sogp/journey";
import { scheduleSogpWeekCertificateCheck } from "@/lib/sogp/week-certificate-side-effects";

export async function POST(
  request: Request,
  context: { params: Promise<{ liveClassId: string }> },
) {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { liveClassId } = await context.params;
  const id = Number(liveClassId);
  const body = (await request.json()) as { complete?: unknown; source?: unknown };
  if (
    !Number.isInteger(id) ||
    typeof body.complete !== "boolean" ||
    !isReviewCompletionSource(body.source)
  ) {
    return NextResponse.json({ error: "Invalid review completion request" }, { status: 400 });
  }
  try {
    const result = await setSogpReviewComplete({
      userId: session.user.id,
      liveClassId: id,
      complete: body.complete,
      source: body.source,
    });
    if (body.complete) scheduleSogpWeekCertificateCheck(session.user.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review completion could not be saved" },
      { status: 403 },
    );
  }
}
