import {redirect} from "next/navigation";
import {getAppSession} from "@/lib/app-session";
import {getOwnCertificationFacts} from "@/lib/db/queries/sogp-certification-facts";
import {CertificationReadiness} from "@/components/sogp/certification-readiness";

// Reads the session on every request (Cache Components).
export const instant = false;
export default async function ReadinessPage() {
  const session=await getAppSession();if(!session)redirect("/login?returnTo=/dashboard/sogp/readiness");
  const data=await getOwnCertificationFacts(session.user.id);if(!data)redirect("/sogp/enrol");
  return <CertificationReadiness data={data} name={session.user.name} />;
}
