import type { Metadata } from "next";

import { AppShell } from "../../../../components/layout/app-shell";

export const metadata: Metadata = {
  title: "Welcome Pack preview",
  robots: { index: false, follow: false },
};

export default function WelcomePackPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
