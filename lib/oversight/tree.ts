/**
 * Groups as oversight (Pastor, 19 October): the leader of the group you are in
 * is your overseer, so oversight is a tree of people. These are the pure rules;
 * `lib/db/queries/oversight-tree.ts` loads the data and takes the lock.
 */

/** Deepest chain the tree walks; deeper is treated as a data error, never a loop. */
export const OVERSIGHT_MAX_DEPTH = 50;

/** Each person's overseer, child user id → overseer user id. */
export type OverseerMap = ReadonlyMap<string, string>;

/** Overseers from nearest to furthest. Stops at a repeat or the depth limit. */
export function ancestorsOf(overseers: OverseerMap, userId: string): string[] {
  const chain: string[] = [];
  const seen = new Set([userId]);
  let current = overseers.get(userId);
  while (current && !seen.has(current) && chain.length < OVERSIGHT_MAX_DEPTH) {
    chain.push(current);
    seen.add(current);
    current = overseers.get(current);
  }
  return chain;
}

/**
 * Whether `joinerId` joining a group led by `leaderId` would make someone
 * their own overseer at any depth: the joiner leads the group, or already
 * oversees its leader somewhere up the chain.
 */
export function wouldCreateLoop(leaderAncestors: readonly string[], joinerId: string, leaderId: string): boolean {
  return joinerId === leaderId || leaderAncestors.includes(joinerId);
}

export type OversightViewer = {
  userId: string;
  isAdmin: boolean;
  isPastor: boolean;
  /** Branches a branch pastor covers; empty for everyone else. */
  branchIds: readonly number[];
};

/**
 * Who may see a person's full daily report and status (user decision,
 * 19 October): anyone above them in the tree, the Pastor, a branch pastor
 * covering a branch they are placed in, and admins. Never yourself through
 * this rule; your own report has its own pages.
 */
export function decideOversight(input: {
  viewer: OversightViewer;
  subjectId: string;
  subjectAncestors: readonly string[];
  subjectBranchIds: readonly number[];
}): boolean {
  const { viewer, subjectId } = input;
  if (viewer.userId === subjectId) return false;
  if (viewer.isAdmin || viewer.isPastor) return true;
  if (input.subjectAncestors.includes(viewer.userId)) return true;
  return viewer.branchIds.length > 0 && input.subjectBranchIds.some(id => viewer.branchIds.includes(id));
}
