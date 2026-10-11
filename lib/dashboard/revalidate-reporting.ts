import "server-only";
import { revalidatePath } from "next/cache";
/** Canonical devotional writes invalidate the combined report without duplicating facts. */
export function revalidateReportingViews() {
  revalidatePath("/dashboard/community/report");
  revalidatePath("/dashboard/church", "layout");
}
