"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
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
import { Progress } from "@/components/ui/progress";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://yh9fp9463n.us-east-1.awsapprunner.com";

type FileUpload = {
  file: File;
  id: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
  result?: Record<string, unknown>;
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function fileIcon(contentType: string): string {
  if (contentType.startsWith("image/")) return "🖼";
  if (contentType.startsWith("video/")) return "🎬";
  if (contentType.startsWith("audio/")) return "🎵";
  if (contentType.includes("pdf")) return "📄";
  if (contentType.includes("presentation") || contentType.includes("pptx"))
    return "📊";
  if (
    contentType.includes("document") ||
    contentType.includes("docx") ||
    contentType.includes("msword")
  )
    return "📝";
  if (contentType.includes("spreadsheet") || contentType.includes("xlsx"))
    return "📈";
  return "📎";
}

export default function UploadPage() {
  const { user } = useUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || "";
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [files, setFiles] = useState<Record<string, unknown>[]>([]);
  const [dragging, setDragging] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  async function loadFiles() {
    setLoadingFiles(true);
    try {
      const res = await fetch(`${API_URL}/files`);
      if (!res.ok) return;
      const data = await res.json();
      setFiles(data);
    } catch {
      // silent
    } finally {
      setLoadingFiles(false);
    }
  }

  useEffect(() => {
    loadFiles();
  }, []);

  const processFiles = useCallback(async (fileList: FileList | File[]) => {
    const newFiles = Array.from(fileList);
    const newUploads: FileUpload[] = newFiles.map((f) => ({
      file: f,
      id: crypto.randomUUID(),
      status: "pending" as const,
      progress: 0,
    }));

    setUploads((prev) => [...newUploads, ...prev]);

    for (const upload of newUploads) {
      try {
        // Update status to uploading
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id ? { ...u, status: "uploading", progress: 10 } : u
          )
        );

        // Get presigned URL
        const presignRes = await fetch(`${API_URL}/upload/presign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: upload.file.name,
            content_type: upload.file.type || "application/octet-stream",
          }),
        });
        if (!presignRes.ok) throw new Error("Failed to get upload URL");
        const { upload_url, file_id, key } = await presignRes.json();

        setUploads((prev) =>
          prev.map((u) => (u.id === upload.id ? { ...u, progress: 30 } : u))
        );

        // Upload to S3
        const uploadRes = await fetch(upload_url, {
          method: "PUT",
          headers: { "Content-Type": upload.file.type || "application/octet-stream" },
          body: upload.file,
        });
        if (!uploadRes.ok) throw new Error("Upload to S3 failed");

        setUploads((prev) =>
          prev.map((u) => (u.id === upload.id ? { ...u, progress: 80 } : u))
        );

        // Complete upload (save metadata)
        const completeRes = await fetch(`${API_URL}/upload/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_id,
            filename: upload.file.name,
            content_type: upload.file.type || "application/octet-stream",
            key,
            size: upload.file.size,
            email: userEmail,
          }),
        });
        if (!completeRes.ok) throw new Error("Failed to save metadata");
        const result = await completeRes.json();

        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? { ...u, status: "done", progress: 100, result }
              : u
          )
        );
      } catch (e: unknown) {
        setUploads((prev) =>
          prev.map((u) =>
            u.id === upload.id
              ? {
                  ...u,
                  status: "error",
                  error: e instanceof Error ? e.message : String(e),
                }
              : u
          )
        );
      }
    }

    loadFiles();
  }, []);

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    dragCounter.current = 0;
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = "";
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Files</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Upload images, videos, audio, documents — drag & drop or click to
          browse.
        </p>
      </div>

      {/* Drop zone */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          dragging
            ? "border-blue-500 bg-blue-500/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="text-5xl">{dragging ? "📥" : "📁"}</div>
          <div className="text-center">
            <p className="text-lg font-medium">
              {dragging ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              or click to browse — images, videos, audio, PDF, PPTX, DOCX, and
              more
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
            Browse Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,video/*,audio/*,.pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.csv,.txt,.zip,.rar"
          />
        </CardContent>
      </Card>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploads</CardTitle>
            <CardDescription>
              {uploads.filter((u) => u.status === "done").length}/{uploads.length}{" "}
              completed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
              >
                <span className="text-2xl">
                  {fileIcon(upload.file.type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {upload.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(upload.file.size)}
                  </p>
                  {upload.status === "uploading" && (
                    <Progress value={upload.progress} className="mt-2 h-1.5" />
                  )}
                  {upload.status === "error" && (
                    <p className="text-xs text-destructive mt-1">
                      {upload.error}
                    </p>
                  )}
                </div>
                <Badge
                  variant={
                    upload.status === "done"
                      ? "secondary"
                      : upload.status === "error"
                      ? "destructive"
                      : "outline"
                  }
                >
                  {upload.status === "done"
                    ? "Done"
                    : upload.status === "error"
                    ? "Failed"
                    : upload.status === "uploading"
                    ? "Uploading"
                    : "Pending"}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Uploaded files */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Uploaded Files</CardTitle>
              <CardDescription>
                {files.length} file{files.length !== 1 ? "s" : ""} in storage
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadFiles}
              disabled={loadingFiles}
            >
              {loadingFiles ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-muted-foreground text-sm">No files uploaded yet.</p>
          ) : (
            <div className="rounded-md border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {files.map((file) => (
                    <TableRow key={file.id as string}>
                      <TableCell className="text-xl">
                        {fileIcon(file.content_type as string)}
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-[200px] truncate">
                        {file.filename as string}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatBytes(Number(file.size))}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {file.uploaded_at
                          ? new Date(
                              file.uploaded_at as string
                            ).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <a
                          href={file.url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:underline"
                        >
                          Open
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
