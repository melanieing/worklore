import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Worklore",
  description: "Your 5-minute AI career interviewer",
  openGraph: {
    title: "Worklore",
    description:
      "Talk about your day for 5 minutes. Worklore interviews you, captures the numbers while they're fresh, and turns them into résumé-ready achievements.",
    siteName: "Worklore",
    type: "website",
    images: [{ url: "/brand/worklore_og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Worklore",
    description: "Your 5-minute AI career interviewer",
    images: ["/brand/worklore_og.png"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
