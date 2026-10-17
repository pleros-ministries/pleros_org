
import type { FeedPost } from "@/lib/db/queries/community-posts";

import { PostCard } from "./post-card";

export function PostDetail({
  post,
  viewerName,
  viewerUnitName,
  canRepost,
  isAdmin,
}: {
  post: FeedPost;
  viewerName: string;
  viewerUnitName: string | null;
  canRepost: boolean;
  isAdmin: boolean;
}) {

  return (
    <div className="grid gap-3">
      <PostCard
        post={post}
        viewerName={viewerName}
        viewerUnitName={viewerUnitName}
        canRepost={canRepost}
        isAdmin={isAdmin}
        startExpanded
      />
    </div>
  );
}
