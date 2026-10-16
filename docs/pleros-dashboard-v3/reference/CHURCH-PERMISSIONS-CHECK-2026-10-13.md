# Church appointment permissions check

Checked 13 October 2026 on `codex/dashboard-v3-baseline`. The assignment service and permission helpers have no changes relative to the supplied `939482b` revision.

## Confirmed defect

The real `assignChurchMember` service allowed a Branch Pastor responsible for branch A to demote a peer Branch Pastor whose primary branch was A and who had no direct reports. The peer also held branch B, which the actor did not oversee. With multi-branch enabled, the transaction changed the peer to Worker and deleted both A and B memberships. With multi-branch disabled, the demotion also succeeded, but membership rows were not deleted.

The guard at `lib/db/queries/church-organisation.ts:95` restricts the requested role and checks only the target's current primary branch. It does not reject the target's current peer/senior rank. The subsequent membership replacement at lines 107–109 deletes all previous memberships without authorising every affected branch. The direct-report guard prevents this demotion only when the peer has direct reports; it is not an authority check.

The server action derives the actor from the session and calls this service without an additional target-rank guard. This is a server-side permission bypass, not merely an exposed UI control. HTTP/browser exploitation and production enablement were not tested.

## Runtime evidence

`lib/church/appointment-permissions.integration.test.ts` invokes the actual service using Drizzle transactions against disposable local PostgreSQL. Only DB adapters and `server-only` are substituted. It uses synthetic users, the current 0051/0053 church DDL and a Unix socket; no shared connection URL, real account, production schema or notification service was used.

Final run: **11 checks: 9 passed, 2 failed**, with the failures asserting the required rejection and unchanged database state. The peer-demotion failures reproduced in two runs.

| Check | Result |
| --- | --- |
| Peer demotion, single-branch mode | Unsafe: accepted |
| Peer demotion, multi-branch mode | Unsafe: accepted; both memberships removed |
| Senior Pastor demotion | Rejected; appointment unchanged |
| Peer membership edit retaining Branch Pastor role | Rejected; memberships unchanged |
| Peer primary branch outside actor scope, only secondary shared | Rejected; unchanged |
| Lower-tier appointment currently outside actor scope | Rejected |
| Destination branch outside actor scope | Rejected |
| Valid lower-tier edit inside actor scope | Accepted |
| Nonexistent secondary requested branch | Rejected |
| Removal of secondary branch with direct reports; demotion with reports | Rejected |
| Mismatched supervisor branch or unit branch | Rejected |

## Before hierarchy setup

Fix the transactional guard to reject Branch Pastor edits to existing peer/senior appointments regardless of the requested new role. Authorise the complete affected branch set, including removed memberships, before writes. Keep direct-report, supervisor, unit and branch-existence checks, and require rejection to preserve the full prior appointment/membership state.

No service fix, push, deploy or production migration was performed. Production exploitability still depends on deployment and feature gates; this rehearsal proves the defect in the current source.

## Re-running

The suite is skipped by ordinary test runs. Opt in only with `PLEROS_APPOINTMENT_REHEARSAL_ROOT` pointing to a disposable `/tmp/pleros-rehearsal.*` directory containing `runtime/node_modules/pg`, a running local socket at `socket`, port 55439, and an empty `pleros_appointments` database owned by `pleros_test`. The Drizzle driver additionally needs `pg` resolvable from the project (the rehearsal used a temporary untracked `node_modules/pg` symlink). Do not reuse a database containing anything valuable: fixtures are truncated between checks.

Run `npx vitest run lib/church/appointment-permissions.integration.test.ts` with that environment variable. The two peer-demotion assertions should remain red until the service is fixed. Stop the private PostgreSQL server afterwards.
