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
  communityGroupMembers,
  communityGroups,
  communityRestrictions,
  dmConversations,
  dmMessages,
  dmParticipants,
  ministryReports,
  ministryActivities,
  outreachContacts,
  outreachContactInteractions,
  plerosQuestionMessages,
  plerosQuestionMutes,
  plerosQuestions,
  userBlocks,
  discipleshipGroupStatusEnum,
  discipleshipGroups,
  discipleshipMemberships,
  discipleshipPrompts,
  discipleshipPromptResponses,
  discipleshipContactLogs,
  discipleshipPrayerRequests,
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
    expect(communityPosts.kind).toBeDefined();
    expect(communityPosts.topic).toBeDefined();
    expect(communityPosts.discipleshipGroupId).toBeDefined();
    expect(communityPosts.groupId).toBeDefined();
    expect(postReactions.postId).toBeDefined();
  });

  test("exports the member-created group tables", () => {
    expect(communityGroups.name).toBeDefined();
    expect(communityGroups.privacy).toBeDefined();
    expect(communityGroups.status).toBeDefined();
    expect(communityGroups.createdBy).toBeDefined();
    expect(communityGroupMembers.groupId).toBeDefined();
    expect(communityGroupMembers.userId).toBeDefined();
    expect(communityGroupMembers.role).toBeDefined();
    expect(communityGroupMembers.status).toBeDefined();
  });

  test("exports the daily ministry report table", () => {
    expect(ministryReports.userId).toBeDefined();
    expect(ministryReports.reportDate).toBeDefined();
    expect(ministryReports.reachedOnline).toBeDefined();
    expect(ministryReports.reachedOffline).toBeDefined();
    expect(ministryReports.saved).toBeDefined();
    expect(ministryReports.notSaved).toBeDefined();
    expect(ministryReports.filled).toBeDefined();
    expect(ministryReports.healed).toBeDefined();
    expect(ministryReports.followUps).toBeDefined();
    expect(ministryReports.note).toBeDefined();
  });

  test("exports the outreach contacts table", () => {
    expect(outreachContacts.userId).toBeDefined();
    expect(outreachContacts.metDate).toBeDefined();
    expect(outreachContacts.name).toBeDefined();
    expect(outreachContacts.phone).toBeDefined();
    expect(outreachContacts.followedUpAt).toBeDefined();
    expect(outreachContacts.followedUpBy).toBeDefined();
    expect(outreachContacts.followUpNote).toBeDefined();
    expect(outreachContacts.activityId).toBeDefined();
    expect(outreachContacts.salvationStatus).toBeDefined();
    expect(outreachContacts.discipleshipStatus).toBeDefined();
    expect(outreachContacts.followUpPlan).toBeDefined();
    expect(outreachContacts.nextFollowUpDate).toBeDefined();
  });

  test("exports the ministry activity log", () => {
    expect(ministryActivities.userId).toBeDefined();
    expect(ministryActivities.activityDate).toBeDefined();
    expect(ministryActivities.kind).toBeDefined();
    expect(ministryActivities.title).toBeDefined();
    expect(ministryActivities.mode).toBeDefined();
    expect(ministryActivities.platform).toBeDefined();
    expect(ministryActivities.location).toBeDefined();
    expect(ministryActivities.reachedOnline).toBeDefined();
    expect(ministryActivities.reachedOffline).toBeDefined();
    expect(ministryActivities.attendance).toBeDefined();
    expect(ministryActivities.saved).toBeDefined();
    expect(ministryActivities.notSaved).toBeDefined();
    expect(ministryActivities.filled).toBeDefined();
    expect(ministryActivities.healed).toBeDefined();
    expect(ministryActivities.followUps).toBeDefined();
    expect(ministryActivities.note).toBeDefined();
  });

  test("exports the contact interaction history", () => {
    expect(outreachContactInteractions.contactId).toBeDefined();
    expect(outreachContactInteractions.userId).toBeDefined();
    expect(outreachContactInteractions.activityId).toBeDefined();
    expect(outreachContactInteractions.interactionDate).toBeDefined();
    expect(outreachContactInteractions.kind).toBeDefined();
    expect(outreachContactInteractions.saved).toBeDefined();
    expect(outreachContactInteractions.filled).toBeDefined();
    expect(outreachContactInteractions.healed).toBeDefined();
    expect(outreachContactInteractions.note).toBeDefined();
  });

  test("exports the Ask Pleros tables", () => {
    expect(plerosQuestions.askerId).toBeDefined();
    expect(plerosQuestions.isAnonymous).toBeDefined();
    expect(plerosQuestions.status).toBeDefined();
    expect(plerosQuestions.askerUnread).toBeDefined();
    expect(plerosQuestionMessages.questionId).toBeDefined();
    expect(plerosQuestionMessages.fromStaff).toBeDefined();
    expect(plerosQuestionMessages.staffAuthorId).toBeDefined();
    expect(plerosQuestionMutes.userId).toBeDefined();
  });

  test("exports the private message, block and restriction tables", () => {
    expect(dmConversations.pairKey).toBeDefined();
    expect(dmConversations.startedBy).toBeDefined();
    expect(dmConversations.lastMessageAt).toBeDefined();
    expect(dmParticipants.conversationId).toBeDefined();
    expect(dmParticipants.lastReadMessageId).toBeDefined();
    expect(dmMessages.senderId).toBeDefined();
    expect(dmMessages.status).toBeDefined();
    expect(userBlocks.blockerId).toBeDefined();
    expect(userBlocks.blockedId).toBeDefined();
    expect(communityRestrictions.postingBlocked).toBeDefined();
    expect(communityRestrictions.messagingBlocked).toBeDefined();
  });

  test("exports the community comment + moderation tables", () => {
    expect(communityPostComments.postId).toBeDefined();
    expect(communityPostComments.status).toBeDefined();
    expect(communityPostComments.replyToId).toBeDefined();
    expect(commentReactions.commentId).toBeDefined();
    expect(contentFlags.targetType).toBeDefined();
    expect(contentFlags.status).toBeDefined();
  });

  test("exports the discipleship group tables", () => {
    expect(discipleshipGroups.leaderEnrollmentId).toBeDefined();
    expect(discipleshipGroups.inviteCode).toBeDefined();
    expect(discipleshipGroups.leaderSharesPhone).toBeDefined();
    expect(discipleshipMemberships.discipleEnrollmentId).toBeDefined();
    expect(discipleshipMemberships.sharesPhone).toBeDefined();
    expect(discipleshipPrompts.groupId).toBeDefined();
    expect(discipleshipPromptResponses.leaderReply).toBeDefined();
    expect(discipleshipMemberships.lastContactedAt).toBeDefined();
    expect(discipleshipMemberships.lastKnownStatus).toBeDefined();
    expect(discipleshipContactLogs.kind).toBeDefined();
    expect(discipleshipPrayerRequests.prayedAt).toBeDefined();
  });

  test("lets a leader close a group without reusing the admin pause", () => {
    expect(discipleshipGroupStatusEnum.enumValues).toEqual(["active", "archived", "closed"]);
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
