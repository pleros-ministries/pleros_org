import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAppSession } from "@/lib/app-session";
import { db } from "@/lib/db";
import { levelGraduations, levels, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateCertificatePdf } from "@/lib/certificate/generate";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ levelId: string }> },
) {
  const session = await getAppSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { levelId: levelIdStr } = await params;
  const levelId = Number(levelIdStr);
  if (isNaN(levelId)) {
    return NextResponse.json({ error: "Invalid level" }, { status: 400 });
  }

  const graduation = await db.query.levelGraduations.findFirst({
    where: (g, { eq: eq2, and: and2 }) =>
      and2(eq2(g.userId, session.user.id), eq2(g.levelId, levelId)),
  });

  if (!graduation) {
    return NextResponse.json({ error: "Not graduated from this level" }, { status: 403 });
  }

  const level = await db.query.levels.findFirst({
    where: (l, { eq: eq2 }) => eq2(l.id, levelId),
  });

  let approverName = "PPC Staff";
  if (graduation.graduatedBy) {
    const approver = await db.query.users.findFirst({
      where: (u, { eq: eq2 }) => eq2(u.id, graduation.graduatedBy!),
    });
    if (approver) approverName = approver.name;
  }

  const pdf = await generateCertificatePdf({
    studentName: session.user.name,
    levelTitle: level?.title ?? `Level ${levelId}`,
    levelNumber: levelId,
    graduatedAt: graduation.graduatedAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    graduatedBy: approverName,
  });

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ppc-certificate-level-${levelId}.pdf"`,
    },
  });
}
