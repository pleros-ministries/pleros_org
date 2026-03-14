import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import { getStudentList } from "@/lib/db/queries/students";
import { PageHeader } from "@/components/ppc/page-header";
import { StudentListClient } from "@/components/ppc/student-list-client";

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export default async function StudentsPage() {
  const session = await getAppSession();
  if (!session) {
    const h = await headers();
    redirect(toExternalPpcPath(h.get("host"), "/sign-in"));
  }

  const rawStudents = await getStudentList({ limit: 200 });

  const students = rawStudents.map((s) => ({
    id: s!.id,
    name: s!.name,
    email: s!.email,
    currentLevel: s!.currentLevel,
    progressPercent: s!.progressPercent,
    currentLesson: s!.currentLesson,
    qaPending: s!.qaPending,
    reviewsPending: s!.reviewsPending,
    graduationStatus: s!.graduationStatus,
    location: s!.location ?? null,
    createdAt: serializeDate(s!.createdAt) ?? new Date().toISOString(),
  }));

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Students"
        description={`${students.length} enrolled students`}
      />
      <StudentListClient students={students} />
    </div>
  );
}
