import { NextResponse } from "next/server";

export async function POST(request: Request) {
  return NextResponse.redirect(new URL("/api/sogp/enrol", request.url), 308);
}
