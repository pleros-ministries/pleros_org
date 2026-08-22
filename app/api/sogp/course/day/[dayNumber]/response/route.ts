import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import {
  getSubmission,
  submitForReview,
  upsertDraft,
} from "@/lib/db/queries/submissions";
import { requireSogpDayAccess } from "@/lib/sogp/server-access";

async function resolveContext(params: Promise<{ dayNumber: string }>) {
  const session = await getAppSession();
  if (!session) return null;
  const { dayNumber: raw } = await params;
  const dayNumber = Number(raw);
  if (!Number.isInteger(dayNumber)) return null;
  const data = await requireSogpDayAccess(session.user.id, dayNumber);
  return { session, dayNumber, data };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ dayNumber: string }> },
) {
  try {
    const context = await resolveContext(params);
    if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const submission = await getSubmission(
      context.session.user.id,
      context.data.track.lesson.id,
    );
    return NextResponse.json({
      dayNumber: context.dayNumber,
      lessonTitle: context.data.track.lesson.title,
      prompt: context.data.track.lesson.responsePrompt,
      submission,
    });
  } catch {
    return NextResponse.json({ error: "Written response is unavailable" }, { status: 403 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ dayNumber: string }> },
) {
  try {
    const context = await resolveContext(params);
    if (!context) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = (await request.json().catch(() => null)) as {
      action?: "save" | "submit";
      content?: string;
    } | null;
    if (!body || !["save", "submit"].includes(body.action ?? "")) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    const content = body.content?.trim() ?? "";
    if (body.action === "save") {
      if (!content || content.length > 20_000) {
        return NextResponse.json(
          { error: "Write a response within 20,000 characters." },
          { status: 400 },
        );
      }
      const submission = await upsertDraft(
        context.session.user.id,
        context.data.track.lesson.id,
        content,
      );
      return NextResponse.json({ submission });
    }
    const current = await getSubmission(
      context.session.user.id,
      context.data.track.lesson.id,
    );
    if (!current?.content.trim()) {
      return NextResponse.json(
        { error: "Save your response before submitting." },
        { status: 400 },
      );
    }
    const submission = await submitForReview(
      context.session.user.id,
      context.data.track.lesson.id,
    );
    return NextResponse.json({ submission });
  } catch {
    return NextResponse.json({ error: "Written response is unavailable" }, { status: 403 });
  }
}
