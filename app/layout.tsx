import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const suisseIntl = localFont({
  src: [
    {
      path: "./fonts/suisse-intl/SuisseIntl-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/suisse-intl/SuisseIntl-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/suisse-intl/SuisseIntl-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/suisse-intl/SuisseIntl-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/suisse-intl/SuisseIntl-Bold.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-suisse-intl",
  display: "swap",
  preload: true,
  fallback: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Pleros",
  description: "Pleros website foundations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={suisseIntl.variable}>
      <body className="page-shell antialiased">{children}</body>
    </html>
  );
}
