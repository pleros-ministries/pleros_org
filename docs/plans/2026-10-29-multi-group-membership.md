# Multi-group membership (29 October 2026)

A person can be in more than one group. This replaces the "one overseer per person" rule of 19 October (`docs/plans/groups-as-oversight.md`, AGENTS.md).

## Decisions (user, 29 October)

- **Every leader oversees them.** Each group a person is in counts: every one of those leaders sees them in Oversight (Structure, Reports, Updates) and their reports. Oversight becomes a graph, not a tree: the Pastor may see one person under two leaders.
- **Accepting an invite adds the group and keeps the old one.** "This moves you" and "Move to this group" go. Leaving a group is its own action on the group page.
- **Questions after a teaching:** the person chooses which leader gets it, defaulting to the group they joined first.
- **Up to 5 groups** a person can be in (`DISCIPLESHIP_GROUPS_JOINED_MAX`), checked when joining; easy to raise later.
- Still true: joining always needs the person's accept; you can't join a group you lead; no one can end up overseeing themselves (the loop check now looks at every route up, not one chain).

## Today (what assumes one group)

- **Database:** two unique indexes allow one active membership per person (`discipleship_memberships_active_member_idx` on `member_user_id`, and the older `…_active_disciple_idx` on `disciple_enrollment_id`). All 140 active memberships are one per person.
- **Joining:** `evaluateDiscipleshipJoin` refuses `already_in_group`; `joinGroupInTransaction` ends the old membership when `moveFromCurrent` is set; `respondToInvitation` passes `move`.
- **Oversight tree** (`lib/db/queries/oversight-tree.ts`): `loadOverseerChain` follows one line up; `listDescendants` can already walk several, but returns a person once per route.
- **Oversight view** (`lib/db/queries/group-oversight.ts`): `edgeOf` keeps one edge per person (one group, one overseer, one depth); `memberOf` is the one group you're in.
- **Member side:** `getCommunityDiscipleship().joined`, `getDiscipleshipDashboard().myDiscipler`, Community Home's `joinedGroup`, the invitation's `currentGroup`, the member group page: each holds a single group.

## Migration 0077 (shown before applying; not applied)

```sql
-- Multi-group membership (user, 29 October): a person may be active in several
-- groups. The one-membership-per-person indexes go; one active membership per
-- person per group stays.
DROP INDEX IF EXISTS "discipleship_memberships_active_member_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "discipleship_memberships_active_disciple_idx";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "discipleship_memberships_active_group_member_idx"
  ON "discipleship_memberships" ("group_id", "member_user_id") WHERE "status" = 'active';
```

No data changes: every existing membership stays as it is.

## Code changes

1. **Join rules:** replace `already_in_group` with a five-group limit; `joinGroupInTransaction` and `respondToInvitation` stop moving people; refuse a second active membership in the same group instead. The loop check takes the union of every overseer route (recursive query over all memberships).
2. **Leave a group:** a member-side "Leave this group" (confirm; ends that one membership; the leader is told by name only).
3. **Oversight:** a person keeps every edge. Structure and Reports list them under each of their groups; people counts and report rates count each person once (dedupe by user id). Updates mention a person once. `memberOf` becomes "Groups you're under" (a list).
4. **Member side:** Community Home's "Groups you're under" shows every group you're in; the member group page and `myDiscipler` take the group from the address; the question pop-up after a teaching lets you choose the leader.
5. **Invitations:** the invite page drops "This moves you"; it says "You'll stay in {group} too".
6. **Copy and docs:** AGENTS.md (Groups as oversight), the handover, DESIGN.md if any screen changes.

## Notes

- **Branch placement** for Oversight's branch pastors already comes from the person, not the group, so it doesn't change.

## Screens to mock up first

1. The invitation page when you're already in a group ("Join as well").
2. Community Home's "Groups you're under" with two groups.
3. The member group page with "Leave this group".
4. Oversight Structure for a leader whose member also sits in another leader's group.
