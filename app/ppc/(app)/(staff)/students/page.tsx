"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  DEMO_STUDENTS,
  filterStudents,
  formatShortDate,
  sortStudents,
  type DemoStudentStatus,
  type StudentSortOptions,
} from "@/lib/ppc-demo";

const tableColumns = [
  "Name",
  "Email",
  "Level",
  "Progress",
  "Current lesson",
  "Last activity",
  "Q&A pending",
  "Reviews pending",
  "Location",
  "Enrolled",
  "Graduation",
  "Status",
];

const sortOptions: Array<{
  label: string;
  value: StudentSortOptions["sortBy"];
}> = [
  { label: "Progress", value: "progressPercent" },
  { label: "Name", value: "name" },
  { label: "Level", value: "level" },
  { label: "Last activity", value: "lastActivity" },
];

export default function PpcStudentsPage() {
  const [query, setQuery] = useState("");
  const [selectedLevel, setSelectedLevel] = useState<number | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<DemoStudentStatus | "all">("all");
  const [sortBy, setSortBy] = useState<StudentSortOptions["sortBy"]>("progressPercent");
  const [direction, setDirection] = useState<StudentSortOptions["direction"]>("desc");

  const visibleStudents = useMemo(() => {
    const filtered = filterStudents(DEMO_STUDENTS, {
      query,
      level: selectedLevel,
      status: selectedStatus,
    });

    return sortStudents(filtered, {
      sortBy,
      direction,
    });
  }, [query, selectedLevel, selectedStatus, sortBy, direction]);

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">Students</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Search, filter, and sort the student cohort in one table.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1.5fr_repeat(4,minmax(0,1fr))]">
          <label className="grid gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
              Search
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name or email"
              className="h-10 rounded-lg border border-zinc-300 px-3 text-sm outline-none ring-0 focus:border-zinc-700"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
              Level
            </span>
            <select
              value={selectedLevel}
              onChange={(event) => {
                const value = event.target.value;
                setSelectedLevel(value === "all" ? "all" : Number(value));
              }}
              className="h-10 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-700"
            >
              <option value="all">All</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
              <option value="5">Level 5</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
              Status
            </span>
            <select
              value={selectedStatus}
              onChange={(event) =>
                setSelectedStatus(event.target.value as DemoStudentStatus | "all")
              }
              className="h-10 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-700"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
              Sort by
            </span>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as StudentSortOptions["sortBy"])}
              className="h-10 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-700"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">
              Direction
            </span>
            <select
              value={direction}
              onChange={(event) =>
                setDirection(event.target.value as StudentSortOptions["direction"])
              }
              className="h-10 rounded-lg border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-700"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </label>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-[1160px] divide-y divide-zinc-200 text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-[0.08em] text-zinc-600">
              <tr>
                {tableColumns.map((column) => (
                  <th key={column} className="px-4 py-3 font-medium">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {visibleStudents.map((student) => (
                <tr key={student.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">
                    <Link
                      href={`/ppc/students/${student.id}`}
                      className="underline-offset-2 hover:underline"
                    >
                      {student.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{student.email}</td>
                  <td className="px-4 py-3 text-zinc-700">{student.level}</td>
                  <td className="px-4 py-3 text-zinc-700">{student.progressPercent}%</td>
                  <td className="px-4 py-3 text-zinc-700">{student.currentLesson}</td>
                  <td className="px-4 py-3 text-zinc-700">{formatShortDate(student.lastActivity)}</td>
                  <td className="px-4 py-3 text-zinc-700">{student.qaPending}</td>
                  <td className="px-4 py-3 text-zinc-700">{student.reviewsPending}</td>
                  <td className="px-4 py-3 text-zinc-700">{student.location}</td>
                  <td className="px-4 py-3 text-zinc-700">{formatShortDate(student.enrolledAt)}</td>
                  <td className="px-4 py-3 text-zinc-700">{student.graduationStatus.replace("_", " ")}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        student.status === "active"
                          ? "bg-zinc-900 text-zinc-50"
                          : "bg-zinc-200 text-zinc-700"
                      }`}
                    >
                      {student.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {visibleStudents.length === 0 ? (
          <div className="border-t border-zinc-200 px-4 py-6 text-sm text-zinc-500">
            No students match the current filters.
          </div>
        ) : null}
      </section>
    </div>
  );
}
