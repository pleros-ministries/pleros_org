import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const hallowModerat = localFont({
  src: [
    {
      path: "./fonts/Hallow-Moderat-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Hallow-Moderat-Bold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/Hallow-Moderat-Extrabold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-hallow-moderat",
  display: "swap",
});

const hallowModeratSerif = localFont({
  src: [
    {
      path: "./fonts/Hallow-Moderat-Serif-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/Hallow-Moderat-Serif-Semibold.woff",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/Hallow-Moderat-Serif-Regular-Italic.woff",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/Hallow-Moderat-Serif-Semibold-Italic.woff",
      weight: "600",
      style: "italic",
    },
  ],
  variable: "--font-hallow-moderat-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pleros",
  description: "Pleros member dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hallowModerat.variable} ${hallowModeratSerif.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
