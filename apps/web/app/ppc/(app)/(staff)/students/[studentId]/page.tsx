type StudentDetailPageProps = {
  params: Promise<{ studentId: string }>;
};

import { redirect } from "next/navigation";

export default async function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  const { studentId } = await params;
  redirect(`/admin/students/${studentId}`);
}
