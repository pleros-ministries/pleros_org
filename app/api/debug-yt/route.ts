import { getLatestYoutubeVideos } from "../../../../lib/homepage-feed";

export async function GET() {
  const videos = await getLatestYoutubeVideos(10);
  return Response.json({ count: videos.length, videos });
}
