# Dashboard v3 screen coverage

Baseline: `939482b`, branch `codex/dashboard-v3-baseline`, 13 October 2026. Status is implementation evidence, not design approval. The owner approved the Pleros-you baseline and its shell corrections on 13 October; other screen designs remain unreviewed. Existing routes are retained even when replacement behaviour is pending.

| Screen stem | Design state | Existing route / service destination | Status |
|---|---|---|---|
| Pleros-you | You · Your day | /dashboard (shared shell) | Baseline approved; live home bound and verified |
| Pleros-community | Community · Your people | /dashboard/community | Pending; existing route retained where available |
| Pleros-control-centre | SOGP coordinator · Control centre | /admin/my-enrollees | Pending; existing route retained where available |
| Pleros-sidebar-open | Menu · Profile & settings | /dashboard (shared shell) | Approved shell connected to both live layouts; verified |
| Pleros-enrollee-details | Enrollee details | /admin/my-enrollees | Pending; existing route retained where available |
| Pleros-change-owner | Change follow-up owner | /admin/my-enrollees | Pending; existing route retained where available |
| Pleros-my-enrollees | My enrollees | /admin/my-enrollees | Pending; existing route retained where available |
| Pleros-referral-code | Referral code · Assigned | /dashboard/sogp/referrals + enrolment | Pending; existing route retained where available |
| Pleros-referral-link | Referral link · Choose | /dashboard/sogp/referrals + enrolment | Pending; existing route retained where available |
| Pleros-reassignment-pending | Reassignment request · Pending | /dashboard/sogp/referrals + enrolment | Pending; existing route retained where available |
| Pleros-church-pastor | Pastor · All branches | /dashboard/church | Pending; existing route retained where available |
| Pleros-church-branch | Branch pastor · Launch setup | /dashboard/church | Pending; existing route retained where available |
| Pleros-church-appointment | Branch pastor · Unit appointment | /dashboard/church | Pending; existing route retained where available |
| Pleros-church-allocation | Branch pastor · Assign workers | /dashboard/church | Pending; existing route retained where available |
| Pleros-church-unit | Unit leader · Direct workers | /dashboard/church | Pending; existing route retained where available |
| Pleros-church-worker | Worker · My placement | /dashboard/church | Pending; existing route retained where available |
| Pleros-create-branch | Pastor · Create branch | /dashboard/church | Pending; existing route retained where available |
| Pleros-appoint-branch-pastor | Pastor · Appoint branch pastor | /dashboard/church | Pending; existing route retained where available |
| Pleros-review-hierarchy-import | Pastor · Review hierarchy import | /dashboard/church | Pending; existing route retained where available |
| contacts_groups | Contacts & collections | /dashboard/community/report/people | Pending; existing route retained where available |
| saved_contacts | Saved contacts | /dashboard/community/report/people | Pending; existing route retained where available |
| add_contact | Add contact without an account | /dashboard/community/report/people | Pending; existing route retained where available |
| contact_history | Contact details & history | /dashboard/community/report/people | Pending; existing route retained where available |
| move_contact | Move to a contact collection | /dashboard/community/report/people | Pending; existing route retained where available |
| contact_moved | Moved · Still unlinked | /dashboard/community/report/people | Pending; existing route retained where available |
| Pleros-lesson | SOGP · Audio lesson | /dashboard + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-report | Personal daily reports | /dashboard/community/report | Pending; existing route retained where available |
| Pleros-oversight | Direct-worker report oversight | /dashboard/church | Pending; existing route retained where available |
| Pleros-disciple | Private discipleship | /dashboard/sogp/discipleship | Pending; existing route retained where available |
| Pleros-home-start-sogp | You · Start SOGP | /dashboard + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-onboarding-choice | Choose your daily commitment | /dashboard/podcast + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-onboarding-30min | 30 min/day · Build your tracklist | /dashboard/podcast + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-onboarding-1hour | 1 hr/day · Traditional tracks | /dashboard/podcast + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-onboarding-15min | 15 min/day · One episode | /dashboard/podcast + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-onboarding-ready | Your plan · Ready to start | /dashboard/podcast + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-home-1hour | 1 hr/day · Resume a traditional track | /dashboard + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-home-30min | 30 min/day · Two-episode queue | /dashboard + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-home-15min | 15 min/day · Resume one episode | /dashboard + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-onboarding-day-one | Day one · Selected podcast playback | /dashboard/podcast + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-tracklist-suggested | Purpose-first suggested plan | /dashboard/podcast + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-tracklist-reorder | Arrange your daily listening | /dashboard/podcast + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-tracklist-review | 30 min/day · Review 60 episodes | /dashboard/podcast + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-tracklist-review-15min | 15 min/day · Review 30 episodes | /dashboard/podcast + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-report-ministry-evangelism | Evangelism · Unified form | /dashboard/community/report | Isolated interaction preview at /preview/dashboard-v3/report; visual review and live binding pending |
| Pleros-report-ministry-discipleship | Discipleship · Unified form | /dashboard/community/report | Same presenter with ?kind=discipleship; live binding pending |
| Pleros-report-inline-add-contact | Add contact inline | /dashboard/community/report/people | Isolated sheet implemented and browser-checked; private persistence/migration and visual review pending |
| Pleros-report-ministry-outcomes | Optional ministry outcomes | /dashboard/community/report | Pending; existing route retained where available |
| Pleros-report-teaching-led | Teaching · Create the shared meeting | /dashboard/community/report | Pending; existing route retained where available |
| Pleros-report-prayer-led | Prayer · Create the shared meeting | /dashboard/community/report | Pending; existing route retained where available |
| Pleros-report-meeting-select | Choose an existing meeting | /dashboard/community/report | Pending; existing route retained where available |
| Pleros-report-teaching-attendee | Worker · Report attendance | /dashboard/community/report | Pending; existing route retained where available |
| Pleros-report-prayer-attendee | Disciple · Report attendance | /dashboard/community/report | Pending; existing route retained where available |
| Pleros-report-meeting-missing | Meeting not listed yet | /dashboard/community/report | Pending; existing route retained where available |
| Pleros-my-sogp | My SOGP · Plan and weekly reviews | /dashboard + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-share-referral | Every enrollee · Share referral | /dashboard/sogp/referrals + enrolment | Pending; existing route retained where available |
| Pleros-request-reassignment | Request a different follow-up person | /dashboard/sogp/referrals + enrolment | Pending; existing route retained where available |
| Pleros-review-learner-list | Learner · Weekly group reviews | /dashboard/sogp (new group-review service pending) | Pending; existing route retained where available |
| Pleros-review-discipler-schedule | Discipler · Schedule a review | /dashboard/sogp (new group-review service pending) | Pending; existing route retained where available |
| Pleros-review-leader-attendance | Session leader · Confirm attendance | /dashboard/sogp (new group-review service pending) | Pending; existing route retained where available |
| Pleros-review-missed-makeup | Learner · Make up a missed review | /dashboard/sogp (new group-review service pending) | Pending; existing route retained where available |
| Pleros-review-certification | Learner · Certification readiness | /dashboard/sogp/certificate | Pending; existing route retained where available |
| Pleros-invite-existing-account | Existing account · Invite in-app | /sogp/discipleship/[code] + /dashboard/sogp/discipleship | Pending; existing route retained where available |
| Pleros-group-invitation-pending | Invitation sent · Acceptance pending | /sogp/discipleship/[code] + /dashboard/sogp/discipleship | Pending; existing route retained where available |
| Pleros-group-invitation-accept | Recipient · Accept or decline | /sogp/discipleship/[code] + /dashboard/sogp/discipleship | Pending; existing route retained where available |
| Pleros-invite-whatsapp-link | No account · Share WhatsApp link | /sogp/discipleship/[code] + /dashboard/sogp/discipleship | Pending; existing route retained where available |
| Pleros-learning-podcast-library | Podcast library · Choose episodes | /dashboard/podcast + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-learning-edit-full-plan | Edit remaining episodes across the plan | /dashboard/podcast + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-learning-switch-one-episode | Switch pace · Regroup remaining episodes | /dashboard/podcast + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-learning-switch-traditional | Switch path · Preserve distinct histories | /dashboard/podcast + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-learning-listen-two-episodes | Mark each episode listened | /dashboard/podcast + /dashboard/sogp | Pending; existing route retained where available |
| Pleros-learning-optional-question | Ask a question · Optional | /dashboard/podcast + /dashboard/sogp | Pending; existing route retained where available |

Retained capabilities beyond the indexed mockups: `/login`, `/signup`, `/sogp/enrol`, `/setup`, `/forgot-password`, `/reset-password`; `/dashboard/profile`; every `/dashboard/welcomepack/*` destination and protected downloads; `/dashboard/prayer-watch`; `/dashboard/podcast/leaderboard`; `/dashboard/pre-sogp`; traditional course lesson/quiz/response routes; SOGP certificate/leaderboard/referrals; report history, edits, Nil/undo and people interactions; community feed/unit/member groups/discipleship spaces/messages/Ask Pleros/leader tools; staff `/admin/*` routes. Their route guards and persistence are unchanged in this baseline.

State coverage: baseline route loading and error/retry boundaries; empty notifications; native modal close/Escape/focus restoration; narrow-width wrapping. Real data loading, empty learning, validation, denied/historical routes, long content and multi-role persistence are pending per vertical slice. Synthetic role variants do not establish real-session authorisation.

