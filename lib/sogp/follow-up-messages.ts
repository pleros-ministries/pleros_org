import type { StudentStatus } from "@/lib/sogp/student-status";

export const FOLLOW_UP_MESSAGE_TEMPLATES: Record<StudentStatus, string> = {
  on_track:
    "Hi [Name], we see the consistency you're showing in your SOGP journey. Well done! Keep going and keep the fire burning. We're cheering you on.",
  activity_inconsistent:
    "Hi [Name], I noticed that you've been participating in SOGP but haven't been consistent with all the activities. I just wanted to check in and see how you're doing. Is there anything making it difficult for you to participate fully?",
  day_inconsistent:
    "Hi [Name], I noticed that while you participate well when you're active, there have been some gaps between your days of participation. I wanted to check in and see how you're doing. Is there anything affecting your consistency with SOGP?",
  generally_inconsistent:
    "Hi [Name], I wanted to check in concerning your SOGP journey. We've noticed some inconsistency in your participation, both across the days and activities. How are you doing? Is there anything making it difficult for you to fully engage with the programme?",
  declining:
    "Hi [Name], I wanted to check in because you've been participating in SOGP, but we've noticed that your participation has reduced recently. How are you doing? Is there anything affecting your participation that we can help with?",
  at_risk:
    "Hi [Name], I wanted to personally check in with you. We've noticed that you've been away from some of the SOGP activities for a few days, and we don't want you to miss out on this journey. How are you doing? Is there anything preventing you from participating at the moment?",
  unresponsive:
    "Hi [Name], we've been trying to reach you concerning your participation in SOGP and just wanted to make sure you're okay. If there's anything affecting your participation, please let us know. We're happy to help where we can.",
};

export function buildFollowUpMessage(status: StudentStatus, firstName: string): string {
  return FOLLOW_UP_MESSAGE_TEMPLATES[status].replaceAll("[Name]", firstName.trim() || "there");
}
