import { redirect } from "next/navigation";

/** My enrollees moved under Groups in Community (17 October); old links keep working. */
export default function OldMyEnrollees() {
  redirect("/dashboard/community/enrollees");
}
