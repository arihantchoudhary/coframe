"use client";

import { useEffect, useState, useRef } from "react";
import { useUser, RedirectToSignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://yh9fp9463n.us-east-1.awsapprunner.com";

interface DataItem {
  id: string;
  email?: string;
  message?: string;
  files?: { filename: string; url: string }[];
  [key: string]: unknown;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function DashboardPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const [documents, setDocuments] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hey! I'm Petryk. I have access to all the documents in your database. Ask me anything about them!",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch all documents
  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/data`);
        if (res.ok) {
          const data = await res.json();
          const items = Array.isArray(data) ? data : data.items ?? [];
          setDocuments(items);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    })();
  }, [isSignedIn]);

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

  function buildContext(): string {
    if (documents.length === 0) return "No documents found in the database.";
    const summaries = documents.slice(0, 50).map((doc, i) => {
      const parts: string[] = [`Document ${i + 1} (ID: ${doc.id})`];
      if (doc.email) parts.push(`From: ${doc.email}`);
      if (doc.message) parts.push(`Message: ${doc.message}`);
      // Include custom fields
      for (const [key, value] of Object.entries(doc)) {
        if (
          !["id", "email", "message", "files", "created_at", "updated_at"].includes(key) &&
          value &&
          typeof value === "string"
        ) {
          parts.push(`${key}: ${value}`);
        }
      }
      if (doc.files && doc.files.length > 0) {
        parts.push(`Files: ${doc.files.map((f) => f.filename).join(", ")}`);
      }
      return parts.join("\n  ");
    });
    return summaries.join("\n\n");
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || thinking) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setThinking(true);

    try {
      const context = buildContext();
      const systemPrompt = `You are Petryk, a helpful AI assistant. The user is ${user?.firstName || "a user"} (${user?.emailAddresses?.[0]?.emailAddress || "unknown email"}). You have access to the following documents stored in the database:\n\n${context}\n\nAnswer questions about these documents helpfully and concisely. If asked about something not in the documents, say so honestly. Keep your responses conversational and friendly.`;

      const chatHistory = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory,
          system: systemPrompt,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.response || data.message || data.content || "Sorry, I couldn't process that.";
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } else {
        // Fallback: answer locally based on document content
        const fallbackReply = generateLocalReply(text);
        setMessages((prev) => [...prev, { role: "assistant", content: fallbackReply }]);
      }
    } catch {
      const fallbackReply = generateLocalReply(text);
      setMessages((prev) => [...prev, { role: "assistant", content: fallbackReply }]);
    } finally {
      setThinking(false);
    }
  }

  function generateLocalReply(query: string): string {
    const q = query.toLowerCase();

    if (q.includes("how many") && (q.includes("document") || q.includes("item") || q.includes("record"))) {
      return `You have ${documents.length} document${documents.length !== 1 ? "s" : ""} in the database.`;
    }

    // Search documents for matching content
    const matches = documents.filter((doc) => {
      const searchable = JSON.stringify(doc).toLowerCase();
      const words = q.split(/\s+/).filter((w) => w.length > 2);
      return words.some((word) => searchable.includes(word));
    });

    if (matches.length > 0) {
      const summaries = matches.slice(0, 5).map((doc) => {
        const parts: string[] = [];
        if (doc.email) parts.push(`From: ${doc.email}`);
        if (doc.message) parts.push(`"${doc.message}"`);
        return parts.join(" — ") || `Document ${doc.id}`;
      });
      return `I found ${matches.length} matching document${matches.length !== 1 ? "s" : ""}:\n\n${summaries.join("\n\n")}`;
    }

    return `I searched through ${documents.length} documents but couldn't find anything matching "${query}". Try asking about specific content, emails, or the number of documents.`;
  }

  return (
    <div className="min-h-[calc(100vh-65px)] flex">
      {/* Sidebar — document list */}
      <aside className="w-80 border-r border-border hidden lg:flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm">Your Documents</h2>
          <p className="text-xs text-muted-foreground mt-1">
            {loading ? "Loading..." : `${documents.length} items in database`}
          </p>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {documents.slice(0, 100).map((doc) => (
              <div
                key={doc.id}
                className="p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-default"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground truncate">
                    {doc.id.slice(0, 8)}...
                  </span>
                  {doc.files && doc.files.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {doc.files.length} file{doc.files.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
                {doc.email && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {doc.email}
                  </p>
                )}
                {doc.message && (
                  <p className="text-sm mt-1 line-clamp-2">{doc.message}</p>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </aside>

      {/* Chat area */}
      <main className="flex-1 flex flex-col">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div>
            <h1 className="font-semibold">Chat with Petryk</h1>
            <p className="text-xs text-muted-foreground">
              Ask questions about your {documents.length} stored documents
            </p>
          </div>
          <Badge variant="outline" className="ml-auto text-emerald-400 border-emerald-400/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
            Online
          </Badge>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`max-w-[80%] ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-pink-500/20 to-orange-400/20 border-pink-500/20"
                      : "bg-muted/50"
                  }`}
                >
                  <CardContent className="p-3">
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </CardContent>
                </Card>
              </div>
            ))}
            {thinking && (
              <div className="flex justify-start">
                <Card className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.15s]" />
                      <span className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="max-w-3xl mx-auto flex gap-2"
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
      </main>
    </div>
  );
}
