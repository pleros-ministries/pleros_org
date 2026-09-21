/**
 * Who may create feed content. Pure so it can be unit-tested and shared between
 * the server actions, the query layer and the UI. `CommunityContext` is a
 * structural superset of `PostPermCtx`, so callers pass `ctx` directly.
 */
export type PostPermCtx = {
  isAdmin: boolean;
  isUnitLeader: boolean;
  unit: { id: number } | null;
};

/** Community-wide (author kind `ministry`) posts — admins only. */
export function canPostToCommunity(ctx: PostPermCtx): boolean {
  return ctx.isAdmin;
}

/** Unit posts — an admin, or the leader of that specific unit. */
export function canPostToUnit(ctx: PostPermCtx, unitId: number): boolean {
  return ctx.isAdmin || (ctx.isUnitLeader && ctx.unit?.id === unitId);
}

/** True when the viewer can create a post somewhere — drives composer visibility. */
export function canPostAnywhere(ctx: PostPermCtx): boolean {
  return ctx.isAdmin || ctx.isUnitLeader;
}
