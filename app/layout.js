import { Geist, Geist_Mono, Noto_Sans_Bengali } from "next/font/google";
import SiteHeader from "@/components/layout/SiteHeader";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Bangla explanations need a font with Bengali script coverage.
const bengali = Noto_Sans_Bengali({ variable: "--font-bengali", subsets: ["bengali"], display: "swap" });

export const metadata = {
  title: { default: "LGA – Deutsch lernen", template: "%s · LGA" },
  description: "Structured German learning and Goethe-aligned A1 exam preparation.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${bengali.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex flex-1 flex-col">
          {children}
        </main>
      </body>
    </html>
  );
}
