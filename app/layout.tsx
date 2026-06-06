import type { Metadata } from "next";
import { Be_Vietnam_Pro, DM_Sans, Figtree, Sen } from "next/font/google";
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

const sen = Sen({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sen",
  display: "swap",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-figtree",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
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
    <html
      lang="en"
      className={`${suisseIntl.variable} ${sen.variable} ${beVietnamPro.variable} ${figtree.variable} ${dmSans.variable}`}
    >
      <body className="page-shell antialiased">{children}</body>
    </html>
  );
}
