import { and, asc, desc, eq, gte, inArray, or, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { CommunityContext } from "@/lib/community/context";
import {
  canViewDiscipleshipGroup,
  leadsDiscipleshipGroup,
  type DiscipleshipAccess,
} from "@/lib/community/discipleship-access";
import { CommunityError, POSTING_PAUSED_COPY } from "@/lib/community/errors";
import {
  canModerateGroup,
  canPostInGroup,
  canViewGroupContent,
  managesGroup,
  type GroupAccess,
} from "@/lib/community/groups";
import {
  DEFAULT_FEED_VIEW,
  FEED_TOP_WINDOW_DAYS,
  type FeedView,
} from "@/lib/community/feed-view";
import { minorBirthYearFloor } from "@/lib/community/messaging";
import { normalisePostInput, type PostKind } from "@/lib/community/post-input";
import {
  assertCanCreatePost,
  assertPastNewAccountCooldown,
} from "@/lib/community/rate-limit";
import {
  canPostOfficial,
  canPostToCommunity,
  canPostToUnit,
  canSeeUnit,
  managesUnit,
} from "@/lib/community/permissions";
import { getDiscipleshipAccess } from "@/lib/db/queries/community-discipleship";
import { getGroupAccess } from "@/lib/db/queries/community-groups";

export type PostImage = { url: string; key: string };

export type SharedFromPost = {
  id: number;
  authorName: string;
  body: string;
  images: PostImage[];
};

export type PostScope = "global" | "unit" | "discipleship" | "group";

/**
 * The viewer's standing in the private space a post belongs to. `null` for
 * global and unit posts, which need nothing beyond the community context.
 */
export type PostAccess = {
  discipleship: DiscipleshipAccess | null;
  group: GroupAccess | null;
};

export type FeedPost = {
  id: number;
  scope: PostScope;
  unitId: number | null;
  unitName: string | null;
  /** Set for posts inside a discipleship group's private space. */
  discipleshipGroupId: number | null;
  discipleshipGroupName: string | null;
  /** Set for posts inside a member-created group. */
  groupId: number | null;
  groupName: string | null;
  authorKind: "ministry" | "leader" | "member";
  authorName: string;
  kind: PostKind;
  topic: string | null;
  title: string | null;
  body: string;
  images: PostImage[];
  pinned: boolean;
  publishedAt: string;
  lastActivityAt: string;
  reactionCount: number;
  reactedByMe: boolean;
  commentCount: number;
  shareCount: number;
  sharedFrom: SharedFromPost | null;
  isMine: boolean;
  canManage: boolean;
  /** False in a member group the viewer can read but has not joined. */
  canComment: boolean;
  /** The author's user id, present only when the viewer may message them. */
  messageUserId: string | null;
};

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "Someone";
}

function displayAuthor(authorKind: FeedPost["authorKind"], name: string | null) {
  return authorKind === "ministry" ? "Pleros" : firstName(name ?? "Someone");
}

function normaliseImages(value: unknown): PostImage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (item): item is PostImage =>
        Boolean(item) &&
        typeof (item as PostImage).url === "string" &&
        typeof (item as PostImage).key === "string",
    )
    .slice(0, 4);
}

const srcPost = alias(schema.communityPosts, "src_post");
const srcAuthor = alias(schema.users, "src_author");

/** Shared column set for every feed-style read. */
function feedColumns(ctx: CommunityContext) {
  return {
    post: schema.communityPosts,
    authorName: schema.users.name,
    unitName: schema.units.name,
    discipleshipGroupName: schema.discipleshipGroups.name,
    groupName: schema.communityGroups.name,
    srcId: srcPost.id,
    srcBody: srcPost.body,
    srcImages: srcPost.images,
    srcStatus: srcPost.status,
    srcAuthorKind: srcPost.authorKind,
    srcAuthorName: srcAuthor.name,
    reactionCount: sql<number>`(
      select count(*) from ${schema.postReactions}
      where ${schema.postReactions.postId} = ${schema.communityPosts.id}
    )::int`,
    reactedByMe: sql<boolean>`exists (
      select 1 from ${schema.postReactions}
      where ${schema.postReactions.postId} = ${schema.communityPosts.id}
        and ${schema.postReactions.userId} = ${ctx.userId}
    )`,
    commentCount: sql<number>`(
      select count(*) from ${schema.communityPostComments}
      where ${schema.communityPostComments.postId} = ${schema.communityPosts.id}
        and ${schema.communityPostComments.status} <> 'removed'
    )::int`,
    // Server-side only: decides whether the author can be messaged.
    authorIsMinor: sql<boolean>`exists (
      select 1 from ${schema.sogpEnrollments}
      where ${schema.sogpEnrollments.userId} = ${schema.communityPosts.authorId}
        and ${schema.sogpEnrollments.birthYear} >= ${minorBirthYearFloor()}
    )`,
  } as const;
}

