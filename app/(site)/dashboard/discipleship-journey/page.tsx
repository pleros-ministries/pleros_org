import { DiscipleshipJourneyPage } from "@/components/dashboard/discipleship-journey-page";

// Reads the session or params on every request (Cache Components).
export const instant = false;

export default async function DashboardDiscipleshipJourneyPage() {
  return <DiscipleshipJourneyPage />;
}
