import { DiscipleshipPage } from "@/components/sogp/discipleship-page";
import { SogpQueryProvider } from "@/components/sogp/sogp-query-provider";
import { discipleshipPreviewData } from "@/lib/sogp/preview-fixtures";

export default function SogpDiscipleshipPreviewPage() {
  return (
    <SogpQueryProvider>
      <DiscipleshipPage data={discipleshipPreviewData} preview />
    </SogpQueryProvider>
  );
}