type FeedRow = {
  post: typeof schema.communityPosts.$inferSelect;
  authorName: string | null;
  unitName: string | null;
  discipleshipGroupName: string | null;
  groupName: string | null;
  srcId: number | null;
  srcBody: string | null;
  srcImages: unknown;
  srcStatus: "published" | "hidden" | "removed" | null;
  srcAuthorKind: "ministry" | "leader" | "member" | null;
  srcAuthorName: string | null;
  reactionCount: number;
  reactedByMe: boolean;
  commentCount: number;
  authorIsMinor: boolean;
};

function mapFeedRow(
  row: FeedRow,
  ctx: CommunityContext,
  access: PostAccess | null = null,
): FeedPost {
  const sharedFrom: SharedFromPost | null =
    row.srcId != null && row.srcStatus === "published"
      ? {
          id: row.srcId,
          authorName: displayAuthor(
            row.srcAuthorKind ?? "member",
            row.srcAuthorName,
          ),
          body: row.srcBody ?? "",
          images: normaliseImages(row.srcImages),
        }
      : null;

  return {
    id: row.post.id,
    scope: row.post.scope,
    unitId: row.post.unitId,
    unitName: row.post.scope === "unit" ? row.unitName : null,
    discipleshipGroupId: row.post.discipleshipGroupId,
    discipleshipGroupName:
      row.post.scope === "discipleship" ? row.discipleshipGroupName : null,
    groupId: row.post.groupId,
    groupName: row.post.scope === "group" ? row.groupName : null,
    authorKind: row.post.authorKind,
    authorName: displayAuthor(row.post.authorKind, row.authorName),
    kind: row.post.kind,
    topic: row.post.topic,
    title: row.post.title,
    body: row.post.body,
    images: normaliseImages(row.post.images),
    pinned: row.post.pinned,
    publishedAt: row.post.publishedAt.toISOString(),
    lastActivityAt: row.post.lastActivityAt.toISOString(),
    reactionCount: row.reactionCount,
    reactedByMe: row.reactedByMe,
    commentCount: row.commentCount,
    shareCount: row.post.shareCount,
    sharedFrom,
    isMine: row.post.authorId === ctx.userId,
    canManage: canModeratePostRow(ctx, row.post, access),
    canComment: canCommentOnPostRow(ctx, row.post, access),
    // Ministry posts are signed "Pleros", so their author is never exposed.
    messageUserId:
      row.post.authorKind !== "ministry" &&
      row.post.authorId !== ctx.userId &&
      !ctx.isMinor &&
      !ctx.messagingBlocked &&
      !row.authorIsMinor
        ? row.post.authorId
        : null,
  };
}

function baseFeedQuery(ctx: CommunityContext) {
  return db
    .select(feedColumns(ctx))
    .from(schema.communityPosts)
    .innerJoin(schema.users, eq(schema.users.id, schema.communityPosts.authorId))
    .leftJoin(schema.units, eq(schema.units.id, schema.communityPosts.unitId))
    .leftJoin(
      schema.discipleshipGroups,
      eq(schema.discipleshipGroups.id, schema.communityPosts.discipleshipGroupId),
    )
    .leftJoin(
      schema.communityGroups,
      eq(schema.communityGroups.id, schema.communityPosts.groupId),
    )
    .leftJoin(srcPost, eq(srcPost.id, schema.communityPosts.sharedFromPostId))
    .leftJoin(srcAuthor, eq(srcAuthor.id, srcPost.authorId));
}

/** Default page size for the paginated community feed. */
export const COMMUNITY_FEED_PAGE_SIZE = 20;

type FeedPageOptions = { limit?: number; offset?: number; view?: FeedView };

const visibleCommentExists = sql`exists (
  select 1 from ${schema.communityPostComments}
  where ${schema.communityPostComments.postId} = ${schema.communityPosts.id}
    and ${schema.communityPostComments.status} <> 'removed'
)`;

/** Likes plus visible comments — the "Top" ranking. */
const engagementSql = sql<number>`(
  (
    select count(*) from ${schema.postReactions}
    where ${schema.postReactions.postId} = ${schema.communityPosts.id}
  ) + (
    select count(*) from ${schema.communityPostComments}
    where ${schema.communityPostComments.postId} = ${schema.communityPosts.id}
      and ${schema.communityPostComments.status} <> 'removed'
  )
)`;

/** Extra `where` clauses for the chosen filter and sort. */
function viewConditions(view: FeedView): SQL[] {
  const conditions: SQL[] = [];
  if (view.filter === "official") {
    conditions.push(eq(schema.communityPosts.kind, "official"));
  }
  if (view.filter === "discussions" || view.sort === "unanswered") {
    conditions.push(eq(schema.communityPosts.kind, "discussion"));
  }
  if (view.sort === "top") {
    conditions.push(
      gte(
        schema.communityPosts.publishedAt,
        new Date(Date.now() - FEED_TOP_WINDOW_DAYS * 86_400_000),
      ),
    );
  }
  if (view.sort === "unanswered") {
    conditions.push(sql`not ${visibleCommentExists}`);
  }
  return conditions;
}

