import { redirect } from "next/navigation";

// Reads the session or params on every request (Cache Components).
export const instant = false;

/** My enrollees moved under Groups in Community (17 October); old links keep working. */
export default function OldMyEnrollees() {
  redirect("/dashboard/community/enrollees");
}
