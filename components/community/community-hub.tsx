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
  unit,
  isUnitLeader,
  isAdmin,
}: {
  initialFeed: FeedPost[];
  sidebar: SidebarData;
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
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="grid gap-4">
            <FeedComposer unitName={unit?.name ?? null} />
            <PostList
              posts={initialFeed}
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
