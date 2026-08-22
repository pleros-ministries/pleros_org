import { NextResponse } from "next/server";

import { getAppSession } from "@/lib/app-session";
import {
  getSogpCertificateByCode,
  getSogpCertificateOwner,
} from "@/lib/db/queries/sogp-completion";
import { generateSogpCertificatePdf } from "@/lib/certificate/sogp-generate";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ verificationCode: string }> },
) {
  const session = await getAppSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { verificationCode } = await params;
  const certificate = await getSogpCertificateByCode(verificationCode);
  if (!certificate || certificate.revokedAt) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  }
  const owner = await getSogpCertificateOwner(certificate.enrollmentId);
  if (!owner || owner.enrollment.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const pdf = await generateSogpCertificatePdf({
    studentName: owner.enrollment.name,
    cohortTitle: owner.cohort.title,
    issuedAt: new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Africa/Lagos",
    }).format(certificate.issuedAt),
    verificationCode: certificate.verificationCode,
  });
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="sogp-certificate-${certificate.verificationCode}.pdf"`,
    },
  });
}
