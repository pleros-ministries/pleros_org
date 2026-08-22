"use client";

import { useRouter } from "next/navigation";

import { DataTable, type Column } from "@/components/ppc/data-table";
import { StatusBadge } from "@/components/ppc/status-badge";

type ReviewPreviewRow = {
  id: number;
  userId: string;
  studentName: string;
  levelId: number;
  lessonNumber: number;
  lessonTitle: string;
  status: string;
  assignedToId: string | null;
  submittedAt: string | Date | null;
};

type QaPreviewRow = {
  id: number;
  subject: string;
  studentName: string;
  levelId: number;
  lessonNumber: number;
  assignedToId: string | null;
  createdAt: string | Date | null;
};

type ReviewQueuePreviewProps = {
  rows: ReviewPreviewRow[];
  currentStaffId: string;
};

type QaInboxPreviewProps = {
  rows: QaPreviewRow[];
  currentStaffId: string;
};

function formatShortDate(value: string | Date | null) {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function ReviewQueuePreview({
  rows,
  currentStaffId,
}: ReviewQueuePreviewProps) {
  const router = useRouter();

  const getAssignmentLabel = (assignedToId: string | null) => {
    if (assignedToId === currentStaffId) {
      return "You";
    }

    if (!assignedToId) {
      return "Unassigned";
    }

    return "Assigned";
  };

  const columns: Column<ReviewPreviewRow>[] = [
    {
      key: "studentName",
      label: "Student",
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-xs font-medium text-zinc-900">{row.studentName}</p>
          <p className="text-[11px] text-zinc-500">
            L{row.levelId}.{row.lessonNumber} · {row.lessonTitle}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
      className: "w-[120px]",
    },
    {
      key: "assignedToId",
      label: "Owner",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-zinc-500">
          {getAssignmentLabel(row.assignedToId)}
        </span>
      ),
      className: "w-[120px]",
    },
    {
      key: "submittedAt",
      label: "Submitted",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-zinc-500">
          {formatShortDate(row.submittedAt)}
        </span>
      ),
      className: "w-[120px]",
    },
  ];

  if (rows.length === 0) {
    return <p className="text-xs text-zinc-400">No submissions to review</p>;
  }

  return (
    <>
      <div className="grid gap-2 md:hidden">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => router.push(`/admin/students/${row.userId}`)}
            className="rounded-sm border border-zinc-100 px-3 py-2 text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-zinc-900">
                  {row.studentName}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  L{row.levelId}.{row.lessonNumber} · {row.lessonTitle}
                </p>
              </div>
              <StatusBadge status={row.status} />
            </div>
            <p className="mt-2 text-[10px] text-zinc-400">
              {getAssignmentLabel(row.assignedToId)} · submitted{" "}
              {formatShortDate(row.submittedAt)}
            </p>
          </button>
        ))}
      </div>

      <div className="hidden md:block">
        <DataTable<ReviewPreviewRow & Record<string, unknown>>
          columns={columns as Column<ReviewPreviewRow & Record<string, unknown>>[]}
          data={rows as (ReviewPreviewRow & Record<string, unknown>)[]}
          onRowClick={(row) => router.push(`/admin/students/${row.userId}`)}
          emptyMessage="No submissions to review"
          getRowKey={(row) => String(row.id)}
        />
      </div>
    </>
  );
}

export function QaInboxPreview({ rows, currentStaffId }: QaInboxPreviewProps) {
  const router = useRouter();

  const getAssignmentLabel = (assignedToId: string | null) => {
    if (assignedToId === currentStaffId) {
      return "You";
    }

    if (!assignedToId) {
      return "Unassigned";
    }

    return "Assigned";
  };

  const columns: Column<QaPreviewRow>[] = [
    {
      key: "subject",
      label: "Thread",
      sortable: true,
      render: (row) => (
        <div>
          <p className="text-xs font-medium text-zinc-900">{row.subject}</p>
          <p className="text-[11px] text-zinc-500">
            {row.studentName} · L{row.levelId}.{row.lessonNumber}
          </p>
        </div>
      ),
    },
    {
      key: "assignedToId",
      label: "Owner",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-zinc-500">
          {getAssignmentLabel(row.assignedToId)}
        </span>
      ),
      className: "w-[120px]",
    },
    {
      key: "createdAt",
      label: "Opened",
      sortable: true,
      render: (row) => (
        <span className="text-xs text-zinc-500">
          {formatShortDate(row.createdAt)}
        </span>
      ),
      className: "w-[120px]",
    },
  ];

  if (rows.length === 0) {
    return <p className="text-xs text-zinc-400">No open threads</p>;
  }

  return (
    <>
      <div className="grid gap-2 md:hidden">
        {rows.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => router.push("/admin/qa")}
            className="rounded-sm border border-zinc-100 px-3 py-2 text-left"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-zinc-900">
                  {row.subject}
                </p>
                <p className="mt-0.5 text-[11px] text-zinc-500">
                  {row.studentName} · L{row.levelId}.{row.lessonNumber}
                </p>
              </div>
              <p className="text-[10px] text-zinc-400">
                {getAssignmentLabel(row.assignedToId)} · {formatShortDate(row.createdAt)}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="hidden md:block">
        <DataTable<QaPreviewRow & Record<string, unknown>>
          columns={columns as Column<QaPreviewRow & Record<string, unknown>>[]}
          data={rows as (QaPreviewRow & Record<string, unknown>)[]}
          onRowClick={() => router.push("/admin/qa")}
          emptyMessage="No open threads"
          getRowKey={(row) => String(row.id)}
        />
      </div>
    </>
  );
}
