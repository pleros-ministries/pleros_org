import { redirect } from "next/navigation";

import { SogpQueryProvider } from "@/components/sogp/sogp-query-provider";
import { getAppSession } from "@/lib/app-session";

export default async function SogpLayout({ children }: { children: React.ReactNode }) {
  const session = await getAppSession();
  if (!session) redirect("/sogp/enroll");
  return <SogpQueryProvider>{children}</SogpQueryProvider>;
}
