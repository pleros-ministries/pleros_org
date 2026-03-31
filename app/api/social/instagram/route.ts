import { NextResponse } from "next/server";

import { getLatestInstagramPosts } from "@/lib/homepage-feed";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await getLatestInstagramPosts();

  return NextResponse.json(
    { posts },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
