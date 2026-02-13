"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-65px)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="text-8xl mb-6">🐷</div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Petryk is online
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl leading-[1.1]">
          Hey, I&apos;m{" "}
          <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
            Petryk Pyatochkin
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
          Send me anything — data, files, images, videos, documents.
          I&apos;ll remember it all. I&apos;ll even send you an email to confirm.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Link href="/write">
            <Button size="lg" className="text-base px-8 h-12">
              Talk to Petryk
            </Button>
          </Link>
          <Link href="/read">
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-12"
            >
              See Petryk&apos;s Brain
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="text-3xl mb-2">💬</div>
                <CardTitle>Send Info</CardTitle>
                <CardDescription>
                  Text, key-value pairs, JSON — tell Petryk anything and
                  he&apos;ll store it. Attach files too.
                </CardDescription>
                <Link href="/write">
                  <Button variant="ghost" className="mt-3 px-0 text-pink-400 hover:text-pink-300">
                    Write to Petryk &rarr;
                  </Button>
                </Link>
              </CardHeader>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="text-3xl mb-2">🧠</div>
                <CardTitle>Petryk&apos;s Brain</CardTitle>
                <CardDescription>
                  Everything Petryk knows, in one place. Browse, edit, update,
                  or delete anything in his memory.
                </CardDescription>
                <Link href="/read">
                  <Button variant="ghost" className="mt-3 px-0 text-pink-400 hover:text-pink-300">
                    Open brain &rarr;
                  </Button>
                </Link>
              </CardHeader>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="text-3xl mb-2">📦</div>
                <CardTitle>Upload Files</CardTitle>
                <CardDescription>
                  Drag & drop images, videos, audio, PDFs, presentations,
                  documents — Petryk takes it all.
                </CardDescription>
                <Link href="/upload">
                  <Button variant="ghost" className="mt-3 px-0 text-pink-400 hover:text-pink-300">
                    Upload now &rarr;
                  </Button>
                </Link>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          🐷 Petryk Pyatochkin — he remembers everything so you don&apos;t have to.
        </p>
      </footer>
    </div>
  );
}
