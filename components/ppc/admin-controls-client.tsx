"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Users,
  BookOpen,
  GraduationCap,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LevelBadge } from "@/components/ppc/level-badge";
import {
  overrideStudentLevel,
  resetStudentProgress,
  assignReviewer,
  removeReviewerAssignment,
} from "@/app/ppc/_actions/student-actions";

type AdminControlsClientProps = {
  students: Array<{
    id: string;
    name: string;
    email: string;
    currentLevel: number;
  }>;
  reviewerAssignments: Array<{
    id: number;
    userId: string;
    levelId: number;
    userName: string;
    userEmail: string;
  }>;
  instructors: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  stats: {
    totalUsers: number;
    publishedLessons: number;
    totalGraduations: number;
  };
  adminId: string;
};

export function AdminControlsClient({
  students,
  reviewerAssignments,
  instructors,
  stats,
  adminId,
}: AdminControlsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [overrideLevel, setOverrideLevel] = useState("1");
  const [confirmReset, setConfirmReset] = useState<string | null>(null);

  const [newReviewerUserId, setNewReviewerUserId] = useState("");
  const [newReviewerLevel, setNewReviewerLevel] = useState("1");

  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase();
    if (!q) return students.slice(0, 20);
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    );
  }, [students, studentSearch]);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const handleOverrideLevel = () => {
    if (!selectedStudentId) return;
    startTransition(async () => {
      await overrideStudentLevel(selectedStudentId, Number(overrideLevel));
      router.refresh();
    });
  };

  const handleResetProgress = (userId: string) => {
    startTransition(async () => {
      await resetStudentProgress(userId);
      setConfirmReset(null);
      router.refresh();
    });
  };

  const handleAssignReviewer = () => {
    if (!newReviewerUserId) return;
    startTransition(async () => {
      await assignReviewer(newReviewerUserId, Number(newReviewerLevel));
      setNewReviewerUserId("");
      router.refresh();
    });
  };

  const handleRemoveAssignment = (userId: string, levelId: number) => {
    startTransition(async () => {
      await removeReviewerAssignment(userId, levelId);
      router.refresh();
    });
  };

  return (
    <div className="grid gap-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Total users", value: stats.totalUsers, icon: Users },
          { label: "Published lessons", value: stats.publishedLessons, icon: BookOpen },
          { label: "Graduations", value: stats.totalGraduations, icon: GraduationCap },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-2 rounded-sm border border-zinc-200 bg-white px-3 py-2"
          >
            <stat.icon className="size-4 text-zinc-400" />
            <div>
              <p className="text-lg font-semibold text-zinc-900">{stat.value}</p>
              <p className="text-[10px] text-zinc-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Student override section */}
      <div className="rounded-sm border border-zinc-200 bg-white p-3">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          Student override
        </p>

        <div className="grid gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search students…"
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="h-8 w-full rounded-sm border border-zinc-200 bg-white pl-7 pr-3 text-xs text-zinc-700 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200"
            />
          </div>

          {/* Dropdown */}
          <div className="relative">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className={cn(
                "h-8 w-full appearance-none rounded-sm border border-zinc-200 bg-white pl-3 pr-7 text-xs text-zinc-700 outline-none",
                "focus:border-zinc-400 focus:ring-1 focus:ring-zinc-200",
              )}
            >
              <option value="">Select student…</option>
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email}) — L{s.currentLevel}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-zinc-400" />
          </div>

          {selectedStudent && (
            <div className="grid gap-2 rounded-sm border border-zinc-100 p-2">
              <div className="flex items-center gap-2 text-xs text-zinc-600">
                <span className="font-medium">{selectedStudent.name}</span>
                <LevelBadge level={selectedStudent.currentLevel} />
              </div>

              {/* Override level */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-zinc-500">Set level:</span>
                <select
                  value={overrideLevel}
                  onChange={(e) => setOverrideLevel(e.target.value)}
                  className="h-7 rounded-sm border border-zinc-200 px-2 text-xs outline-none"
                >
                  {[1, 2, 3, 4, 5].map((l) => (
                    <option key={l} value={String(l)}>
                      Level {l}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleOverrideLevel}
                  disabled={isPending}
                  className="h-7 rounded-sm bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  Set
                </button>
              </div>

              {/* Reset progress */}
              <div className="flex items-center gap-2">
                {confirmReset !== selectedStudent.id ? (
                  <button
                    onClick={() => setConfirmReset(selectedStudent.id)}
                    className="flex h-7 items-center gap-1.5 rounded-sm border border-red-200 bg-red-50 px-3 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    <RotateCcw className="size-3" />
                    Reset progress
                  </button>
                ) : (
                  <>
                    <span className="flex items-center gap-1 text-xs text-red-600">
                      <AlertTriangle className="size-3" />
                      Irreversible
                    </span>
                    <button
                      onClick={() => handleResetProgress(selectedStudent.id)}
                      disabled={isPending}
                      className="h-7 rounded-sm bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmReset(null)}
                      className="h-7 rounded-sm border border-zinc-200 px-3 text-xs text-zinc-600 hover:bg-zinc-50"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviewer assignments */}
      <div className="rounded-sm border border-zinc-200 bg-white p-3">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          Reviewer assignments
        </p>

        {reviewerAssignments.length > 0 && (
          <div className="mb-3 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                    Instructor
                  </th>
                  <th className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                    Level
                  </th>
                  <th className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviewerAssignments.map((ra) => (
                  <tr
                    key={ra.id}
                    className="border-b border-zinc-50 last:border-0"
                  >
                    <td className="px-2 py-1.5 text-xs text-zinc-700">
                      {ra.userName}
                      <span className="ml-1 text-[10px] text-zinc-400">
                        {ra.userEmail}
                      </span>
                    </td>
                    <td className="px-2 py-1.5">
                      <LevelBadge level={ra.levelId} />
                    </td>
                    <td className="px-2 py-1.5">
                      <button
                        onClick={() =>
                          handleRemoveAssignment(ra.userId, ra.levelId)
                        }
                        disabled={isPending}
                        className="flex h-6 items-center gap-1 rounded-sm border border-red-200 bg-red-50 px-2 text-[10px] font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        <Trash2 className="size-2.5" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Add reviewer */}
        <div className="flex flex-wrap items-center gap-2 rounded-sm border border-zinc-100 p-2">
          <UserPlus className="size-3.5 text-zinc-400" />
          <div className="relative flex-1 min-w-[140px]">
            <select
              value={newReviewerUserId}
              onChange={(e) => setNewReviewerUserId(e.target.value)}
              className="h-7 w-full appearance-none rounded-sm border border-zinc-200 pl-2 pr-6 text-xs outline-none"
            >
              <option value="">Select instructor…</option>
              {instructors.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-zinc-400" />
          </div>
          <div className="relative">
            <select
              value={newReviewerLevel}
              onChange={(e) => setNewReviewerLevel(e.target.value)}
              className="h-7 appearance-none rounded-sm border border-zinc-200 pl-2 pr-6 text-xs outline-none"
            >
              {[1, 2, 3, 4, 5].map((l) => (
                <option key={l} value={String(l)}>
                  L{l}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 size-3 -translate-y-1/2 text-zinc-400" />
          </div>
          <button
            onClick={handleAssignReviewer}
            disabled={isPending || !newReviewerUserId}
            className="h-7 rounded-sm bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
