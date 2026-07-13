import { eq, count } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getStudentPlatformList } from "@/lib/db/queries/students";
import { getAppSession } from "@/lib/app-session";
import { hasAdminAccess } from "@/lib/app-role";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { PageHeader } from "@/components/ppc/page-header";
import { AdminControlsClient } from "@/components/ppc/admin-controls-client";

export default async function AdminPlatformPage() {
  const session = await getAppSession();
  if (!session) {
    redirect("/admin");
  }

  if (!hasAdminAccess(session.user.role)) {
    redirect("/admin/forbidden");
  }

  const [
    students,
    reviewerAssignments,
    instructors,
    [userCount],
    [lessonCount],
    [graduationCount],
  ] = await Promise.all([
    getStudentPlatformList(200),
    db
      .select({
        id: schema.reviewerAssignments.id,
        userId: schema.reviewerAssignments.userId,
        levelId: schema.reviewerAssignments.levelId,
        userName: schema.users.name,
        userEmail: schema.users.email,
      })
      .from(schema.reviewerAssignments)
      .innerJoin(schema.users, eq(schema.reviewerAssignments.userId, schema.users.id)),
    db.query.users.findMany({
      where: (user, { eq: eq2, or }) =>
        or(eq2(user.role, "instructor"), eq2(user.role, "admin")),
    }),
    db.select({ count: count() }).from(schema.users),
    db
      .select({ count: count() })
      .from(schema.lessons)
      .where(eq(schema.lessons.status, "published")),
    db
      .select({ count: count() })
      .from(schema.levelGraduations),
  ]);

  const instructorList = instructors.map((instructor) => ({
    id: instructor.id,
    name: instructor.name,
    email: instructor.email,
  }));

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Platform"
        description="Student overrides, reviewer assignments, and platform stats"
      />
      <AdminControlsClient
        students={students}
        reviewerAssignments={reviewerAssignments}
        instructors={instructorList}
        stats={{
          totalUsers: userCount?.count ?? 0,
          publishedLessons: lessonCount?.count ?? 0,
          totalGraduations: graduationCount?.count ?? 0,
        }}
        adminId="admin-portal"
      />
    </div>
  );
}
