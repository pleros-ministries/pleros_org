import { DiscipleshipPage } from "@/components/sogp/discipleship-page";
import { discipleshipPreviewData } from "@/lib/sogp/preview-fixtures";

export default function SogpDiscipleshipPreviewPage() {
  return <DiscipleshipPage data={discipleshipPreviewData} preview />;
}
