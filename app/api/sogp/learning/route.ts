import { NextResponse } from "next/server";
import { getAppSession } from "@/lib/app-session";
import { getOwnLearningView } from "@/lib/db/queries/sogp-learning-view";

export async function GET() {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Sign in to view your learning." },{ status: 401 });
  const data = await getOwnLearningView(session.user.id);
  if (!data) return NextResponse.json({ error: "SOGP enrolment is required." },{ status: 403 });
  return NextResponse.json(data,{ headers: { "Cache-Control": "private, no-store" } });
}
