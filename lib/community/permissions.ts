/**
 * Who may create feed content and who manages a location group. Pure so it can
 * be unit-tested and shared between the server actions, the query layer and
 * the UI. `CommunityContext` is a structural superset of `PostPermCtx`, so
 * callers pass `ctx` directly.
 */
export type PostPermCtx = {
  isAdmin: boolean;
  isUnitLeader: boolean;
  enrollmentId: number | null;
  unit: { id: number } | null;
  /** Location groups this user is the assigned pastor for. */
  managedUnitIds: number[];
};

/**
 * A location group is managed by admins, the pastor assigned to its region,
 * and its appointed member leader where there is one.
 */
export function managesUnit(
  ctx: PostPermCtx,
  unitId: number | null | undefined,
): boolean {
  if (unitId == null) return false;
  return (
    ctx.isAdmin ||
    (ctx.isUnitLeader && ctx.unit?.id === unitId) ||
    ctx.managedUnitIds.includes(unitId)
  );
}

/** A unit's own members, plus everyone who manages it. */
export function canSeeUnit(
  ctx: PostPermCtx,
  unitId: number | null | undefined,
): boolean {
  if (unitId == null) return false;
  return ctx.unit?.id === unitId || managesUnit(ctx, unitId);
}

/** True for admins, unit leaders and pastors with an assigned region. */
export function managesAnyUnit(ctx: PostPermCtx): boolean {
  return ctx.isAdmin || ctx.isUnitLeader || ctx.managedUnitIds.length > 0;
}

/** Community-wide posts — any enrolled learner, an assigned pastor, or an admin. */
export function canPostToCommunity(ctx: PostPermCtx): boolean {
  return (
    ctx.isAdmin || ctx.enrollmentId !== null || ctx.managedUnitIds.length > 0
  );
}

/** Unit posts — the unit's members and whoever manages it. */
export function canPostToUnit(ctx: PostPermCtx, unitId: number): boolean {
  return canSeeUnit(ctx, unitId);
}

/** True when the viewer can create a post somewhere — drives composer visibility. */
export function canPostAnywhere(ctx: PostPermCtx): boolean {
  return canPostToCommunity(ctx);
}

/**
 * Official posts (announcements) — an admin anywhere, or whoever manages the
 * unit being posted to. Everyone else raises discussions.
 */
export function canPostOfficial(
  ctx: PostPermCtx,
  scope: "global" | "unit",
  unitId: number | null,
): boolean {
  if (ctx.isAdmin) return true;
  return scope === "unit" && managesUnit(ctx, unitId);
}

/** True when the viewer can publish an announcement or repost somewhere. */
export function canPostOfficialAnywhere(ctx: PostPermCtx): boolean {
  return managesAnyUnit(ctx);
}
