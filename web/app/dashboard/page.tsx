"use client";

import { useEffect, useState, useRef } from "react";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
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

// Keys to hide from the "extra fields" display
const HIDDEN_KEYS = new Set([
  "id",
  "email",
  "message",
  "files",
  "type",
  "filename",
  "url",
  "content_type",
  "size",
  "s3_key",
  "text_content",
  "uploaded_at",
]);

// Keys that look like AI-generated insights from Petryk / Gemini
const AI_KEYS = new Set([
  "opinion",
  "petryk_opinion",
  "understanding",
  "description",
  "ai_description",
  "image_description",
  "analysis",
  "inference",
  "insight",
  "summary",
]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Item = Record<string, any>;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function fileIcon(contentType: string): string {
  if (!contentType) return "📎";
  if (contentType.startsWith("image/")) return "🖼";
  if (contentType.startsWith("video/")) return "🎬";
  if (contentType.startsWith("audio/")) return "🎵";
  if (contentType.includes("pdf")) return "📄";
  return "📎";
}

export default function DashboardPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [documents, setDocuments] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm Petryk. Ask me anything about your documents — I can see everything you've uploaded.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userEmail = user?.emailAddresses?.[0]?.emailAddress;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch documents filtered by user's email
  useEffect(() => {
    if (!isSignedIn || !userEmail) return;
    console.log("[Dashboard] Fetching data for user:", userEmail);
    (async () => {
      try {
        const res = await fetch(`${API_URL}/data`);
        console.log("[Dashboard] GET /data response status:", res.status);
        if (res.ok) {
          const data = await res.json();
          const all: Item[] = Array.isArray(data) ? data : data.items ?? [];
          console.log("[Dashboard] Total items from API:", all.length);
          console.log("[Dashboard] All items:", JSON.stringify(all, null, 2));
          // Filter to only this user's entries
          const mine = all.filter(
            (item) =>
              String(item.email || "").toLowerCase() ===
              userEmail.toLowerCase()
          );
          console.log("[Dashboard] Filtered to user's items:", mine.length);
          console.log("[Dashboard] User's items:", JSON.stringify(mine, null, 2));
          setDocuments(mine);
        }
      } catch (err) {
        console.error("[Dashboard] Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isSignedIn, userEmail]);

  if (!isLoaded) {
    return (
      <div className="min-h-[calc(100vh-65px)] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <RedirectToSignIn />;
  }

  // ── Helpers ──

  /** Get all AI-insight fields from a document */
  function getAiFields(item: Item): [string, string][] {
    return Object.entries(item)
      .filter(
        ([key, val]) =>
          val &&
          typeof val === "string" &&
          (AI_KEYS.has(key.toLowerCase()) ||
            key.toLowerCase().includes("opinion") ||
            key.toLowerCase().includes("description") ||
            key.toLowerCase().includes("understanding") ||
            key.toLowerCase().includes("analysis") ||
            key.toLowerCase().includes("inference"))
      )
      .map(([k, v]) => [k, String(v)]);
  }

  /** Get extra data fields (not hidden, not AI) */
  function getExtraFields(item: Item): [string, string][] {
    const aiKeys = new Set(getAiFields(item).map(([k]) => k));
    return Object.entries(item)
      .filter(
        ([key, val]) =>
          !HIDDEN_KEYS.has(key) &&
          !aiKeys.has(key) &&
          val !== null &&
          val !== undefined &&
          val !== ""
      )
      .map(([k, v]) => [
        k,
        typeof v === "object" ? JSON.stringify(v, null, 2) : String(v),
      ]);
  }

  function buildContext(): string {
    if (documents.length === 0)
      return "No documents found for this user.";

    const MAX_CONTENT_PER_DOC = 2000;
    const MAX_TOTAL_CONTEXT = 60000;
    let totalLength = 0;

    return documents
      .slice(0, 50)
      .map((doc, i) => {
        if (totalLength > MAX_TOTAL_CONTEXT) return null;

        const parts: string[] = [`Document ${i + 1} (ID: ${doc.id})`];
        if (doc.message) parts.push(`Message: ${doc.message}`);
        if (doc.type === "file" && doc.filename)
          parts.push(`Filename: ${doc.filename}`);

        for (const [key, val] of Object.entries(doc)) {
          if (
            ["id", "email", "files", "type", "url", "content_type", "size", "s3_key", "message", "filename"].includes(key) ||
            !val ||
            typeof val !== "string"
          ) continue;

          if (key === "text_content" || key === "image_description") {
            const truncated = val.length > MAX_CONTENT_PER_DOC
              ? val.slice(0, MAX_CONTENT_PER_DOC) + "... [truncated]"
              : val;
            parts.push(`${key}: ${truncated}`);
          } else {
            parts.push(`${key}: ${val}`);
          }
        }

        if (doc.files?.length > 0) {
          parts.push(
            `Files: ${doc.files.map((f: { filename: string }) => f.filename).join(", ")}`
          );
        }

        const section = parts.join("\n  ");
        totalLength += section.length;
        return section;
      })
      .filter(Boolean)
      .join("\n\n");
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || thinking) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    console.log("[Chat] User query:", text);
    console.log("[Chat] Documents available:", documents.length);

    try {
      const context = buildContext();
      console.log("[Chat] Built context length:", context.length);
      console.log("[Chat] Context preview:", context.slice(0, 500));

      const systemPrompt = `You are Petryk, a helpful AI assistant. The user is ${user?.firstName || "a user"} (${userEmail}). You have access to the following documents they stored in the database:\n\n${context}\n\nAnswer questions about these documents helpfully and concisely. If asked about something not in the documents, say so honestly.`;

      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      console.log("[Chat] Sending to API:", `${API_URL}/chat`);
      console.log("[Chat] Payload:", JSON.stringify({ messages: chatHistory, system: systemPrompt }, null, 2));

      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory, system: systemPrompt }),
      });

      console.log("[Chat] API response status:", res.status);

      if (res.ok) {
        const data = await res.json();
        console.log("[Chat] API response data:", JSON.stringify(data, null, 2));
        const reply =
          data.response || data.message || data.content || "Sorry, I couldn't process that.";
        console.log("[Chat] Reply to show:", reply);
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } else {
        const errText = await res.text();
        console.warn("[Chat] API failed, status:", res.status, "body:", errText);
        console.log("[Chat] Falling back to local reply");
        const fallback = generateLocalReply(text);
        console.log("[Chat] Local fallback reply:", fallback);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fallback },
        ]);
      }
    } catch (err) {
      console.error("[Chat] Error:", err);
      console.log("[Chat] Falling back to local reply");
      const fallback = generateLocalReply(text);
      console.log("[Chat] Local fallback reply:", fallback);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: fallback },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function generateLocalReply(query: string): string {
    const q = query.toLowerCase();
    console.log("[LocalReply] Query:", q);
    console.log("[LocalReply] Documents to search:", documents.length);

    // If asking about what they have / uploaded / how many — just list everything
    if (
      q.includes("how many") ||
      q.includes("what") ||
      q.includes("uploaded") ||
      q.includes("list") ||
      q.includes("show") ||
      q.includes("everything")
    ) {
      console.log("[LocalReply] Listing all documents");
      if (documents.length === 0) {
        return "You don't have any documents in the database yet.";
      }
      const summaries = documents.map((doc, i) => {
        const parts: string[] = [`${i + 1}.`];
        if (doc.message) parts.push(`"${doc.message}"`);
        if (doc.type === "file" && doc.filename) parts.push(`File: ${doc.filename}`);
        const ai = getAiFields(doc);
        if (ai.length > 0) parts.push(`\n   Petryk's take: ${ai[0][1]}`);
        return parts.join(" ");
      });
      return `You have ${documents.length} item${documents.length !== 1 ? "s" : ""} in the database:\n\n${summaries.join("\n\n")}`;
    }

    // Search documents for matching content
    const matches = documents.filter((doc) => {
      const searchable = JSON.stringify(doc).toLowerCase();
      const words = q.split(/\s+/).filter((w) => w.length > 2);
      return words.some((word) => searchable.includes(word));
    });
    console.log("[LocalReply] Keyword matches:", matches.length);

    if (matches.length > 0) {
      const summaries = matches.slice(0, 10).map((doc, i) => {
        const parts: string[] = [`${i + 1}.`];
        if (doc.message) parts.push(`"${doc.message}"`);
        if (doc.type === "file" && doc.filename) parts.push(`File: ${doc.filename}`);
        const ai = getAiFields(doc);
        if (ai.length > 0) parts.push(`\n   Petryk's take: ${ai[0][1]}`);
        return parts.join(" ");
      });
      return `I found ${matches.length} matching document${matches.length !== 1 ? "s" : ""}:\n\n${summaries.join("\n\n")}`;
    }

    return `I searched through your ${documents.length} documents but couldn't find anything matching "${query}". Try asking "what have I uploaded?" or about specific content.`;
  }

  // ── Render ──

  const dataItems = documents.filter((d) => d.type !== "file");
  const fileItems = documents.filter((d) => d.type === "file");

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.firstName || "there"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Showing your data for{" "}
          <span className="text-pink-400 font-medium">{userEmail}</span>
          {" "}&mdash; {documents.length} item{documents.length !== 1 ? "s" : ""} total
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-pulse text-muted-foreground">
            Loading your documents...
          </div>
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="text-5xl mb-4">🐷</div>
            <p className="text-muted-foreground">
              No data found for {userEmail}. Go to{" "}
              <a href="/write" className="text-pink-400 hover:underline">
                Write to Petryk
              </a>{" "}
              to add some!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Data Entries ── */}
          {dataItems.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Your Entries
                <Badge variant="secondary">{dataItems.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dataItems.map((item) => {
                  const id = String(item.id);
                  const isOpen = expanded === id;
                  const aiFields = getAiFields(item);
                  const extraFields = getExtraFields(item);
                  const files = item.files ?? [];

                  return (
                    <Card
                      key={id}
                      className={`transition-all cursor-pointer hover:border-muted-foreground/40 ${
                        isOpen ? "border-pink-500/40 col-span-full" : ""
                      }`}
                      onClick={() => setExpanded(isOpen ? null : id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm line-clamp-2">
                              {item.message || (
                                <span className="italic text-muted-foreground">
                                  No message
                                </span>
                              )}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1 font-mono">
                              {id.slice(0, 8)}...
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {files.length > 0 && (
                              <Badge variant="outline" className="text-[10px]">
                                {files.length} file{files.length !== 1 ? "s" : ""}
                              </Badge>
                            )}
                            {aiFields.length > 0 && (
                              <Badge className="text-[10px] bg-purple-500/20 text-purple-300 border-purple-500/30">
                                AI
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>

                      {/* Petryk's opinion preview (always visible) */}
                      {aiFields.length > 0 && !isOpen && (
                        <CardContent className="pt-0 pb-3">
                          <p className="text-xs text-purple-300/80 line-clamp-2">
                            <span className="font-medium">Petryk:</span>{" "}
                            {aiFields[0][1]}
                          </p>
                        </CardContent>
                      )}

                      {/* Expanded view */}
                      {isOpen && (
                        <CardContent
                          className="pt-0 space-y-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* AI insights */}
                          {aiFields.length > 0 && (
                            <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4 space-y-2">
                              <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                                Petryk&apos;s Understanding
                              </p>
                              {aiFields.map(([key, val]) => (
                                <div key={key}>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {key.replace(/_/g, " ")}
                                  </p>
                                  <p className="text-sm mt-0.5">{val}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Extra fields */}
                          {extraFields.length > 0 && (
                            <div className="rounded-lg bg-muted p-4">
                              <table className="w-full text-sm">
                                <tbody>
                                  {extraFields.map(([key, val]) => (
                                    <tr
                                      key={key}
                                      className="border-b border-border/50 last:border-0"
                                    >
                                      <td className="py-1.5 pr-4 text-muted-foreground whitespace-nowrap font-medium text-xs">
                                        {key}
                                      </td>
                                      <td className="py-1.5 text-xs font-mono break-all">
                                        {val}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Attached files */}
                          {files.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                Attached Files
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {files.map(
                                  (
                                    f: {
                                      file_id?: string;
                                      filename: string;
                                      url: string;
                                    },
                                    i: number
                                  ) => (
                                    <a
                                      key={f.file_id || i}
                                      href={f.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 rounded-md bg-muted px-3 py-1.5 text-xs hover:bg-muted-foreground/20 transition-colors"
                                    >
                                      📎 {f.filename}
                                    </a>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Uploaded Files ── */}
          {fileItems.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Your Uploads
                <Badge variant="secondary">{fileItems.length}</Badge>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {fileItems.map((item) => {
                  const id = String(item.id);
                  const isImage = String(
                    item.content_type || ""
                  ).startsWith("image/");
                  const aiFields = getAiFields(item);
                  const isOpen = expanded === `file-${id}`;

                  return (
                    <Card
                      key={id}
                      className={`transition-all cursor-pointer hover:border-muted-foreground/40 overflow-hidden ${
                        isOpen ? "col-span-full" : ""
                      }`}
                      onClick={() =>
                        setExpanded(isOpen ? null : `file-${id}`)
                      }
                    >
                      {/* Image preview */}
                      {isImage && item.url && !isOpen && (
                        <div className="h-40 overflow-hidden bg-muted">
                          <img
                            src={String(item.url)}
                            alt={String(item.filename)}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}

                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {fileIcon(String(item.content_type || ""))}
                          </span>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-sm truncate">
                              {item.filename || id}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {item.size
                                ? `${(Number(item.size) / 1024).toFixed(1)} KB`
                                : ""}
                            </CardDescription>
                          </div>
                          {aiFields.length > 0 && (
                            <Badge className="text-[10px] bg-purple-500/20 text-purple-300 border-purple-500/30 shrink-0">
                              AI
                            </Badge>
                          )}
                        </div>
                      </CardHeader>

                      {/* AI preview */}
                      {aiFields.length > 0 && !isOpen && (
                        <CardContent className="pt-0 pb-3">
                          <p className="text-xs text-purple-300/80 line-clamp-2">
                            <span className="font-medium">Petryk:</span>{" "}
                            {aiFields[0][1]}
                          </p>
                        </CardContent>
                      )}

                      {/* Expanded */}
                      {isOpen && (
                        <CardContent
                          className="pt-0 space-y-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isImage && item.url && (
                            <img
                              src={String(item.url)}
                              alt={String(item.filename)}
                              className="max-h-80 rounded-lg border mx-auto"
                            />
                          )}
                          {!isImage && item.url && (
                            <a
                              href={String(item.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-400 hover:underline"
                            >
                              Download {String(item.filename)}
                            </a>
                          )}

                          {aiFields.length > 0 && (
                            <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4 space-y-2">
                              <p className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                                Petryk&apos;s Understanding
                              </p>
                              {aiFields.map(([key, val]) => (
                                <div key={key}>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {key.replace(/_/g, " ")}
                                  </p>
                                  <p className="text-sm mt-0.5">{val}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* ── Chat with Petryk ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Chat with Petryk</h2>
        <Card className="overflow-hidden">
          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-pink-500/20 to-orange-400/20 border border-pink-500/20"
                      : "bg-muted"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.15s]" />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.3s]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Petryk about your documents..."
                className="flex-1"
                disabled={thinking}
              />
              <Button
                type="submit"
                disabled={!input.trim() || thinking}
                className="bg-gradient-to-r from-pink-500 to-orange-400 text-white hover:opacity-90"
              >
                Send
              </Button>
            </form>
          </div>
        </Card>
      </section>
    </div>
  );
}
