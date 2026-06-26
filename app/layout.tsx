import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display face for headlines, scoreboard numbers, and big stats.
const archivo = Archivo({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "Triple Captain | FPL Companion",
  description: "Your Ultimate Fantasy Premier League Companion",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Triple Captain",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icon-192.png",
  },
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
      className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable}`}
    >
      <body className="tc-surface min-h-dvh antialiased relative pb-20 md:pb-0">
        <Script id="tc-theme-script" strategy="beforeInteractive">
          {themeScript}
        </Script>
        {/* Matchday-under-the-lights background glow (on-brand: mint + magenta) */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-[-15%] left-[-10%] w-[45%] h-[45%] bg-[var(--accent)]/10 rounded-full blur-[130px]" />
          <div className="absolute bottom-[5%] right-[-8%] w-[40%] h-[40%] bg-[var(--brand-secondary)]/10 rounded-full blur-[120px]" />
          <div className="absolute top-[30%] right-[15%] w-[22%] h-[22%] bg-[var(--accent)]/5 rounded-full blur-[90px]" />
        </div>
        {children}
        <ServiceWorkerRegister />
        <Analytics />
      </body>
    </html>
  );
}
