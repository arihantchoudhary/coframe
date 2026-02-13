"use client";

import { Suspense, useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
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
import { Progress } from "@/components/ui/progress";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://yh9fp9463n.us-east-1.awsapprunner.com";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function fileIcon(type: string): string {
  if (type.startsWith("image/")) return "🖼";
  if (type.startsWith("video/")) return "🎬";
  if (type.startsWith("audio/")) return "🎵";
  if (type.includes("pdf")) return "📄";
  if (type.includes("presentation") || type.includes("pptx")) return "📊";
  if (type.includes("document") || type.includes("docx") || type.includes("msword")) return "📝";
  if (type.includes("spreadsheet") || type.includes("xlsx")) return "📈";
  return "📎";
}

type AttachedFile = {
  file: File;
  localId: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  result?: { file_id: string; url: string; key: string };
  error?: string;
};

export default function WritePage() {
  return (
    <Suspense fallback={<div className="max-w-4xl mx-auto p-8">Loading...</div>}>
      <WritePageInner />
    </Suspense>
  );
}

function WritePageInner() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState("");
  const [extraFields, setExtraFields] = useState<{ key: string; value: string }[]>([]);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefill from URL params (when editing from the read page)
  const prefillRaw = useMemo(() => searchParams.get("prefill"), [searchParams]);
  useEffect(() => {
    if (!prefillRaw) return;
    try {
      const data = JSON.parse(prefillRaw);
      if (data.id) setEditingId(data.id);
      if (data.email) setEmail(data.email);
      if (data.message) setMessage(String(data.message));
      // Load extra fields from remaining keys
      const skipKeys = new Set(["id", "email", "message", "type", "files"]);
      const fields: { key: string; value: string }[] = [];
      for (const [k, v] of Object.entries(data)) {
        if (skipKeys.has(k)) continue;
        fields.push({ key: k, value: typeof v === "object" ? JSON.stringify(v) : String(v) });
      }
      if (fields.length > 0) setExtraFields(fields);
    } catch {
      // invalid prefill, ignore
    }
  }, [prefillRaw]);

  function validateEmail(value: string) {
    setEmail(value);
    if (!value) setEmailError("Email is required.");
    else if (!EMAIL_RE.test(value)) setEmailError("Please enter a valid email address.");
    else setEmailError("");
  }

  function addField() {
    setExtraFields([...extraFields, { key: "", value: "" }]);
  }

  function updateField(i: number, k: string, v: string) {
    const updated = [...extraFields];
    updated[i] = { key: k, value: v };
    setExtraFields(updated);
  }

  function removeField(i: number) {
    setExtraFields(extraFields.filter((_, idx) => idx !== i));
  }

  const addFiles = useCallback((fileList: FileList | File[]) => {
    const newFiles: AttachedFile[] = Array.from(fileList).map((f) => ({
      file: f,
      localId: crypto.randomUUID(),
      status: "pending" as const,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  function removeFile(localId: string) {
    setFiles((prev) => prev.filter((f) => f.localId !== localId));
  }

  async function uploadFile(af: AttachedFile): Promise<{ file_id: string; url: string; filename: string }> {
    setFiles((prev) =>
      prev.map((f) => (f.localId === af.localId ? { ...f, status: "uploading", progress: 20 } : f))
    );

    const presignRes = await fetch(`${API_URL}/upload/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: af.file.name, content_type: af.file.type || "application/octet-stream" }),
    });
    if (!presignRes.ok) throw new Error("Failed to get upload URL");
    const { upload_url, file_id, key } = await presignRes.json();

    setFiles((prev) =>
      prev.map((f) => (f.localId === af.localId ? { ...f, progress: 50 } : f))
    );

    const uploadRes = await fetch(upload_url, {
      method: "PUT",
      headers: { "Content-Type": af.file.type || "application/octet-stream" },
      body: af.file,
    });
    if (!uploadRes.ok) throw new Error("Upload failed");

    setFiles((prev) =>
      prev.map((f) => (f.localId === af.localId ? { ...f, progress: 80 } : f))
    );

    const completeRes = await fetch(`${API_URL}/upload/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id, filename: af.file.name, content_type: af.file.type, key, size: af.file.size }),
    });
    if (!completeRes.ok) throw new Error("Failed to save file metadata");
    const fileResult = await completeRes.json();

    setFiles((prev) =>
      prev.map((f) => (f.localId === af.localId ? { ...f, status: "done", progress: 100, result: fileResult } : f))
    );

    return { file_id, url: fileResult.url, filename: af.file.name };
  }

  async function handleSubmit() {
    setError("");
    setResult(null);

    if (!email) { setEmailError("Email is required."); return; }
    if (!EMAIL_RE.test(email)) { setEmailError("Please enter a valid email address."); return; }

    setLoading(true);
    try {
      // Upload all files first
      const uploadedFiles = [];
      for (const af of files.filter((f) => f.status !== "done")) {
        try {
          const result = await uploadFile(af);
          uploadedFiles.push(result);
        } catch (e: unknown) {
          setFiles((prev) =>
            prev.map((f) =>
              f.localId === af.localId
                ? { ...f, status: "error", error: e instanceof Error ? e.message : String(e) }
                : f
            )
          );
        }
      }
      // Also include already-uploaded files
      for (const af of files.filter((f) => f.status === "done" && f.result)) {
        uploadedFiles.push({ file_id: af.result!.file_id, url: af.result!.url, filename: af.file.name });
      }

      // Build data payload
      const body: Record<string, unknown> = { email };
      if (message.trim()) body.message = message.trim();

      for (const field of extraFields) {
        if (field.key.trim()) body[field.key.trim()] = field.value;
      }

      if (uploadedFiles.length > 0) {
        body.files = uploadedFiles;
      }

      const url = editingId ? `${API_URL}/data/${editingId}` : `${API_URL}/data`;
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.detail || `HTTP ${res.status}`);
      }
      const data = await res.json();
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current++;
    setDragging(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); e.stopPropagation(); }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); e.stopPropagation();
    setDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  }

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          {editingId ? "✏️ Update Memory" : "💬 Talk to Petryk"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {editingId
            ? `Editing item ${editingId.slice(0, 8)}... — change anything and add more files.`
            : "Send anything — text, key-value data, images, videos, audio, documents. Petryk remembers it all."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Existing Memory" : "New Memory"}</CardTitle>
          <CardDescription>
            {editingId
              ? "Update the fields below and attach new files. Petryk will update his memory."
              : "Fill in what you need. Attach files by dragging or browsing. Petryk will send you a confirmation email."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => validateEmail(e.target.value)}
              placeholder="you@example.com"
            />
            {emailError && <p className="text-destructive text-xs">{emailError}</p>}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message / Notes</label>
            <Textarea
              className="min-h-[100px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write anything here..."
            />
          </div>

          {/* Extra fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Custom Fields</label>
              <Button variant="outline" size="sm" onClick={addField}>
                + Add Field
              </Button>
            </div>
            {extraFields.map((field, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  className="w-1/3"
                  placeholder="Field name"
                  value={field.key}
                  onChange={(e) => updateField(i, e.target.value, field.value)}
                />
                <Input
                  className="flex-1"
                  placeholder="Value"
                  value={field.value}
                  onChange={(e) => updateField(i, field.key, e.target.value)}
                />
                <Button variant="ghost" size="sm" onClick={() => removeField(i)} className="text-muted-foreground hover:text-destructive px-2">
                  X
                </Button>
              </div>
            ))}
          </div>

          {/* File drop zone */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Attachments</label>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                dragging ? "border-blue-500 bg-blue-500/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-3xl mb-2">{dragging ? "📥" : "📁"}</div>
              <p className="text-sm font-medium">{dragging ? "Drop files here" : "Drag & drop files here"}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Images, videos, audio, PDF, PPTX, DOCX, and more
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
                accept="image/*,video/*,audio/*,.pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.csv,.txt,.zip,.rar"
              />
            </div>

            {/* Attached files list */}
            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((af) => (
                  <div key={af.localId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <span className="text-xl">{fileIcon(af.file.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{af.file.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(af.file.size)}</p>
                      {af.status === "uploading" && <Progress value={af.progress} className="mt-1 h-1" />}
                      {af.status === "error" && <p className="text-xs text-destructive mt-1">{af.error}</p>}
                    </div>
                    {af.status === "done" ? (
                      <Badge variant="secondary">Uploaded</Badge>
                    ) : af.status === "uploading" ? (
                      <Badge variant="outline">Uploading</Badge>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive px-2" onClick={() => removeFile(af.localId)}>
                        X
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={loading || !!emailError || !email}
            className="w-full h-12 text-base"
          >
            {loading ? "Sending..." : editingId ? "Update Memory" : "Send to Petryk"}
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
              Saved <Badge variant="secondary">{(result as Record<string, unknown>).id as string}</Badge>
            </CardTitle>
            <CardDescription>Confirmation email sent to {email}</CardDescription>
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
