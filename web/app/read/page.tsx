"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://yh9fp9463n.us-east-1.awsapprunner.com";

type Item = Record<string, unknown>;

export default function ReadPage() {
  const router = useRouter();
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  async function loadAll() {
    setLoadingAll(true);
    try {
      const res = await fetch(`${API_URL}/data`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAllItems(data);
    } catch {
      // silent
    } finally {
      setLoadingAll(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleDelete(id: string) {
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/data/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMessage(`Deleted ${id.slice(0, 8)}...`);
      if (expanded === id) setExpanded(null);
      loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleEdit(item: Item) {
    const params = new URLSearchParams();
    params.set("prefill", JSON.stringify(item));
    router.push(`/write?${params.toString()}`);
  }

  const filtered = search
    ? allItems.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
      )
    : allItems;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🧠 Petryk&apos;s Brain
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Everything Petryk remembers. Click any item to expand. Edit to open in the write page with full multimodal support.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-lg px-4 py-2">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {message && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">
          <p className="text-sm text-green-500">{message}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-3">
        <Input
          placeholder="Search Petryk's memory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={loadAll}
          disabled={loadingAll}
        >
          {loadingAll ? "Loading..." : "Refresh"}
        </Button>
        <Badge variant="secondary" className="ml-auto">
          {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Items */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-3">🐷</div>
            <p className="text-muted-foreground">
              {search
                ? "Nothing matches that search."
                : "Petryk's brain is empty. Send him some data!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const id = item.id as string;
            const isExpanded = expanded === id;
            const isFile = item.type === "file";

            // Get a preview of the item
            const previewKeys = Object.keys(item).filter(
              (k) => !["id", "type"].includes(k)
            );
            const previewText = previewKeys
              .slice(0, 3)
              .map((k) => {
                const v = item[k];
                const val =
                  typeof v === "object" ? JSON.stringify(v) : String(v);
                return `${k}: ${val.length > 50 ? val.slice(0, 50) + "..." : val}`;
              })
              .join(" · ");

            return (
              <Card
                key={id}
                className={`transition-all cursor-pointer hover:border-muted-foreground/50 ${
                  isExpanded ? "border-pink-500/40" : ""
                }`}
                onClick={() => setExpanded(isExpanded ? null : id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {isFile ? "📎" : "💾"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-mono">
                        {isFile
                          ? (item.filename as string) || id
                          : (item.message as string)?.slice(0, 60) || id}
                      </CardTitle>
                      <CardDescription className="text-xs truncate mt-0.5">
                        {previewText}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {id.slice(0, 8)}
                    </Badge>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent
                    className="pt-2 space-y-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Full data display */}
                    <div className="rounded-lg bg-muted p-4 overflow-auto">
                      <table className="w-full text-sm">
                        <tbody>
                          {Object.entries(item).map(([key, value]) => (
                            <tr key={key} className="border-b border-border/50 last:border-0">
                              <td className="py-2 pr-4 font-medium text-muted-foreground align-top whitespace-nowrap w-[120px]">
                                {key}
                              </td>
                              <td className="py-2 font-mono text-xs break-all">
                                {typeof value === "object"
                                  ? JSON.stringify(value, null, 2)
                                  : String(value as string | number | boolean)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* File preview */}
                    {isFile && item.url && (
                      <div>
                        {(item.content_type as string)?.startsWith("image/") ? (
                          <img
                            src={item.url as string}
                            alt={item.filename as string}
                            className="max-h-64 rounded-lg border"
                          />
                        ) : (
                          <a
                            href={item.url as string}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:underline"
                          >
                            Open file: {item.filename as string}
                          </a>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        Edit / Add More
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(id)}
                      >
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          navigator.clipboard.writeText(id);
                          setMessage("Copied ID to clipboard");
                        }}
                      >
                        Copy ID
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
