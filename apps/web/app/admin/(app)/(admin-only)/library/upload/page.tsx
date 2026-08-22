import { getAllTeachings, getNextSn } from "@/lib/db/queries/teachings";
import { PageHeader } from "@/components/ppc/page-header";
import { Breadcrumb } from "@/components/ppc/breadcrumb";
import { UploadForm } from "../_components/UploadForm";

export const revalidate = 0;

export default async function AdminLibraryUploadPage() {
  const [nextSn, teachings] = await Promise.all([getNextSn(), getAllTeachings()]);

  const uniqueSeries = [...new Set(teachings.map((t) => t.series))];

  return (
    <div className="grid gap-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin" },
          { label: "Library", href: "/admin/library" },
          { label: "Upload Teaching" },
        ]}
      />
      <PageHeader
        title="Upload Teaching"
        description="Add a new teaching to the library archive"
      />

      <div className="max-w-[32rem]">
        <UploadForm nextSn={nextSn} existingSeries={uniqueSeries} />
      </div>
    </div>
  );
}
