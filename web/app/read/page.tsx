"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://yh9fp9463n.us-east-1.awsapprunner.com";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Item = Record<string, any>;

export default function ReadPage() {
  const router = useRouter();
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"cards" | "table">("cards");
  const [filterUser, setFilterUser] = useState<string>("all");

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

  // Extract unique users (emails)
  const users = useMemo(() => {
    const emails = new Set<string>();
    allItems.forEach((item) => {
      if (item.email) emails.add(String(item.email));
    });
    return Array.from(emails).sort();
  }, [allItems]);

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

  const filtered = useMemo(() => {
    let items = allItems;
    if (filterUser !== "all") {
      items = items.filter((item) => String(item.email || "") === filterUser);
    }
    if (search) {
      items = items.filter((item) =>
        JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
      );
    }
    return items;
  }, [allItems, filterUser, search]);

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          🧠 Petryk&apos;s Brain
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Everything Petryk remembers. Filter by user to see who told him what.
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
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="Search Petryk's memory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">All users</option>
          {users.map((u) => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
        <div className="flex rounded-md border border-input overflow-hidden">
          <button
            onClick={() => setView("cards")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "cards" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setView("table")}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              view === "table" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Table
          </button>
        </div>
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

      {/* Empty state */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-4xl mb-3">🐷</div>
            <p className="text-muted-foreground">
              {search || filterUser !== "all"
                ? "Nothing matches those filters."
                : "Petryk's brain is empty. Send him some data!"}
            </p>
          </CardContent>
        </Card>
      ) : view === "table" ? (
        /* ── Table View ── */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Message / Filename</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((item) => {
                    const id = String(item.id);
                    const isFile = item.type === "file";
                    return (
                      <TableRow key={id}>
                        <TableCell className="font-mono text-xs">
                          {id.slice(0, 8)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.email ? (
                            <button
                              className="text-pink-400 hover:underline"
                              onClick={() => setFilterUser(String(item.email))}
                            >
                              {String(item.email)}
                            </button>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm max-w-[300px] truncate">
                          {isFile
                            ? String(item.filename || id)
                            : String(item.message || "").slice(0, 80) || (
                                <span className="text-muted-foreground italic">no message</span>
                              )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {isFile ? "📎 file" : "💾 data"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(item)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(id)}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* ── Card View ── */
        <div className="space-y-3">
          {filtered.map((item) => {
            const id = String(item.id);
            const isExpanded = expanded === id;
            const isFile = item.type === "file";

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
                          ? String(item.filename || id)
                          : String(item.message || "").slice(0, 60) || id}
                      </CardTitle>
                      <CardDescription className="text-xs truncate mt-0.5">
                        {item.email && (
                          <span className="text-pink-400 mr-2">{String(item.email)}</span>
                        )}
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
                          {Object.entries(item).map(([key, val]) => {
                            const display = typeof val === "object"
                              ? JSON.stringify(val, null, 2)
                              : String(val ?? "");
                            return (
                              <tr key={key} className="border-b border-border/50 last:border-0">
                                <td className="py-2 pr-4 font-medium text-muted-foreground align-top whitespace-nowrap w-[120px]">
                                  {key}
                                </td>
                                <td className="py-2 font-mono text-xs break-all">
                                  {display}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* File preview */}
                    {isFile && item.url && (
                      <div>
                        {String(item.content_type || "").startsWith("image/") ? (
                          <img
                            src={String(item.url)}
                            alt={String(item.filename)}
                            className="max-h-64 rounded-lg border"
                          />
                        ) : (
                          <a
                            href={String(item.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:underline"
                          >
                            Open file: {String(item.filename)}
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
