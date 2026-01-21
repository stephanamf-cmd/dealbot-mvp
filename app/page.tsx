"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Enter purchase price, annual NOI, and market type (primary/secondary/tertiary).\nExample: Price 2.5m, NOI 180k, primary"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;

 const next: Msg[] = [...messages, { role: "user" as const, content: input.trim() }];
    setMessages(next);
    setInput("");
    setLoading(true);

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next })
    });

    const data = await res.json();
    setMessages((m) => [...m, { role: "assistant", content: data.text }]);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col">
      <div className="max-w-xl w-full mx-auto p-4 flex-1">
        <h1 className="text-xl font-semibold mb-4">Deal Decision MVP</h1>

        <div className="space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl whitespace-pre-line ${
                m.role === "user"
                  ? "bg-blue-600 ml-10"
                  : "bg-neutral-800 mr-10"
              }`}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="p-3 rounded-2xl bg-neutral-800 mr-10">...</div>
          )}
        </div>
      </div>

      <div className="border-t border-neutral-800 p-4">
        <div className="max-w-xl w-full mx-auto flex gap-2">
          <input
            className="flex-1 rounded-xl bg-neutral-900 border border-neutral-800 p-3 outline-none"
            placeholder='e.g. Price 2.5m, NOI 180k, primary'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button
            className="rounded-xl bg-neutral-100 text-neutral-900 px-4 font-medium disabled:opacity-50"
            onClick={send}
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
