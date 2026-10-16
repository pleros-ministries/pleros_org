# SOGP Branch Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use test-driven-development for any defect found during this pilot; reproduce it before changing application code.

**Goal:** Demonstrate and validate the live SOGP branch-oversight, referral, follow-up, and discipleship flows without risking existing church or learner data.

**Architecture:** The dashboard derives access from church appointments. The Pastor has church-wide scope; each Branch Pastor sees every SOGP enrollee placed in any branch they lead. Referral code/link enrolment immediately records the referrer as follow-up owner, while discipleship group membership remains a separate invitation-and-acceptance flow. Branch assignment uses the enrollee's permanent default `SOGP Discipleship Group`; branch transfer is immediate and releases the prior assignment.

**Tech Stack:** Next.js 16, React 19, Better Auth, Drizzle ORM, Neon Postgres, Vercel

---

## Tonight: 12-minute pastor demo

Use named pilot accounts rather than real congregant records. Open an incognito window for each role so sessions cannot be confused.

### Task 1: Establish the roles and boundaries

- [ ] Sign in as the whole-church Pastor and open `/dashboard`.
- [ ] Open the sidebar and point out **Admin**. Follow it to `/admin`; it should redirect the Pastor to `/admin/my-enrollees`.
- [ ] Explain: “The Pastor sees the whole church. A Branch Pastor sees only enrollees placed in the branches they lead. Ordinary disciplers see only their own referrals and assignments.”
- [ ] Open `/dashboard/church`. Confirm the Pastor view says **Manage all branches** and shows the current branch pastors.
- [ ] If demonstrating a new appointment, use a prepared test member and an existing test branch: choose **Appoint a branch pastor**, select the member, and save. Do not change a real appointment during the demo.

Expected: the sidebar has one clear **Admin** entry; Pastor scope is church-wide; no legacy PPC destination is needed.

### Task 2: Show Branch Pastor oversight

- [ ] Sign in as the pilot Branch Pastor and open **Admin** → `/admin/my-enrollees`.
- [ ] Confirm the enrollee count and branch names match only the branches assigned to that pastor.
- [ ] Pick an unassigned pilot enrollee already placed in the branch.
- [ ] Open **Manage**, choose a pilot discipler from that same branch, and click **Assign**.
- [ ] Refresh once and confirm the enrollee now shows that discipler.

Expected: only eligible SOGP-enrolled people from the same branch appear as disciplers. The Branch Pastor may choose themselves. Assignment adds the learner directly to the chosen discipler's default **SOGP Discipleship Group**.

### Task 3: Show the ordinary discipler's waiting area

- [ ] Sign in as the assigned ordinary discipler.
- [ ] Open **Community** → **My enrollees**, or go to `/dashboard/sogp/enrollees`.
- [ ] Confirm the newly assigned person is present and labelled **Assigned to you** or **Reassigned to you**.
- [ ] Open **My disciples** at `/dashboard/sogp/discipleship` and confirm the learner is in **SOGP Discipleship Group** after the branch assignment.

Expected: **My enrollees** is the follow-up queue; **My disciples** is group membership. The two views have distinct names and purposes.

### Task 4: Show automatic branch transfer

- [ ] Return as the source Branch Pastor, open the pilot enrollee's **Manage** controls, choose a different branch, and click **Transfer**.
- [ ] Confirm the learner disappears from the source pastor's scope and the old discipler is released.
- [ ] Sign in as the destination Branch Pastor and confirm the learner appears unassigned in `/admin/my-enrollees`.
- [ ] Assign or claim the learner to a pilot discipler in the destination branch.

Expected: no destination acceptance step exists. The transfer is immediate, records an accepted transfer history row, removes the old active group membership, and leaves the destination Branch Pastor ready to assign.

### Task 5: Show referral link and referral code

- [ ] Sign in as any SOGP-enrolled pilot member and open `/dashboard/sogp/referrals`.
- [ ] Copy the personal referral link and note the displayed referral code.
- [ ] In an incognito window, open the copied link. Confirm the enrolment page hides the manual code field because `?ref=CODE` is already present.
- [ ] Complete enrolment with a fresh pilot email/phone, or stop before submit for tonight's non-writing demo.
- [ ] For the code path, open `/sogp/enrol` directly and enter the same code in **Referral code**.
- [ ] After a real pilot enrolment, return to `/dashboard/sogp/enrollees` and confirm the new person is attributed to the referrer.

