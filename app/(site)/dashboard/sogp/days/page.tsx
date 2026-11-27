import { redirect } from "next/navigation";

/** The cohort's numbered days gave way to the shared month (Pastor, 25 November 2026). */
export default function SogpDaysPage() {
  redirect("/dashboard/sogp/month");
}
