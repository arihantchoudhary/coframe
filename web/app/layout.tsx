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
  title: "Coframe Data",
  description: "Coframe data management",
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
          <div className="max-w-4xl mx-auto flex items-center gap-6">
            <Link href="/" className="text-lg font-bold">
              Same Data Writer
            </Link>
            <Link
              href="/write"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Write
            </Link>
            <Link
              href="/read"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Read / Update / Delete
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
