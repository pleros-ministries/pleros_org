import type { Metadata } from "next";
import { Suspense } from "react";
import { RootIntegrations } from "@/components/root-integrations";
import { beVietnamPro, sen } from "@/lib/fonts";
import localFont from "next/font/local";
import "./fonts/self-hosted.css";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://pleros.org"),
  title: {
    default: "Pleros Ministries and Missions – Helping you fulfil God's purpose",
    template: "%s :: Pleros Ministries and Missions",
  },
  description: "Pleros Ministries and Missions — helping you fulfil God's purpose.",
  openGraph: {
    type: "website",
    siteName: "Pleros Ministries and Missions",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${suisseIntl.variable} ${sen.variable} ${beVietnamPro.variable}`}
      suppressHydrationWarning
    >
      <body className="page-shell antialiased" suppressHydrationWarning>
        {/* Reads usePathname(); Cache Components needs it behind Suspense. */}
        <Suspense fallback={null}><RootIntegrations /></Suspense>
        {children}
      </body>
    </html>
  );
}
