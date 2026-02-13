"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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

export default function WritePage() {
  const [jsonInput, setJsonInput] = useState('{\n  "name": "test"\n}');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePush() {
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const body = JSON.parse(jsonInput);
      const res = await fetch(`${API_URL}/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
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
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Write Data</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Push arbitrary JSON into the coframe-data table.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Item</CardTitle>
          <CardDescription>
            Enter JSON below. An <code className="text-xs">id</code> will be
            auto-generated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            className="font-mono text-sm min-h-[200px]"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"key": "value"}'
          />
          <Button onClick={handlePush} disabled={loading}>
            {loading ? "Pushing..." : "Push Data"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Created <Badge variant="secondary">{(result as Record<string, unknown>).id as string}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted rounded-lg p-4 text-sm font-mono overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
