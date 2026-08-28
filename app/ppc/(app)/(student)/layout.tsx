import { permanentRedirect } from "next/navigation";

export default function RetiredPpcStudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  void children;
  permanentRedirect("/sogp");
}
