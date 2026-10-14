# Explicitly linked make-up checkpoint — 14 October 2026

Approved in this chat: only the discipleship group lead leads/confirms reviews. That lead offers a replacement for one named missed review, and their confirmed attendance on that replacement satisfies it. The original Missed record remains unchanged.

0058 adds one `sogp_review_makeups` table. Each offer references the exact original attendance key `(review_id, enrollment_id)`, with offered/chosen/attended/missed state and actor/timestamps. A partial unique index permits one chosen/confirmed replacement per original pair. It creates no sessions or attendance automatically, backfills nothing, and rewrites no original attendance, progress, memberships, assignments or certificate records.

The lead's Offer or confirm make-ups destination is on a completed review. The learner's Choose a make-up destination is on their own Missed row. The picker saves one explicit offered choice; it does not confirm attendance. After the chosen session ends, only the current active group lead can confirm Attended/Missed. An Attended replacement gives a separate Made up indicator while retaining the original Missed row; a missed replacement allows another offered choice. Confirmed attendance is not edited by this first-confirmation flow. No unrelated later session gives credit.

Permissions are session-derived and checked server-side for current ownership, accepted membership and the original missed record. Offers are learner-specific; former members retain their own historical facts but cannot inspect/select newly offered group sessions. Learners cannot self-confirm. No church/admin role gives a bypass, and no email, push, Telegram message or new group membership is created.

Migration plan: exact confirmed target and 0057 journal/hash predecessor, new table/journal in one transaction, and before/after digests for existing legacy records plus the new review/attendance tables. No runtime fingerprint activation gate is added.

Browser checks use the live unavailable/empty states and a clearly labelled read-only source sample of the picker. Saved offer/choice/confirmation mutations and other-role regression checks remain deferred with automated tests. A matching snapshot does not certify those writes. Certificate percentage/session-count/path-equivalence rules remain unapproved and unchanged.

0058 was applied to the confirmed shared target after the exact 0057 journal/hash predecessor. The runner reported all compared existing-record digests unchanged and the make-up table empty. Browser captures cover the read-only picker at mobile/desktop widths, selection remaining pending, and the authenticated unavailable state without an own missed record. The first capture's tab changed to the baseline during capture; that image is explicitly named `review-make-up-capture-changed-page.jpg` and is not make-up evidence. No real offers, choices or attendance were seeded or saved for QA.
