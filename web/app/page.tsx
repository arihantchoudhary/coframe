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
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          Agent Online
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-3xl leading-[1.1]">
          Send anything to{" "}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            this agent
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
          Data, files, documents — give it to the agent and it stores
          everything. Get a confirmation email with your item ID instantly.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mt-10">
          <Link href="/write">
            <Button size="lg" className="text-base px-8 h-12">
              Send Data
            </Button>
          </Link>
          <Link href="/upload">
            <Button
              size="lg"
              variant="outline"
              className="text-base px-8 h-12"
            >
              Upload Files
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
                <div className="text-3xl mb-2">&#9997;&#65039;</div>
                <CardTitle>Write Data</CardTitle>
                <CardDescription>
                  Send any JSON to the agent. Enter your email and get an
                  instant confirmation with your item ID.
                </CardDescription>
                <Link href="/write">
                  <Button variant="ghost" className="mt-3 px-0 text-blue-400 hover:text-blue-300">
                    Start writing &rarr;
                  </Button>
                </Link>
              </CardHeader>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="text-3xl mb-2">&#128200;</div>
                <CardTitle>Browse & Edit</CardTitle>
                <CardDescription>
                  View everything in the database. Inline edit any cell,
                  add fields, or delete items on the spot.
                </CardDescription>
                <Link href="/read">
                  <Button variant="ghost" className="mt-3 px-0 text-blue-400 hover:text-blue-300">
                    Open database &rarr;
                  </Button>
                </Link>
              </CardHeader>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="text-3xl mb-2">&#128228;</div>
                <CardTitle>Upload Files</CardTitle>
                <CardDescription>
                  Drag & drop images, videos, audio, PDFs, presentations,
                  documents — anything goes.
                </CardDescription>
                <Link href="/upload">
                  <Button variant="ghost" className="mt-3 px-0 text-blue-400 hover:text-blue-300">
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
          Same Data Writer &mdash; store anything, get notified, access
          anywhere.
        </p>
      </footer>
    </div>
  );
}
