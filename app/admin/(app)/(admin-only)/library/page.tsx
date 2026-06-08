import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { getAllTeachings } from "@/lib/db/queries/teachings";
import { PageHeader } from "@/components/ppc/page-header";
import { Breadcrumb } from "@/components/ppc/breadcrumb";
import { AdminLibraryClient } from "./_components/AdminLibraryClient";

export const revalidate = 0;

export default async function AdminLibraryPage() {
  const teachings = await getAllTeachings();

  const serialisable = teachings.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString() as unknown as Date,
  }));

  const uploadedCount = teachings.filter(
    (t) => t.audioUrl && !t.audioUrl.startsWith("placeholder"),
  ).length;

  return (
    <div className="grid gap-6">
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Library" }]} />

      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Teaching Library"
          description={`${teachings.length} teachings · ${uploadedCount} with audio`}
        />
        <Link
          href="/admin/library/upload"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--color-brand-blue)] px-4 py-2.5 text-[0.875rem] font-semibold text-white transition-opacity hover:opacity-80"
        >
          <PlusIcon className="size-4" />
          Upload Teaching
        </Link>
      </div>

      <AdminLibraryClient
        initialTeachings={serialisable as Parameters<typeof AdminLibraryClient>[0]["initialTeachings"]}
      />
    </div>
  );
}
