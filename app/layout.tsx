import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Joke Factory",
  description: "A playful AI-driven joke generator.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-slate-900`}>
        <Header />
        {/* Main container — keep consistent padding and center content */}
        <main className="pt-24 min-h-screen">
          <div className="mx-auto w-full max-w-6xl px-6">{children}</div>
        </main>
      </body>
    </html>
  );
}
