import { describe, expect, test } from "vitest";

import {
  sogpCertificates,
  sogpCohorts,
  sogpCohortTracks,
  sogpEnrollments,
  sogpLiveClassAttendance,
  sogpLiveClasses,
  sogpPreparationDays,
  sogpPreparationResources,
  sogpRewardGrants,
  prayerWatchAttendance,
  units,
  unitMembers,
  unitLeaderInvites,
  communityPosts,
  postReactions,
  communityPostComments,
  commentReactions,
  contentFlags,
  communityNotifications,
} from "../db/schema";

describe("SOGP schema", () => {
  test("exports the complete cohort lifecycle tables", () => {
    expect(sogpCohorts).toBeDefined();
    expect(sogpEnrollments).toBeDefined();
    expect(sogpCohortTracks).toBeDefined();
    expect(sogpLiveClasses).toBeDefined();
    expect(sogpLiveClassAttendance).toBeDefined();
    expect(sogpPreparationDays).toBeDefined();
    expect(sogpPreparationResources).toBeDefined();
    expect(sogpCertificates).toBeDefined();
    expect(sogpRewardGrants).toBeDefined();
  });

  test("exports the community location-unit tables", () => {
    expect(units.countryCode).toBeDefined();
    expect(units.regionKey).toBeDefined();
    expect(unitMembers.unitId).toBeDefined();
    expect(unitMembers.enrollmentId).toBeDefined();
    expect(unitMembers.role).toBeDefined();
    expect(unitLeaderInvites.tokenHash).toBeDefined();
  });

  test("exports the community post tables", () => {
    expect(communityPosts.scope).toBeDefined();
    expect(communityPosts.authorKind).toBeDefined();
    expect(communityPosts.status).toBeDefined();
    expect(communityPosts.images).toBeDefined();
    expect(communityPosts.commentCount).toBeDefined();
    expect(communityPosts.shareCount).toBeDefined();
    expect(communityPosts.sharedFromPostId).toBeDefined();
    expect(communityPosts.lastActivityAt).toBeDefined();
    expect(postReactions.postId).toBeDefined();
  });

  test("exports the community comment + moderation tables", () => {
    expect(communityPostComments.postId).toBeDefined();
    expect(communityPostComments.status).toBeDefined();
    expect(communityPostComments.replyToId).toBeDefined();
    expect(commentReactions.commentId).toBeDefined();
    expect(contentFlags.targetType).toBeDefined();
    expect(contentFlags.status).toBeDefined();
  });

  test("exports the community notifications table", () => {
    expect(communityNotifications.userId).toBeDefined();
    expect(communityNotifications.kind).toBeDefined();
    expect(communityNotifications.readAt).toBeDefined();
  });

  test("stores structured enrolment and curriculum metadata", () => {
    expect(sogpEnrollments.firstName).toBeDefined();
    expect(sogpEnrollments.lastName).toBeDefined();
    expect(sogpEnrollments.countryCode).toBeDefined();
    expect(sogpEnrollments.region).toBeDefined();
    expect(sogpEnrollments.referralSource).toBeDefined();
    expect(sogpEnrollments.referralCode).toBeDefined();
    expect(sogpEnrollments.referredByEnrollmentId).toBeDefined();
    expect(sogpEnrollments.whatsappConsent).toBeDefined();
    expect(sogpEnrollments.whatsappOptedInAt).toBeDefined();
    expect(sogpCohortTracks.curriculumLevel).toBeDefined();
    expect(sogpCohortTracks.curriculumOrder).toBeDefined();
    expect(sogpCohortTracks.isRequired).toBeDefined();
    expect(sogpCohortTracks.liveSessionNumber).toBeDefined();
  });

  test("tracks Prayer Watch attendance by session", () => {
    expect(prayerWatchAttendance.session).toBeDefined();
  });
});
