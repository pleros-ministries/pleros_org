"use client";

import { useQuery } from "@tanstack/react-query";

import { getAdminStaffData } from "@/app/admin/_actions/read-actions";
import { Breadcrumb } from "@/components/ppc/breadcrumb";
import { PageHeader } from "@/components/ppc/page-header";
import { StaffManagementClient } from "@/components/ppc/staff-management-client";
import { ADMIN_QUERY_KEYS } from "@/lib/admin-query";

export function AdminStaffPageClient() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ADMIN_QUERY_KEYS.staff,
    queryFn: getAdminStaffData,
  });

  return (
    <div className="grid gap-6">
      <Breadcrumb items={[{ label: "Dashboard", href: "/admin" }, { label: "Staff" }]} />
      <PageHeader
        title="Staff access"
        description="Invite admins and instructors into PPC"
      />

      {isError ? (
        <div className="rounded-sm border border-rose-200 bg-rose-50 px-4 py-10 text-sm text-rose-700">
          Staff access could not be loaded. Try again shortly.
        </div>
      ) : isLoading ? (
        <div className="grid gap-3" aria-busy="true" aria-label="Loading staff access">
          <div className="h-40 animate-pulse rounded-sm border border-zinc-200 bg-white" />
          <div className="h-72 animate-pulse rounded-sm border border-zinc-200 bg-white" />
        </div>
      ) : data ? (
        <StaffManagementClient {...data} />
      ) : null}
    </div>
  );
}
