"use client";

import { useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://yh9fp9463n.us-east-1.awsapprunner.com";

export default function Home() {
  const [jsonInput, setJsonInput] = useState('{\n  "name": "test"\n}');
  const [pushResult, setPushResult] = useState<Record<string, unknown> | null>(null);
  const [pushError, setPushError] = useState("");
  const [pushLoading, setPushLoading] = useState(false);

  const [fetchId, setFetchId] = useState("");
  const [fetchResult, setFetchResult] = useState<Record<string, unknown> | null>(null);
  const [fetchError, setFetchError] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);

  async function handlePush() {
    setPushError("");
    setPushResult(null);
    setPushLoading(true);
    try {
      const body = JSON.parse(jsonInput);
      const res = await fetch(`${API_URL}/data`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPushResult(data);
    } catch (e: unknown) {
      setPushError(e instanceof Error ? e.message : String(e));
    } finally {
      setPushLoading(false);
    }
  }

  async function handleFetch() {
    setFetchError("");
    setFetchResult(null);
    setFetchLoading(true);
    try {
      const res = await fetch(`${API_URL}/data/${fetchId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFetchResult(data);
    } catch (e: unknown) {
      setFetchError(e instanceof Error ? e.message : String(e));
    } finally {
      setFetchLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-2xl mx-auto space-y-10">
        <h1 className="text-3xl font-bold">Coframe Data</h1>

        {/* Push Data */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Push Data</h2>
          <textarea
            className="w-full h-40 bg-zinc-900 border border-zinc-700 rounded-lg p-4 font-mono text-sm focus:outline-none focus:border-blue-500"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder='{"key": "value"}'
          />
          <button
            onClick={handlePush}
            disabled={pushLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg font-medium transition-colors"
          >
            {pushLoading ? "Pushing..." : "Push Data"}
          </button>
          {pushError && (
            <p className="text-red-400 text-sm">{pushError}</p>
          )}
          {pushResult && (
            <pre className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-sm overflow-auto">
              {JSON.stringify(pushResult, null, 2)}
            </pre>
          )}
        </section>

        {/* Fetch Data */}
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Fetch Data</h2>
          <div className="flex gap-3">
            <input
              type="text"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 font-mono text-sm focus:outline-none focus:border-blue-500"
              value={fetchId}
              onChange={(e) => setFetchId(e.target.value)}
              placeholder="Enter item ID..."
            />
            <button
              onClick={handleFetch}
              disabled={fetchLoading || !fetchId}
              className="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 rounded-lg font-medium transition-colors"
            >
              {fetchLoading ? "Fetching..." : "Fetch"}
            </button>
          </div>
          {fetchError && (
            <p className="text-red-400 text-sm">{fetchError}</p>
          )}
          {fetchResult && (
            <pre className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-sm overflow-auto">
              {JSON.stringify(fetchResult, null, 2)}
            </pre>
          )}
        </section>
      </div>
    </div>
  );
}
