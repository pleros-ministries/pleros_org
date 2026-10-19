# Groups as oversight

The Pastor's direction from 19 October: groups replace the church org chart. The person who adds you to their group is your overseer. You report in the group you belong to, and you oversee the groups you lead.

## Decisions so far

- **One overseer per person.** You belong to one group and can lead many.
- **One-tap accept.** Joining a group always needs the member to accept.
- **Old structure.** Retire branches' units, unit leaders and workers and start afresh. Keep the Pastor and branch pastor status and branch scope underneath.
- **Reports.** An overseer sees the full daily report of everyone in their groups. Contacts stay with the member, their pastor and admins, as today.
- **Location groups.** Unchanged for now.

## What changes for people

- **Community Home → Groups**
  - **Your group:** the group you are in and its leader, who is your overseer.
  - **Groups you lead:** your default "{First name}'s discipleship group", ready to use and renamable, plus **+ New group**.
- **Adding people.** A leader adds anyone by name from the group page. That person gets an invite and accepts with one tap. If they already have an overseer, accepting moves them, and the invite says so.
- **SOGP follow-up.** Anyone you claim or are assigned is invited into your default group automatically, so nobody falls through the cracks.
- **Oversight** appears for anyone who leads a group with members:
  - who reported today, who is at risk, and the open questions;
  - each member's full report;
  - members who lead their own groups open into those groups, to any depth.
  - The Pastor sees the whole church, and a branch pastor sees everyone placed in their branches. Both keep the per-branch view.
- **Retired:** the Structure tab, the unit and leader screens, and Add workers. Old links redirect to Oversight.

## How it is built

1. **Identity (migration 0068).**
   - **Problem:** groups are keyed on SOGP enrolments, but reports and oversight are keyed on user accounts, so anyone without an enrolment cannot be in a group, and a new cohort enrolment leaves existing memberships behind.
   - **Columns:** add `leader_user_id` to `discipleship_groups` and `member_user_id` to `discipleship_memberships` and `discipleship_group_invitations`, and backfill them from the enrolments.
   - **One overseer:** a partial unique index enforces one active membership per user, matching the decision.
   - **Kept for SOGP:** the enrolment columns stay because the SOGP pieces (check-ins, quiz, written work) still use them.
2. **One tree, no loops.** Every join and every assignment takes one advisory lock and walks the joiner's ancestors with a recursive query. It refuses when the joiner would end up overseeing themselves at any depth. Today only two-person loops are blocked.
3. **One access rule.** `canOversee(viewer, subject)` is true when:
   - the subject is anywhere under the viewer in the tree; or
   - the viewer is the Pastor; or
   - the viewer is a branch pastor and the subject is placed in one of their branches; or
   - the viewer is an admin.

   It replaces `canReadChurchReport` and the discipler's summed-numbers view for daily reports. Quiz answers and written work keep today's rule: the direct leader of an active membership only.
4. **Oversight data.** `getOversight` is rebuilt on the tree:
   - direct members first;
   - then each led subgroup's totals (members, reported today, at risk);
   - one bounded recursive query per page, never one query per person.
5. **Reminders.** The 8 pm report reminder goes to everyone who is in a group or leads one, instead of everyone in `church_assignments`. The checkpoint, consent and push rules stay the same.
6. **SOGP follow-up into groups.** Every path that sets a follow-up owner sends an in-app invite into the owner's default group, using the existing invitation table with a new `follow_up` origin:
   - enrolment routing;
   - the admin pastors page;
   - follow-up requests;
   - handover.

   Follow-up ownership and membership stay separate records, as today.
7. **Groups.**
   - Raise the five-group cap to 20.
   - Allow renaming the default group; it still cannot be closed.
   - Closing a group, or an admin pausing it, now asks what happens to its members, because a whole subtree hangs off it.
8. **Retire the org chart.**
   - Stop reading `unit_leader` and `worker` rows.
   - Keep the `pastor` and `branch_pastor` rows and `church_branch_pastors`.
   - Hide the unit and appointment screens and redirect them.
   - Keep the data in place, so a rollback is possible, until production has run on groups for a while. A later migration drops units and the worker and leader rows.
9. **Rollout.** Ship behind `DASHBOARD_GROUP_OVERSIGHT` (on by default once verified). Migration 0068 is applied separately, after review.

## Order of work

1. Migration 0068 and backfill, the tree lock and loop check, and `canOversee`, with tests.
2. Oversight on the tree, plus report access and reminders.
3. Groups UI: Your group, Groups you lead, add by name, and the move warning.
4. SOGP follow-up invites.
5. Retire the org chart screens, update `AGENTS.md`, and add the walkthrough for the Pastor's call.

## Still to decide

- Should the first group be named "{First name}'s discipleship group", or something neutral like "{First name}'s group"?
- Can a member leave their group on their own (they become overseer-less), or only be moved or removed by a leader?
