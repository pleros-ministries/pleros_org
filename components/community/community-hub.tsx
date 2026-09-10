import type {
  CommunitySidebar as SidebarData,
  FeedPost,
} from "@/lib/db/queries/community-posts";

import { CommunitySidebar } from "./community-sidebar";
import { CommunityTabs } from "./community-tabs";
import { FeedComposer } from "./feed-composer";
import { PostList } from "./post-list";

type HubUnit = { id: number; name: string; telegramUrl: string | null } | null;

export function CommunityHub({
  initialFeed,
  sidebar,
  viewerName,
  unit,
  isUnitLeader,
  isAdmin,
}: {
  initialFeed: FeedPost[];
  sidebar: SidebarData;
  viewerName: string;
  unit: HubUnit;
  isUnitLeader: boolean;
  isAdmin: boolean;
}) {
  return (
    <section className="site-font-theme min-h-screen bg-[#f6f5f1] pb-16 text-zinc-900">
      <CommunityTabs
        current="feed"
        unitId={unit?.id ?? null}
        title={unit ? unit.name : "Community"}
        showLeaderTab={isUnitLeader || isAdmin}
      />

      <div className="site-shell-page sogp-shell-page pb-6 pt-4">
        <div className="mx-auto grid w-full max-w-xl gap-6 lg:max-w-[56rem] lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
          <div className="grid gap-4">
            <FeedComposer
              viewerName={viewerName}
              unitName={unit?.name ?? null}
            />
            <PostList
              posts={initialFeed}
              viewerName={viewerName}
              viewerUnitName={unit?.name ?? null}
              isAdmin={isAdmin}
              emptyText="No posts yet. Be the first to share something."
            />
          </div>
          <CommunitySidebar
            data={sidebar}
            unit={unit ? { id: unit.id, name: unit.name } : null}
          />
        </div>
      </div>
    </section>
  );
}
