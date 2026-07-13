import { getAdminRegistrantList } from "@/lib/db/queries/admin-registrants";
import { PageHeader } from "@/components/ppc/page-header";
import { RegistrantListClient } from "@/components/ppc/registrant-list-client";

export default async function AdminStudentsPage() {
  const registrants = await getAdminRegistrantList();
  const ppcAccounts = registrants.filter(
    (registrant) => registrant.accountStatus === "ppc_account",
  ).length;
  const welcomeOnly = registrants.length - ppcAccounts;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Registrants"
        description={`${registrants.length} total · ${ppcAccounts} PPC accounts · ${welcomeOnly} welcome only`}
      />
      <RegistrantListClient registrants={registrants} basePath="/admin" />
    </div>
  );
}
