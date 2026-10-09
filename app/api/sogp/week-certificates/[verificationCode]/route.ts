import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import {
  formatSogpCertificateDate,
  generateSogpWeekCertificatePdf,
} from "@/lib/certificate/sogp-generate";
import { getSogpWeekCertificateForOwner } from "@/lib/db/queries/sogp-week-certificates";
import { getSogpLevel } from "@/lib/sogp/curriculum";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ verificationCode: string }> },
) {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const { verificationCode } = await params;
  // Not found, withdrawn and someone else's all read the same.
  const owned = await getSogpWeekCertificateForOwner(verificationCode, session.user.id);
  if (!owned) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }
  const pdf = await generateSogpWeekCertificatePdf({
    studentName: owned.enrollment.name,
    cohortTitle: owned.cohort.title,
    issuedAt: formatSogpCertificateDate(owned.certificate.issuedAt),
    verificationCode: owned.certificate.verificationCode,
    week: owned.week,
    weekTitle: getSogpLevel(owned.week).title,
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sogp-week-${owned.week}-certificate-${owned.certificate.verificationCode}.pdf"`,
    },
  });
}
