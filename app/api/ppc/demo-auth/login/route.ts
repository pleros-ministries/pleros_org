import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  canAccessPpcPath,
  getRoleHomePath,
  toExternalPpcPath,
} from "@/lib/ppc-access";
import {
  DEMO_AUTH_COOKIE_NAME,
  encodeDemoSession,
  isDemoAuthEnabled,
  isValidAppRole,
} from "@/lib/demo-auth-session";

export async function POST(request: NextRequest) {
  if (!isDemoAuthEnabled()) {
    return NextResponse.json(
      {
        message:
          "Demo auth is disabled. Configure Better Auth credentials and set DEMO_AUTH=false.",
      },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "").trim();
  const requestedReturnTo = String(formData.get("returnTo") ?? "").trim();

  if (!name || !email || !isValidAppRole(role)) {
    return NextResponse.redirect(new URL("/ppc/sign-in", request.url));
  }

  const defaultLogicalPath = getRoleHomePath(role);
  const safeReturnTo = requestedReturnTo.startsWith("/") ? requestedReturnTo : null;
  const targetLogicalPath =
    safeReturnTo && canAccessPpcPath(role, safeReturnTo)
      ? safeReturnTo
      : defaultLogicalPath;

  const response = NextResponse.redirect(
    new URL(toExternalPpcPath(request.headers.get("host"), targetLogicalPath), request.url),
  );

  response.cookies.set(DEMO_AUTH_COOKIE_NAME, encodeDemoSession({ user: { name, email, role } }), {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 14,
  });

  return response;
}
