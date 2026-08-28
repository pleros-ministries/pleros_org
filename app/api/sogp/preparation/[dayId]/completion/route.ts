import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import { setPreparationLessonComplete } from "@/lib/db/queries/sogp-journey";

export async function POST(
  request: Request,
  context: { params: Promise<{ dayId: string }> },
) {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { dayId } = await context.params;
  const id = Number(dayId);
  const body = (await request.json()) as { complete?: unknown };
  if (!Number.isInteger(id) || typeof body.complete !== "boolean") {
    return NextResponse.json({ error: "Invalid completion request" }, { status: 400 });
  }
  try {
    return NextResponse.json(
      await setPreparationLessonComplete({
        userId: session.user.id,
        preparationDayId: id,
        complete: body.complete,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Completion could not be saved" },
      { status: 403 },
    );
  }
}
