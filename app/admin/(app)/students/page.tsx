import { getStudentList } from "@/lib/db/queries/students";
import { PageHeader } from "@/components/ppc/page-header";
import { StudentListClient } from "@/components/ppc/student-list-client";

function serializeDate(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

export default async function AdminStudentsPage() {
  const rawStudents = await getStudentList({ limit: 200 });

  const students = rawStudents.map((student) => ({
    id: student!.id,
    name: student!.name,
    email: student!.email,
    currentLevel: student!.currentLevel,
    progressPercent: student!.progressPercent,
    currentLesson: student!.currentLesson,
    qaPending: student!.qaPending,
    reviewsPending: student!.reviewsPending,
    graduationStatus: student!.graduationStatus,
    location: student!.location ?? null,
    createdAt: serializeDate(student!.createdAt) ?? new Date().toISOString(),
  }));

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Students"
        description={`${students.length} enrolled students`}
      />
      <StudentListClient students={students} basePath="/admin" />
    </div>
  );
}
