import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import {
  markLessonAudioListened,
  markLessonNotesRead,
} from "@/lib/db/queries/lesson-progress";
import { requireSogpDayAccess } from "@/lib/sogp/server-access";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ dayNumber: string }> },
) {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { dayNumber: rawDayNumber } = await params;
  const dayNumber = Number(rawDayNumber);
  const body = (await request.json().catch(() => null)) as { signal?: string } | null;
  if (!Number.isInteger(dayNumber) || !body || !["audio", "notes"].includes(body.signal ?? "")) {
    return NextResponse.json({ error: "Invalid progress signal" }, { status: 400 });
  }
  let data;
  try {
    data = await requireSogpDayAccess(session.user.id, dayNumber);
  } catch {
    return NextResponse.json({ error: "Day is locked" }, { status: 403 });
  }
  if (body.signal === "audio") {
    await markLessonAudioListened(session.user.id, data.track.lesson.id);
  } else {
    await markLessonNotesRead(session.user.id, data.track.lesson.id);
  }
  return NextResponse.json({ success: true });
}
