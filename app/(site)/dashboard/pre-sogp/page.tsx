import { redirect } from "next/navigation";

import { PreSogpBoundary } from "@/components/sogp/pre-sogp-boundary";
import { SogpQueryProvider } from "@/components/sogp/sogp-query-provider";
import { getAppSession } from "@/lib/app-session";
import { getSogpEnrollmentByUserId } from "@/lib/db/queries/sogp";

export default async function PreSogpRoute() {
  const session = await getAppSession();
  if (!session) redirect("/sogp/enrol");
  const enrollment = await getSogpEnrollmentByUserId(session.user.id);
  if (!enrollment) redirect("/sogp/enrol");

  return (
    <SogpQueryProvider>
      <PreSogpBoundary />
    </SogpQueryProvider>
  );
}
