import { DiscipleshipPage } from "@/components/sogp/discipleship-page";
import { SogpQueryProvider } from "@/components/sogp/sogp-query-provider";
import { discipleshipPreviewData } from "@/lib/sogp/preview-fixtures";
import { dashboardFont } from "@/components/dashboard/v3/font";
import dashboardStyles from "@/components/dashboard/v3/dashboard.module.css";

export default function SogpDiscipleshipPreviewPage() {
  return (
    <div className={`${dashboardFont.className} ${dashboardFont.variable} ${dashboardStyles.root}`}><SogpQueryProvider>
      <DiscipleshipPage data={discipleshipPreviewData} preview />
    </SogpQueryProvider></div>
  );
}
