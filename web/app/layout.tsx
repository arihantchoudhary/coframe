import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "Petryk Pyatochkin — Your AI Agent",
  description: "Send data, files, and documents to Petryk. He remembers everything.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <nav className="border-b border-border px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center gap-6">
            <Link href="/" className="text-lg font-bold flex items-center gap-2">
              <span className="text-2xl">🐷</span> Petryk
            </Link>
            <Link
              href="/write"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Write to Petryk
            </Link>
            <Link
              href="/read"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Petryk&apos;s Brain
            </Link>
            <Link
              href="/upload"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Upload
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
