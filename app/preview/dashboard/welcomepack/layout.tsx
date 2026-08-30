import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome Pack preview",
  robots: { index: false, follow: false },
};

export default function WelcomePackPreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
