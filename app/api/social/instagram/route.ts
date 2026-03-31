import { NextResponse } from "next/server";

import { getLatestInstagramPostsWithDiagnostics } from "@/lib/homepage-feed";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { posts, diagnostics } = await getLatestInstagramPostsWithDiagnostics();
  const url = new URL(request.url);
  const wantsDebug = url.searchParams.get("debug") === "1";
  const logLevel = posts.length ? "info" : "warn";

  console[logLevel]("Instagram social feed diagnostics", {
    path: url.pathname,
    host: url.host,
    vercelEnv: process.env.VERCEL_ENV ?? "local",
    diagnostics,
  });

  return NextResponse.json(
    wantsDebug ? { posts, diagnostics } : { posts },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