Expected: both link and code make the referrer the follow-up owner. They do **not** silently make the learner a group member. The referrer sends a group invitation and the learner accepts it, or the learner requests another follow-up person.

## Tomorrow: controlled pilot script

### Task 6: Preflight and record a baseline

- [ ] Name one Pilot Pastor, two Pilot Branch Pastors in different branches, two ordinary pilot disciplers, and two fresh pilot enrollees.
- [ ] Confirm every proposed discipler has an active SOGP enrolment; otherwise they will not appear in the assignment selector.
- [ ] Record the visible enrollee count for the Pastor and each Branch Pastor.
- [ ] Record the two pilot enrollees' starting branch, discipler, and group membership.
- [ ] Confirm the live commit/deployment is healthy before starting.

Stop if a Branch Pastor can see an enrollee outside every branch they lead, if a real appointment is unexpectedly missing, or if the baseline cannot be reconstructed.

### Task 7: Run the assignment matrix

- [ ] Branch Pastor assigns Enrollee A to ordinary Discipler A.
- [ ] Confirm A appears in Discipler A's **My enrollees** and default **SOGP Discipleship Group**.
- [ ] Branch Pastor assigns Enrollee B to themselves.
- [ ] Confirm B appears in the Branch Pastor's personal queue and default group.
- [ ] Release A; confirm A remains in the branch but no longer has a discipler or active membership in that former group.
- [ ] Reassign A to another eligible discipler in the same branch.

Pass: every operation is reflected after refresh, no unrelated learner changes, and historical records remain intact.

### Task 8: Run the transfer matrix

- [ ] Transfer Enrollee A from Pilot Branch 1 to Pilot Branch 2.
- [ ] Confirm the source Branch Pastor no longer sees A.
- [ ] Confirm the destination Branch Pastor sees A immediately and A is unassigned.
- [ ] Assign A to Discipler B in Pilot Branch 2.
- [ ] Confirm the whole-church Pastor sees the final branch and discipler throughout.

Pass: transfer is automatic, previous assignment/group membership is released, and destination assignment is branch-scoped.

### Task 9: Run both referral paths

- [ ] Use the referral link for a fresh pilot enrolment; confirm attribution source is **Your referral link**.
- [ ] Use the referral code for another fresh pilot enrolment; confirm attribution source is **Your referral code**.
- [ ] Confirm each referrer sees only the people attributed or manually assigned to them.
- [ ] Send one default-group invitation and accept it as the learner.
- [ ] Confirm invitation acceptance, rather than referral alone, creates normal group membership.

Pass: link/code attribution is first-write-wins, self-referral is rejected, and group membership requires the intended acceptance path except for explicit Branch Pastor assignment.

### Task 10: Close out without data loss

- [ ] Compare final counts with the baseline plus the deliberately created pilot records.
- [ ] Confirm no real learner was moved, released, or reassigned.
- [ ] Keep pilot records labelled and document their final state; do not delete production enrolments to “clean up.”
- [ ] Record screenshots of Pastor scope, Branch Pastor scope, ordinary discipler queue, transfer result, and referral attribution.
- [ ] Log every failure with account role, URL, learner, expected result, actual result, and timestamp.

Application rollback: revert the production deployment to the previously verified Vercel deployment. Data rollback is separate; restore only explicitly recorded pilot assignments using the normal release/transfer/assign controls. Never delete enrolments or replay migrations as a rollback.

## Pilot pass decision

Go wider only if all are true:

- [ ] Pastor sees all branches; each Branch Pastor sees only branches they lead.
- [ ] Eligible discipler lists are branch-scoped and include the Branch Pastor themselves.
- [ ] Assign, release, and automatic transfer preserve learner/enrolment records.
- [ ] Referral link and code both attribute the correct follow-up owner.
- [ ] **My enrollees** and **My disciples** remain visibly distinct.
- [ ] No severe error, duplicate active membership, or cross-branch visibility leak occurs.
- [ ] Page-to-page navigation is acceptably responsive on the phones used tomorrow.
