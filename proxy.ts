import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getPpcRewritePath } from "@/lib/ppc-routing";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host");

  const rewritePath = getPpcRewritePath(host, request.nextUrl.pathname);

  if (!rewritePath) {
    return NextResponse.next();
  }

  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = rewritePath;

  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: ["/:path*"],
};
