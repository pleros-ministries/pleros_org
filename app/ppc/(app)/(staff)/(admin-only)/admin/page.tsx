import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq, count } from "drizzle-orm";

import { getAppSession } from "@/lib/app-session";
import { toExternalPpcPath } from "@/lib/ppc-access";
import { getStudentList } from "@/lib/db/queries/students";
import { getReviewerAssignments } from "@/app/ppc/_actions/student-actions";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { PageHeader } from "@/components/ppc/page-header";
import { AdminControlsClient } from "@/components/ppc/admin-controls-client";

export default async function AdminPage() {
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
  }));

  const reviewerAssignments = await getReviewerAssignments();

  const instructors = await db.query.users.findMany({
    where: (u, { eq: eq2, or }) => or(eq2(u.role, "instructor"), eq2(u.role, "admin")),
  });
  const instructorList = instructors.map((i) => ({
    id: i.id,
    name: i.name,
    email: i.email,
  }));

  const [userCount] = await db
    .select({ count: count() })
    .from(schema.users);
  const [lessonCount] = await db
    .select({ count: count() })
    .from(schema.lessons)
    .where(eq(schema.lessons.status, "published"));
  const [gradCount] = await db
    .select({ count: count() })
    .from(schema.levelGraduations);

  const stats = {
    totalUsers: userCount?.count ?? 0,
    publishedLessons: lessonCount?.count ?? 0,
    totalGraduations: gradCount?.count ?? 0,
  };

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Admin controls"
        description="Student overrides, reviewer assignments, and platform stats"
      />
      <AdminControlsClient
        students={students}
        reviewerAssignments={reviewerAssignments}
        instructors={instructorList}
        stats={stats}
        adminId={session.user.id}
      />
    </div>
  );
}
