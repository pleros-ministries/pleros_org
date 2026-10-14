import { requireAdmin } from "@/lib/auth/require-role";
import { listCoordinatorEnrollees } from "@/lib/db/queries/sogp-coordinator";
import { CoordinatorControlCentre } from "@/components/ppc/sogp-coordinator";

export default async function CoordinatorPage() {
  await requireAdmin();
  return <CoordinatorControlCentre rows={await listCoordinatorEnrollees()} />;
}
