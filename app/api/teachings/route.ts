import { NextResponse } from "next/server";

import { getAllTeachings, createTeaching, getNextSn } from "@/lib/db/queries/teachings";

export async function GET() {
  try {
    const rows = await getAllTeachings();
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/teachings error:", err);
    return NextResponse.json({ error: "Failed to fetch teachings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sn, title, series, date, audio_url, file_key, duration } = body;

    if (!title || !series || !audio_url || !file_key) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const nextSn = sn ?? (await getNextSn());

    const teaching = await createTeaching({
      sn: nextSn,
      title,
      series,
      date: date ?? null,
      audioUrl: audio_url,
      fileKey: file_key,
      duration: duration ?? null,
    });

    return NextResponse.json(teaching, { status: 201 });
  } catch (err) {
    console.error("POST /api/teachings error:", err);
    return NextResponse.json({ error: "Failed to create teaching" }, { status: 500 });
  }
}
