import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Triple Captain | FPL Companion",
  description:
    "Plan, track, and analyze your Fantasy Premier League entry with a fast Next.js dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeScript = `(() => {
    try {
      const key = 'triple-captain:theme';
      const stored = window.localStorage.getItem(key);
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = stored === 'light' || stored === 'dark' ? stored : prefersDark ? 'dark' : 'light';
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
    } catch (error) {
      document.documentElement.dataset.theme = 'dark';
      document.documentElement.style.colorScheme = 'dark';
    }
  })();`;

  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="tc-surface min-h-dvh antialiased">
        <Script id="tc-theme-script" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
