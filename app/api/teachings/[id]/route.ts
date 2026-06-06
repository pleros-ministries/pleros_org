import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";

import { deleteTeaching, getTeachingById, updateTeaching } from "@/lib/db/queries/teachings";
import { getAppSession } from "@/lib/app-session";

const utapi = new UTApi();

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAppSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const teaching = await getTeachingById(numericId);
    if (!teaching) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (teaching.fileKey && !teaching.fileKey.startsWith("placeholder")) {
      try {
        await utapi.deleteFiles(teaching.fileKey);
      } catch (err) {
        console.error("UploadThing delete failed:", err);
      }
    }

    await deleteTeaching(numericId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/teachings/[id] error:", err);
    return NextResponse.json({ error: "Failed to delete teaching" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getAppSession();
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await request.json();
    const { title, series, date } = body;

    const updated = await updateTeaching(numericId, { title, series, date });
    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/teachings/[id] error:", err);
    return NextResponse.json({ error: "Failed to update teaching" }, { status: 500 });
  }
}
