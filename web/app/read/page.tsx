"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

export default function ReadPage() {
  const [allItems, setAllItems] = useState<Record<string, unknown>[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);

  const [fetchId, setFetchId] = useState("");
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [editJson, setEditJson] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

  function selectItem(selected: Record<string, unknown>) {
    setFetchId(selected.id as string);
    setItem(selected);
    setEditJson(JSON.stringify(selected, null, 2));
    setError("");
    setMessage("");
  }

  async function handleFetch() {
    setError("");
    setMessage("");
    setItem(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/data/${fetchId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItem(data);
      setEditJson(JSON.stringify(data, null, 2));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const body = JSON.parse(editJson);
      const res = await fetch(`${API_URL}/data/${fetchId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItem(data);
      setEditJson(JSON.stringify(data, null, 2));
      setMessage("Item updated successfully.");
      loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/data/${fetchId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItem(null);
      setEditJson("");
      setFetchId("");
      setMessage("Item deleted.");
      loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  // collect all unique keys across items for table columns
  const allKeys = Array.from(
    new Set(allItems.flatMap((item) => Object.keys(item)))
  );
  // put id first
  const columns = ["id", ...allKeys.filter((k) => k !== "id")];

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Read / Update / Delete</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse all items or look up by ID. Click a row to edit or delete.
        </p>
      </div>

      {/* All items table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Items</CardTitle>
              <CardDescription>
                {allItems.length} item{allItems.length !== 1 ? "s" : ""} in
                database
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAll}
              disabled={loadingAll}
            >
              {loadingAll ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {allItems.length === 0 ? (
            <p className="text-muted-foreground text-sm">No items yet.</p>
          ) : (
            <div className="rounded-md border overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allItems.map((row) => (
                    <TableRow
                      key={row.id as string}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => selectItem(row)}
                    >
                      {columns.map((col) => (
                        <TableCell key={col} className="font-mono text-xs">
                          {row[col] !== undefined
                            ? typeof row[col] === "object"
                              ? JSON.stringify(row[col])
                              : String(row[col])
                            : "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lookup by ID */}
      <Card>
        <CardHeader>
          <CardTitle>Lookup by ID</CardTitle>
          <CardDescription>
            Enter an item ID to fetch it, or click a row above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              className="font-mono"
              value={fetchId}
              onChange={(e) => setFetchId(e.target.value)}
              placeholder="Enter item ID..."
              onKeyDown={(e) => e.key === "Enter" && fetchId && handleFetch()}
            />
            <Button onClick={handleFetch} disabled={loading || !fetchId}>
              {loading ? "Loading..." : "Fetch"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {message && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-green-500">{message}</p>
          </CardContent>
        </Card>
      )}

      {/* Item view / edit */}
      {item && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Item <Badge variant="secondary">{item.id as string}</Badge>
            </CardTitle>
            <CardDescription>
              Edit the JSON below and save, or delete the item.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              className="font-mono text-sm min-h-[250px]"
              value={editJson}
              onChange={(e) => setEditJson(e.target.value)}
            />
            <div className="flex gap-3">
              <Button onClick={handleUpdate} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Item"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