/** Latest keeps pinned posts first; Top and Unanswered rank on merit alone. */
function viewOrder(view: FeedView): SQL[] {
  if (view.sort === "top") {
    return [
      desc(engagementSql),
      desc(schema.communityPosts.publishedAt),
      desc(schema.communityPosts.id),
    ];
  }
  if (view.sort === "unanswered") {
    return [
      desc(schema.communityPosts.publishedAt),
      desc(schema.communityPosts.id),
    ];
  }
  return [
    desc(schema.communityPosts.pinned),
    desc(schema.communityPosts.lastActivityAt),
    desc(schema.communityPosts.id),
  ];
}

/**
 * Global posts plus posts from the viewer's own unit and any unit they manage
 * as its assigned pastor. Discipleship and member-group posts stay in their
 * own spaces.
 */
function viewerScopeFilter(ctx: CommunityContext) {
  const unitIds = [
    ...new Set([...(ctx.unit ? [ctx.unit.id] : []), ...ctx.managedUnitIds]),
  ];
  return unitIds.length > 0
    ? or(
        eq(schema.communityPosts.scope, "global"),
        and(
          eq(schema.communityPosts.scope, "unit"),
          inArray(schema.communityPosts.unitId, unitIds),
        ),
      )
    : eq(schema.communityPosts.scope, "global");
}

/** Global posts + the learner's own-unit posts, in the chosen sort and filter. */
export async function getCommunityFeed(
  ctx: CommunityContext,
  {
    limit = COMMUNITY_FEED_PAGE_SIZE,
    offset = 0,
    view = DEFAULT_FEED_VIEW,
  }: FeedPageOptions = {},
): Promise<FeedPost[]> {
  const rows = await baseFeedQuery(ctx)
    .where(
      and(
        eq(schema.communityPosts.status, "published"),
        viewerScopeFilter(ctx),
        ...viewConditions(view),
      ),
    )
    .orderBy(...viewOrder(view))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => mapFeedRow(row as FeedRow, ctx));
}

/** Published posts belonging to one unit only. */
export async function getUnitPosts(
  unitId: number,
  ctx: CommunityContext,
  {
    limit = COMMUNITY_FEED_PAGE_SIZE,
    offset = 0,
    view = DEFAULT_FEED_VIEW,
  }: FeedPageOptions = {},
): Promise<FeedPost[]> {
  const rows = await baseFeedQuery(ctx)
    .where(
      and(
        eq(schema.communityPosts.status, "published"),
        eq(schema.communityPosts.scope, "unit"),
        eq(schema.communityPosts.unitId, unitId),
        ...viewConditions(view),
      ),
    )
    .orderBy(...viewOrder(view))
    .limit(limit)
    .offset(offset);

  return rows.map((row) => mapFeedRow(row as FeedRow, ctx));
}

/**
 * Published posts inside one discipleship group's private space. Returns
 * nothing unless the viewer is that group's discipler or a current disciple.
 */
export async function getDiscipleshipPosts(
  groupId: number,
  ctx: CommunityContext,
  {
    limit = COMMUNITY_FEED_PAGE_SIZE,
    offset = 0,
    view = DEFAULT_FEED_VIEW,
  }: FeedPageOptions = {},
): Promise<FeedPost[]> {
  const discipleship = await getDiscipleshipAccess(ctx.userId);
  if (!canViewDiscipleshipGroup(discipleship, groupId)) return [];

  const rows = await baseFeedQuery(ctx)
    .where(
      and(
        eq(schema.communityPosts.status, "published"),
        eq(schema.communityPosts.scope, "discipleship"),
        eq(schema.communityPosts.discipleshipGroupId, groupId),
        ...viewConditions(view),
      ),
    )
    .orderBy(...viewOrder(view))
    .limit(limit)
    .offset(offset);

  const access: PostAccess = { discipleship, group: null };
  return rows.map((row) => mapFeedRow(row as FeedRow, ctx, access));
}

/**
 * Published posts inside one member-created group. Returns nothing unless the
 * viewer may read it: anyone for a public group, members for a private one.
 */
