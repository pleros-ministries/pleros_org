# Community home checkpoint — 14 October 2026

The live `/dashboard/community` body now follows `Pleros-community.svg`: greeting, Messages tile, Needs a response, People I lead and My groups. The root has no duplicate Community title bar, composer, feed or old sidebar.

Read models are session-owned. Check-ins require the viewer to lead the active group and the responder to remain an active member; answer text is not selected. Church links come from existing server capabilities. Home reads never create groups or memberships.

The retained feed is `/dashboard/community/feed`: composer, filter/sort, posts/comments/likes/shares, pagination and moderation remain in the existing implementation. Location groups, member groups, private messages, Ask Pleros and discipleship tools remain reachable. Discipleship discussion links accept only an authorised `?group=` selection; invalid selections fall back to the existing accessible group.

## Browser observations

- Actual signed-in learner: Community home rendered on mobile (CSS viewport 390×844) and desktop; header and sidebar remained usable.
- Fixed a nested public-site theme overriding the dashboard contract: actual title colour is `rgb(37, 43, 51)` and message surface `rgb(246, 247, 248)`; Be Vietnam Pro is loaded.
- Current learner has no unread conversations/check-ins and zero disciples: truthful empty states replace the mock sample names/counts. No church capability is present, so no church link appears.
- Navigated through Community feed; the existing composer, All/Official/Discussions filters, Latest/Top/Unanswered sort and posts were visible. No posting, membership or learner-progress mutations were performed.
- Private actual-account screenshots remain untracked: `evidence/community-home-live-mobile.jpg` and `evidence/community-home-live-desktop.jpg`.

## Limits and explicit variations

Real names/counts differ from the mockup. Empty Needs a response is an established bordered panel rather than a fabricated response. Retained Feed/Ask Pleros links sit below the source sections, not in a generic default navigation inventory. Desktop keeps the approved sidebar and a readable-width column; no new desktop parity claim.

Automated tests, lint, builds and diagnostics are deferred at the user's request. Populated response/leadership roles and final matched overlay comparison remain unverified. Browser observations are not full functional acceptance or evidence of production deployment.
