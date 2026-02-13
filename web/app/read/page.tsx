"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://yh9fp9463n.us-east-1.awsapprunner.com";

export default function ReadPage() {
  const [fetchId, setFetchId] = useState("");
  const [item, setItem] = useState<Record<string, unknown> | null>(null);
  const [editJson, setEditJson] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
      setMessage("Item deleted.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Read / Update / Delete</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Look up an item by ID, then edit or delete it.
        </p>
      </div>

      {/* Lookup */}
      <Card>
        <CardHeader>
          <CardTitle>Lookup</CardTitle>
          <CardDescription>Enter an item ID to fetch it.</CardDescription>
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