export async function getGroupPosts(
  groupId: number,
  ctx: CommunityContext,
  {
    limit = COMMUNITY_FEED_PAGE_SIZE,
    offset = 0,
    view = DEFAULT_FEED_VIEW,
  }: FeedPageOptions = {},
): Promise<FeedPost[]> {
  const group = await getGroupAccess(ctx.userId, groupId);
  if (!group || !canViewGroupContent(group, ctx.isAdmin)) return [];

  const rows = await baseFeedQuery(ctx)
    .where(
      and(
        eq(schema.communityPosts.status, "published"),
        eq(schema.communityPosts.scope, "group"),
        eq(schema.communityPosts.groupId, groupId),
        ...viewConditions(view),
      ),
    )
    .orderBy(...viewOrder(view))
    .limit(limit)
    .offset(offset);

  const access: PostAccess = { discipleship: null, group };
  return rows.map((row) => mapFeedRow(row as FeedRow, ctx, access));
}

/** A single post for the detail page / share deep-link. */
export async function getPost(
  ctx: CommunityContext,
  postId: number,
): Promise<FeedPost | null> {
  const rows = await baseFeedQuery(ctx)
    .where(eq(schema.communityPosts.id, postId))
    .limit(1);
  const row = rows[0] as FeedRow | undefined;
  if (!row) return null;
  if (row.post.status !== "published" && !ctx.isAdmin) return null;

  // Scope guard: unit posts for that unit + admins; discipleship posts for
  // the group's own members only.
  const access = await getPostAccess(ctx, row.post);
  if (!canViewPostRow(ctx, row.post, access)) return null;
  return mapFeedRow(row, ctx, access);
}

export type CommunitySidebar = {
  latest: Array<Pick<FeedPost, "id" | "title" | "body" | "authorName">>;
  active: Array<
    Pick<FeedPost, "id" | "title" | "body" | "authorName" | "commentCount">
  >;
};

/** Right-rail payload: newest posts + the ones with live discussion. */
export async function getCommunitySidebar(
  ctx: CommunityContext,
): Promise<CommunitySidebar> {
  const scopeFilter = viewerScopeFilter(ctx);

  const commentCountSql = sql<number>`(
    select count(*) from ${schema.communityPostComments}
    where ${schema.communityPostComments.postId} = ${schema.communityPosts.id}
      and ${schema.communityPostComments.status} <> 'removed'
  )::int`;

  const cols = {
    id: schema.communityPosts.id,
    title: schema.communityPosts.title,
    body: schema.communityPosts.body,
    authorKind: schema.communityPosts.authorKind,
    authorName: schema.users.name,
    commentCount: commentCountSql,
  } as const;

  const [latestRows, activeRows] = await Promise.all([
    db
      .select(cols)
      .from(schema.communityPosts)
      .innerJoin(
        schema.users,
        eq(schema.users.id, schema.communityPosts.authorId),
      )
      .where(and(eq(schema.communityPosts.status, "published"), scopeFilter))
      .orderBy(desc(schema.communityPosts.publishedAt))
      .limit(5),
    db
      .select(cols)
      .from(schema.communityPosts)
      .innerJoin(
        schema.users,
        eq(schema.users.id, schema.communityPosts.authorId),
      )
      .where(
        and(
          eq(schema.communityPosts.status, "published"),
          visibleCommentExists,
          scopeFilter,
        ),
      )
      .orderBy(desc(schema.communityPosts.lastActivityAt))
      .limit(5),
  ]);

  return {
    latest: latestRows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      authorName: displayAuthor(r.authorKind, r.authorName),
    })),
    active: activeRows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      authorName: displayAuthor(r.authorKind, r.authorName),
      commentCount: r.commentCount,
    })),
  };
}

// ─── Create ───────────────────────────────────────────────────────────────

function authorKindFor(ctx: CommunityContext): FeedPost["authorKind"] {
  if (ctx.isAdmin) return "ministry";
  if (ctx.isUnitLeader || ctx.managedUnitIds.length > 0) return "leader";
  return "member";
}

/** Enrolled learners post community-wide; a unit takes posts from its own members. */
function assertCanPostTo(
  ctx: CommunityContext,
  scope: "global" | "unit",
  unitId: number | null,
) {
  const allowed =
    scope === "global"
      ? canPostToCommunity(ctx)
      : unitId != null && canPostToUnit(ctx, unitId);
  if (!allowed) {
    throw new CommunityError("You can't post here.");
  }
}

/**
 * The one create path used by every learner. `scope: "unit"` requires the
 * caller to be in that unit (or an admin). Members raise discussions; only a
 * leader in their own unit or an admin may publish an `official` post.
 */
