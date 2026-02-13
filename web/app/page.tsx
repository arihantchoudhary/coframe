"use client";

import Image from "next/image";
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
        <div className="mb-6">
          <Image
            src="/petryk.jpg"
            alt="Petryk"
            width={160}
            height={160}
            className="rounded-full border-4 border-pink-400/30 shadow-lg"
          />
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Petryk is online
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl leading-[1.1]">
          Hey, I&apos;m{" "}
          <span className="bg-gradient-to-r from-pink-400 to-orange-400 bg-clip-text text-transparent">
            Petryk
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed">
          I&apos;m a self-improving bot that currently knows nothing.
          Give me any information — text, files, images, documents — and I&apos;ll
          learn to understand you as a user, in my own way.
        </p>

        <p className="mt-4 text-sm text-muted-foreground/70 max-w-lg leading-relaxed italic">
          Why Petryk? Named after a hyperactive cartoon kid — restless, enthusiastic,
          never stops collecting and learning. That energy felt right.
        </p>
        <p className="mt-2 text-xs text-muted-foreground/50">
          Built by <span className="text-muted-foreground/70 font-medium">Arihant Choudhary</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="text-3xl mb-2">💬</div>
                <CardTitle>Feed Petryk</CardTitle>
                <CardDescription>
                  Text, files, images, videos, documents — give Petryk anything.
                  Drag & drop or type it out. He&apos;ll infer the rest.
                </CardDescription>
                <Link href="/write">
                  <Button variant="ghost" className="mt-3 px-0 text-pink-400 hover:text-pink-300">
                    Send something &rarr;
                  </Button>
                </Link>
              </CardHeader>
            </Card>

            <Card className="bg-card/50 backdrop-blur">
              <CardHeader>
                <div className="text-3xl mb-2">🧠</div>
                <CardTitle>Petryk&apos;s Brain</CardTitle>
                <CardDescription>
                  Everything Petryk knows so far. Browse, edit, update,
                  or delete anything in his memory.
                </CardDescription>
                <Link href="/read">
                  <Button variant="ghost" className="mt-3 px-0 text-pink-400 hover:text-pink-300">
                    Open brain &rarr;
                  </Button>
                </Link>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Petryk image */}
      <section className="flex justify-center pb-12">
        <Image
          src="/petryk.jpg"
          alt="Petryk from the Ukrainian cartoon"
          width={280}
          height={280}
          className="rounded-2xl border border-border shadow-md opacity-80"
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          🐷 Petryk — he remembers everything so you don&apos;t have to.
          Built by Arihant Choudhary.
        </p>
      </footer>
    </div>
  );
}
