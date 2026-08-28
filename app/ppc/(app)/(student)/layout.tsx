import { permanentRedirect } from "next/navigation";

export default function RetiredPpcStudentLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  permanentRedirect("/sogp");
}
