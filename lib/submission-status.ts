export type WrittenSubmissionStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "needs_revision";

export function isWrittenSubmissionApproved(status: WrittenSubmissionStatus) {
  return status === "approved";
}
