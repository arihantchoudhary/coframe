"use client";

import { useState, useEffect, useRef } from "react";
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

type Item = Record<string, unknown>;

export default function ReadPage() {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  // inline editing state: { itemId: { field: editedValue } }
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});
  const [editingCell, setEditingCell] = useState<{ id: string; col: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // new field state
  const [addingFieldFor, setAddingFieldFor] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

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

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  function startEdit(id: string, col: string, currentValue: string) {
    if (col === "id") return; // don't edit the id
    setEditingCell({ id, col });
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [col]: currentValue },
    }));
  }

  function updateEdit(id: string, col: string, value: string) {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [col]: value },
    }));
  }

  async function saveCell(id: string, col: string) {
    setEditingCell(null);
    const value = edits[id]?.[col];
    if (value === undefined) return;

    // find the original item
    const original = allItems.find((item) => item.id === id);
    if (!original) return;

    // check if actually changed
    const originalValue = original[col] !== undefined ? String(original[col]) : "";
    if (value === originalValue) return;

    setSaving(id);
    setError("");
    setMessage("");
    try {
      const updated = { ...original, [col]: value };
      delete updated.id; // don't send id in body
      const res = await fetch(`${API_URL}/data/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMessage(`Updated "${col}" for ${(id as string).slice(0, 8)}...`);
      loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(null);
    }
  }

  async function handleDelete(id: string) {
    setError("");
    setMessage("");
    try {
      const res = await fetch(`${API_URL}/data/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMessage(`Deleted ${id.slice(0, 8)}...`);
      loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function handleAddField(id: string) {
    if (!newFieldName.trim()) return;
    setError("");
    setMessage("");
    const original = allItems.find((item) => item.id === id);
    if (!original) return;

    try {
      const updated = { ...original, [newFieldName.trim()]: newFieldValue };
      delete updated.id;
      const res = await fetch(`${API_URL}/data/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setMessage(`Added field "${newFieldName}" to ${(id as string).slice(0, 8)}...`);
      setAddingFieldFor(null);
      setNewFieldName("");
      setNewFieldValue("");
      loadAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  // collect all unique keys across items for table columns
  const allKeys = Array.from(
    new Set(allItems.flatMap((item) => Object.keys(item)))
  );
  const columns = ["id", ...allKeys.filter((k) => k !== "id")];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Read / Update / Delete</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Double-click any cell to edit inline. Changes save on blur or Enter.
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Database</CardTitle>
              <CardDescription>
                {allItems.length} item{allItems.length !== 1 ? "s" : ""} — double-click to edit, changes auto-save
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
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((col) => (
                      <TableHead key={col} className="whitespace-nowrap">
                        {col}
                      </TableHead>
                    ))}
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allItems.map((row) => {
                    const rowId = row.id as string;
                    const isRowSaving = saving === rowId;
                    return (
                      <TableRow
                        key={rowId}
                        className={isRowSaving ? "opacity-50" : ""}
                      >
                        {columns.map((col) => {
                          const isEditing =
                            editingCell?.id === rowId &&
                            editingCell?.col === col;
                          const rawValue =
                            row[col] !== undefined
                              ? typeof row[col] === "object"
                                ? JSON.stringify(row[col])
                                : String(row[col])
                              : "";

                          if (isEditing) {
                            return (
                              <TableCell key={col} className="p-0">
                                <Input
                                  ref={inputRef}
                                  className="h-8 rounded-none border-0 border-b-2 border-blue-500 bg-blue-500/10 font-mono text-xs focus-visible:ring-0"
                                  value={edits[rowId]?.[col] ?? rawValue}
                                  onChange={(e) =>
                                    updateEdit(rowId, col, e.target.value)
                                  }
                                  onBlur={() => saveCell(rowId, col)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") saveCell(rowId, col);
                                    if (e.key === "Escape")
                                      setEditingCell(null);
                                  }}
                                />
                              </TableCell>
                            );
                          }

                          return (
                            <TableCell
                              key={col}
                              className={`font-mono text-xs ${
                                col === "id"
                                  ? "text-muted-foreground"
                                  : "cursor-pointer hover:bg-muted/50"
                              }`}
                              onDoubleClick={() =>
                                startEdit(rowId, col, rawValue)
                              }
                            >
                              {col === "id" ? (
                                <span title={rawValue}>
                                  {rawValue.slice(0, 8)}...
                                </span>
                              ) : (
                                rawValue || "—"
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell>
                          <div className="flex gap-1">
                            {addingFieldFor === rowId ? (
                              <div className="flex gap-1 items-center">
                                <Input
                                  className="h-7 w-20 text-xs"
                                  placeholder="field"
                                  value={newFieldName}
                                  onChange={(e) =>
                                    setNewFieldName(e.target.value)
                                  }
                                />
                                <Input
                                  className="h-7 w-20 text-xs"
                                  placeholder="value"
                                  value={newFieldValue}
                                  onChange={(e) =>
                                    setNewFieldValue(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter")
                                      handleAddField(rowId);
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleAddField(rowId)}
                                >
                                  Add
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => setAddingFieldFor(null)}
                                >
                                  X
                                </Button>
                              </div>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => {
                                    setAddingFieldFor(rowId);
                                    setNewFieldName("");
                                    setNewFieldValue("");
                                  }}
                                >
                                  + Field
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-7 px-2 text-xs"
                                  onClick={() => handleDelete(rowId)}
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick lookup */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Lookup</CardTitle>
        </CardHeader>
        <CardContent>
          <QuickLookup />
        </CardContent>
      </Card>
    </div>
  );
}

function QuickLookup() {
  const [fetchId, setFetchId] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleFetch() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/data/${fetchId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
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
      {error && <p className="text-destructive text-sm">{error}</p>}
      {result && (
        <pre className="bg-muted rounded-lg p-4 text-sm font-mono overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