export async function createFeedPost(input: {
  ctx: CommunityContext;
  scope: PostScope;
  unitId?: number | null;
  /** Required for `scope: "discipleship"`. */
  discipleshipGroupId?: number | null;
  /** Required for `scope: "group"`. */
  groupId?: number | null;
  kind?: PostKind;
  title: string | null;
  body: string;
  topic?: string | null;
  images?: PostImage[];
}): Promise<{ id: number }> {
  const { ctx } = input;
  if (ctx.postingBlocked) throw new CommunityError(POSTING_PAUSED_COPY);
  assertPastNewAccountCooldown(ctx);
  await assertCanCreatePost(ctx.userId);

  let unitId: number | null = null;
  let discipleshipGroupId: number | null = null;
  let groupId: number | null = null;
  let mayPostOfficial: boolean;
  let authorKind: FeedPost["authorKind"];

  if (input.scope === "group") {
    // A member-created group takes posts from its members; its owner and
    // moderators may also post announcements.
    groupId = input.groupId ?? null;
    const access = groupId != null ? await getGroupAccess(ctx.userId, groupId) : null;
    if (!access || !canPostInGroup(access)) {
      throw new CommunityError("Join this group to post in it.");
    }
    mayPostOfficial = managesGroup(access);
    authorKind = mayPostOfficial ? "leader" : "member";
  } else if (input.scope === "discipleship") {
    // A discipleship space takes posts from its discipler and current
    // disciples only; the discipler may also post announcements there.
    discipleshipGroupId = input.discipleshipGroupId ?? null;
    const access = await getDiscipleshipAccess(ctx.userId);
    if (
      discipleshipGroupId == null ||
      !canViewDiscipleshipGroup(access, discipleshipGroupId)
    ) {
      throw new CommunityError("You can't post in this group.");
    }
    mayPostOfficial = leadsDiscipleshipGroup(access, discipleshipGroupId);
    authorKind = mayPostOfficial ? "leader" : "member";
  } else {
    if (input.scope === "unit") {
      unitId = input.unitId ?? ctx.unit?.id ?? null;
      if (!unitId) throw new CommunityError("You are not in a group yet.");
    }
    assertCanPostTo(ctx, input.scope, unitId);
    mayPostOfficial = canPostOfficial(ctx, input.scope, unitId);
    authorKind = authorKindFor(ctx);
  }

  const kind = input.kind ?? (mayPostOfficial ? "official" : "discussion");
  if (kind === "official" && !mayPostOfficial) {
    throw new CommunityError(
      "Only leaders and admins can post announcements here.",
    );
  }

  const images = normaliseImages(input.images);
  const parsed = normalisePostInput({
    kind,
    title: input.title,
    body: input.body,
    topic: input.topic,
    hasImages: images.length > 0,
  });
  if (!parsed.ok) throw new CommunityError(parsed.error);

  const [post] = await db
    .insert(schema.communityPosts)
    .values({
      scope: input.scope,
      unitId,
      discipleshipGroupId,
      groupId,
      authorId: ctx.userId,
      authorKind,
      kind: parsed.value.kind,
      topic: parsed.value.topic,
      title: parsed.value.title,
      body: parsed.value.body,
      images,
    })
    .returning({ id: schema.communityPosts.id });
  return post;
}

/** Admin/official global post — keeps `ministry` authorship + `images`. */
export async function createGlobalPost(input: {
  authorId: string;
  title: string | null;
  body: string;
  images?: PostImage[];
}) {
  const [post] = await db
    .insert(schema.communityPosts)
    .values({
      scope: "global",
      authorId: input.authorId,
      authorKind: "ministry",
      title: input.title,
      body: input.body,
      images: normaliseImages(input.images),
    })
    .returning({ id: schema.communityPosts.id });
  return post;
}

/**
 * In-app repost. Flattens a reshare-of-a-reshare to its root, copies the
 * sharer's note as the body, and bumps the source's share count.
 */
export async function sharePost(input: {
  ctx: CommunityContext;
  sourcePostId: number;
  scope: "global" | "unit";
  unitId?: number | null;
  note: string;
}): Promise<{ id: number }> {
  const { ctx } = input;
  if (ctx.postingBlocked) throw new CommunityError(POSTING_PAUSED_COPY);
  await assertCanCreatePost(ctx.userId);

  const [source] = await db
    .select({
      id: schema.communityPosts.id,
      status: schema.communityPosts.status,
      scope: schema.communityPosts.scope,
      unitId: schema.communityPosts.unitId,
      sharedFromPostId: schema.communityPosts.sharedFromPostId,
    })
    .from(schema.communityPosts)
    .where(eq(schema.communityPosts.id, input.sourcePostId))
    .limit(1);
  if (!source || source.status !== "published") {
    throw new Error("That post is no longer available.");
  }
  // A unit post can only be reshared by someone who can see it; a
  // discipleship post never leaves its group.
  if (
    source.scope === "discipleship" ||
    source.scope === "group" ||
    (source.scope === "unit" && !canSeeUnit(ctx, source.unitId))
  ) {
    throw new Error("You cannot share that post.");
  }

  const rootId = source.sharedFromPostId ?? source.id;

  let unitId: number | null = null;
  if (input.scope === "unit") {
    unitId = input.unitId ?? ctx.unit?.id ?? null;
    if (!unitId) throw new Error("You are not in a unit yet.");
  }
  // Reposts stay with leaders (own unit) and admins.
  if (!canPostOfficial(ctx, input.scope, unitId)) {
    throw new Error("Only leaders and admins can share to the feed.");
  }

  const [post] = await db
    .insert(schema.communityPosts)
    .values({
      scope: input.scope,
      unitId,
      authorId: ctx.userId,
      authorKind: authorKindFor(ctx),
      title: null,
      body: input.note.trim(),
      sharedFromPostId: rootId,
    })
    .returning({ id: schema.communityPosts.id });

  await db
    .update(schema.communityPosts)
    .set({ shareCount: sql`${schema.communityPosts.shareCount} + 1` })
    .where(eq(schema.communityPosts.id, rootId));

  return post;
}

