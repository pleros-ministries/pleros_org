import { dailyCategoryStatus, type DailyReportCategory, type DailyReportDeclaration } from "@/lib/community/daily-report";
import type { StatusTone } from "@/components/dashboard/v3/primitives";

export type HomeReport = { category: DailyReportCategory; title: string; description: string; status: string; tone: StatusTone };
export function homeReportRows(input: { devotionalCount: number; ministryCount: number; meetingCount: number; declarations: { category: string; declaration: string }[] }): HomeReport[] {
  return (["devotional", "ministry", "meetings"] as const).map(category => {
    const declaration = input.declarations.find(row => row.category === category)?.declaration as DailyReportDeclaration | undefined;
    const count = category === "devotional" ? input.devotionalCount : category === "ministry" ? input.ministryCount : input.meetingCount;
    const storedStatus = dailyCategoryStatus({ category, declaration: declaration ?? null, activityCount: count, hasDevotionalActivity: input.devotionalCount > 0 });
    const confirmed = category === "devotional" && declaration === "confirmed";
    const status = confirmed ? "Confirmed" : storedStatus === "reported" ? "Reported" : storedStatus === "nil" ? "Nil declared" : category === "devotional" && count > 0 ? "Not confirmed" : "Not reported";
    return {
      category, title: category === "devotional" ? "Devotional" : category === "ministry" ? "Ministry" : "Meetings",
      description: count > 0 ? `${count} ${category === "meetings" ? `meeting${count === 1 ? "" : "s"} recorded` : `activit${count === 1 ? "y" : "ies"} logged`}` : status === "Nil declared" ? "No activity declared" : "No activity logged",
      status, tone: confirmed || storedStatus === "reported" ? "green" : status === "Not confirmed" ? "amber" : "neutral",
    };
  });
}

export type DashboardHomeData = {
  day: string;
  learning: { title: string; href: string; action: string; completed: number; total: number; enrolled: boolean; unit?: "tracks" | "episodes"; pathLabel?: string };
  reports: HomeReport[] | null;
  support: { firstName: string; canMessage: boolean } | null;
  community: boolean;
};