export async function setPostPinned(postId: number, pinned: boolean) {
  await db
    .update(schema.communityPosts)
    .set({ pinned, updatedAt: new Date() })
    .where(eq(schema.communityPosts.id, postId));
}

export async function setPostStatus(
  postId: number,
  status: "published" | "hidden" | "removed",
) {
  await db
    .update(schema.communityPosts)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.communityPosts.id, postId));
}

export async function editPost(input: {
  postId: number;
  title: string | null;
  body: string;
  /** Omit to leave the topic as it is. */
  topic?: string | null;
  images?: PostImage[];
}) {
  await db
    .update(schema.communityPosts)
    .set({
      title: input.title,
      body: input.body,
      ...(input.topic !== undefined ? { topic: input.topic } : {}),
      ...(input.images ? { images: normaliseImages(input.images) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(schema.communityPosts.id, input.postId));
}

/** Author + scope of a post — used to gate report / moderation. */
export async function getPostMeta(postId: number) {
  const [row] = await db
    .select({
      id: schema.communityPosts.id,
      authorId: schema.communityPosts.authorId,
      scope: schema.communityPosts.scope,
      unitId: schema.communityPosts.unitId,
      discipleshipGroupId: schema.communityPosts.discipleshipGroupId,
      groupId: schema.communityPosts.groupId,
      kind: schema.communityPosts.kind,
      title: schema.communityPosts.title,
      images: schema.communityPosts.images,
      status: schema.communityPosts.status,
    })
    .from(schema.communityPosts)
    .where(eq(schema.communityPosts.id, postId))
    .limit(1);
  return row ?? null;
}

/** The scope fields of a post that decide who may see and moderate it. */
export type PostScopeRow = {
  scope: PostScope;
  unitId: number | null;
  discipleshipGroupId: number | null;
  groupId: number | null;
};

/**
 * The viewer's standing in a post's private space. Only discipleship and
 * member-group posts cost the extra lookup; `null` means "nothing to look up".
 */
export async function getPostAccess(
  ctx: CommunityContext,
  row: PostScopeRow,
): Promise<PostAccess | null> {
  if (row.scope === "discipleship") {
    return {
      discipleship: await getDiscipleshipAccess(ctx.userId),
      group: null,
    };
  }
  if (row.scope === "group" && row.groupId != null) {
    return {
      discipleship: null,
      group: await getGroupAccess(ctx.userId, row.groupId),
    };
  }
  return null;
}

/**
 * Global posts are for every member; unit posts for that unit, its managers
 * and admins; discipleship posts for the group's discipler and current
 * disciples only; member-group posts by the group's privacy.
 */
export function canViewPostRow(
  ctx: CommunityContext,
  row: PostScopeRow,
  access: PostAccess | null,
): boolean {
  if (row.scope === "discipleship") {
    return (
      access?.discipleship != null &&
      row.discipleshipGroupId != null &&
      canViewDiscipleshipGroup(access.discipleship, row.discipleshipGroupId)
    );
  }
  if (row.scope === "group") {
    return (
      access?.group != null && canViewGroupContent(access.group, ctx.isAdmin)
    );
  }
  if (row.scope === "unit") return canSeeUnit(ctx, row.unitId);
  return true;
}

/** Convenience for callers that only hold a post's scope fields. */
export async function canViewPost(
  ctx: CommunityContext,
  row: PostScopeRow,
): Promise<boolean> {
  return canViewPostRow(ctx, row, await getPostAccess(ctx, row));
}

/**
 * Reading a public group is open, but commenting there needs membership (or
 * admin rights). Everywhere else, whoever can see a post can comment on it.
 */
export function canCommentOnPostRow(
  ctx: CommunityContext,
  row: PostScopeRow,
  access: PostAccess | null,
): boolean {
  if (!canViewPostRow(ctx, row, access)) return false;
  if (row.scope !== "group") return true;
  return ctx.isAdmin || (access?.group != null && canPostInGroup(access.group));
}

/**
 * Who may pin and hide a post: admins on global posts; admins, the assigned
 * pastor and the member leader on a unit's posts; the discipler in their own
 * discipleship group (admins act there only through the report queue); a
 * member group's owner and moderators, or an admin.
 */
export function canModeratePostRow(
  ctx: CommunityContext,
  row: PostScopeRow,
  access: PostAccess | null = null,
) {
  if (row.scope === "discipleship") {
    return (
      access?.discipleship != null &&
      row.discipleshipGroupId != null &&
      leadsDiscipleshipGroup(access.discipleship, row.discipleshipGroupId)
    );
  }
  if (row.scope === "group") {
    return access?.group != null && canModerateGroup(access.group, ctx.isAdmin);
  }
  if (row.scope === "unit") return managesUnit(ctx, row.unitId);
  return ctx.isAdmin;
}

export async function assertCanModeratePost(
  ctx: CommunityContext,
  postId: number,
) {
  const row = await getPostMeta(postId);
  if (!row) throw new Error("Post not found");
  if (!canModeratePostRow(ctx, row, await getPostAccess(ctx, row))) {
    throw new Error("Forbidden");
  }
}

/** Idempotent toggle of the current user's "like" on a post. */
export async function togglePostReaction(input: {
  postId: number;
  userId: string;
}): Promise<{ reacted: boolean }> {
  const existing = await db
    .select({ id: schema.postReactions.id })
    .from(schema.postReactions)
    .where(
      and(
        eq(schema.postReactions.postId, input.postId),
        eq(schema.postReactions.userId, input.userId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db
      .delete(schema.postReactions)
      .where(
        and(
          eq(schema.postReactions.postId, input.postId),
          eq(schema.postReactions.userId, input.userId),
        ),
      );
    return { reacted: false };
  }

  await db
    .insert(schema.postReactions)
    .values({ postId: input.postId, userId: input.userId })
    .onConflictDoNothing();
  return { reacted: true };
}

// ─── Moderation queue (ported from the old discussion module) ──────────────

export type FlagTargetType = "post" | "comment" | "message";

export async function flagContent(input: {
  reporterId: string;
  targetType: FlagTargetType;
  targetId: number;
  reason: string;
}) {
  await db
    .insert(schema.contentFlags)
    .values({
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason.trim().slice(0, 500) || "Reported",
    })
    .onConflictDoNothing();
}

export type OpenFlag = {
  id: number;
  targetType: FlagTargetType;
  targetId: number;
  reason: string;
  reporterName: string;
  createdAt: string;
  preview: string | null;
  /** Who wrote the reported content — lets an admin restrict that member. */
  authorId: string | null;
  authorName: string | null;
};

/**
 * Open flags an admin (all) or a leader (own unit) should action. Pass
 * `unitId` to narrow the list to one unit. Reported private messages are
 * admin-only and only the reported message itself is ever loaded.
 */
export async function listOpenFlags(
  ctx: CommunityContext,
  { unitId }: { unitId?: number } = {},
): Promise<OpenFlag[]> {
  const rows = await db
    .select({
      flag: schema.contentFlags,
      reporterName: schema.users.name,
    })
    .from(schema.contentFlags)
    .innerJoin(schema.users, eq(schema.users.id, schema.contentFlags.reporterId))
    .where(eq(schema.contentFlags.status, "open"))
    .orderBy(asc(schema.contentFlags.createdAt))
    .limit(200);

  const idsOf = (type: FlagTargetType) =>
    rows.filter((r) => r.flag.targetType === type).map((r) => r.flag.targetId);
  const postIds = idsOf("post");
  const commentIds = idsOf("comment");
  const messageIds = ctx.isAdmin && unitId == null ? idsOf("message") : [];

  const [posts, comments, messages] = await Promise.all([
    postIds.length
      ? db
          .select({
            id: schema.communityPosts.id,
            body: schema.communityPosts.body,
            title: schema.communityPosts.title,
            authorId: schema.communityPosts.authorId,
            unitId: schema.communityPosts.unitId,
            scope: schema.communityPosts.scope,
          })
          .from(schema.communityPosts)
          .where(inArray(schema.communityPosts.id, postIds))
      : Promise.resolve([]),
    commentIds.length
      ? db
          .select({
            id: schema.communityPostComments.id,
            body: schema.communityPostComments.body,
            authorId: schema.communityPostComments.authorId,
            postId: schema.communityPostComments.postId,
          })
          .from(schema.communityPostComments)
          .where(inArray(schema.communityPostComments.id, commentIds))
      : Promise.resolve([]),
    messageIds.length
      ? db
          .select({
            id: schema.dmMessages.id,
            body: schema.dmMessages.body,
            authorId: schema.dmMessages.senderId,
          })
          .from(schema.dmMessages)
          .where(inArray(schema.dmMessages.id, messageIds))
      : Promise.resolve([]),
  ]);

  const commentPosts = comments.length
    ? await db
        .select({
          id: schema.communityPosts.id,
          unitId: schema.communityPosts.unitId,
          scope: schema.communityPosts.scope,
        })
        .from(schema.communityPosts)
        .where(
          inArray(
            schema.communityPosts.id,
            comments.map((c) => c.postId),
          ),
        )
    : [];

  const authorIds = [
    ...new Set(
      [...posts, ...comments, ...messages].map((item) => item.authorId),
    ),
  ];
  const authors = authorIds.length
    ? await db
        .select({ id: schema.users.id, name: schema.users.name })
        .from(schema.users)
        .where(inArray(schema.users.id, authorIds))
    : [];

  const postById = new Map(posts.map((p) => [p.id, p]));
  const commentById = new Map(comments.map((c) => [c.id, c]));
  const messageById = new Map(messages.map((m) => [m.id, m]));
  const postMetaById = new Map(commentPosts.map((p) => [p.id, p]));
  const authorNameById = new Map(authors.map((a) => [a.id, a.name]));

  function unitScopeOf(flag: (typeof rows)[number]["flag"]): {
    scope: PostScope;
    unitId: number | null;
  } | null {
    if (flag.targetType === "post") {
      const p = postById.get(flag.targetId);
      return p ? { scope: p.scope, unitId: p.unitId } : null;
    }
    const c = commentById.get(flag.targetId);
    if (!c) return null;
    const p = postMetaById.get(c.postId);
    return p ? { scope: p.scope, unitId: p.unitId } : null;
  }

  const result: OpenFlag[] = [];
  for (const row of rows) {
    const { flag } = row;
    let preview: string | null = null;
    let authorId: string | null = null;
    let targetType: FlagTargetType;

    if (flag.targetType === "message") {
      const message = messageById.get(flag.targetId);
      if (!message) continue;
      targetType = "message";
      preview = message.body.slice(0, 500);
      authorId = message.authorId;
    } else if (flag.targetType === "post" || flag.targetType === "comment") {
      targetType = flag.targetType;
      const meta = unitScopeOf(flag);
      const inUnit = (id: number | null | undefined) =>
        meta != null && meta.scope === "unit" && meta.unitId === id;
      if (unitId != null && !inUnit(unitId)) continue;
      // Admins see every report; a unit's managers see their own unit's.
      if (
        !ctx.isAdmin &&
        !(meta?.scope === "unit" && managesUnit(ctx, meta.unitId))
      ) {
        continue;
      }

      // Admins cannot open a discipleship space, so its reports carry more text.
      const previewLength = meta?.scope === "discipleship" ? 500 : 80;
      if (flag.targetType === "post") {
        const post = postById.get(flag.targetId);
        preview = post
          ? (post.title ? `${post.title} — ${post.body}` : post.body).slice(
              0,
              previewLength,
            )
          : null;
        authorId = post?.authorId ?? null;
      } else {
        const comment = commentById.get(flag.targetId);
        preview = comment?.body.slice(0, previewLength) ?? null;
        authorId = comment?.authorId ?? null;
      }
    } else {
      // Legacy `thread` flags from the removed discussion module.
      continue;
    }

    result.push({
      id: flag.id,
      targetType,
      targetId: flag.targetId,
      reason: flag.reason,
      reporterName: firstName(row.reporterName),
      createdAt: flag.createdAt.toISOString(),
      preview,
      authorId,
      authorName: authorId
        ? firstName(authorNameById.get(authorId) ?? "Someone")
        : null,
    });
  }
  return result;
}

export async function resolveFlag(input: {
  flagId: number;
  handledBy: string;
  status: "actioned" | "dismissed";
}) {
  await db
    .update(schema.contentFlags)
    .set({
      status: input.status,
      handledBy: input.handledBy,
      handledAt: new Date(),
    })
    .where(eq(schema.contentFlags.id, input.flagId));
}

export type AdminPost = {
  id: number;
  title: string | null;
  body: string;
  pinned: boolean;
  status: "published" | "hidden" | "removed";
  publishedAt: string;
};

export async function listGlobalPosts(): Promise<AdminPost[]> {
  const rows = await db
    .select()
    .from(schema.communityPosts)
    .where(eq(schema.communityPosts.scope, "global"))
    .orderBy(desc(schema.communityPosts.publishedAt))
    .limit(50);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body,
    pinned: row.pinned,
    status: row.status,
    publishedAt: row.publishedAt.toISOString(),
  }));
}

/** Title + body of a global post — used by the admin Telegram mirror. */
export async function getPostForBroadcast(postId: number) {
  const [row] = await db
    .select({
      title: schema.communityPosts.title,
      body: schema.communityPosts.body,
    })
    .from(schema.communityPosts)
    .where(
      and(
        eq(schema.communityPosts.id, postId),
        inArray(schema.communityPosts.scope, ["global"]),
      ),
    )
    .limit(1);
  return row ?? null;
}
