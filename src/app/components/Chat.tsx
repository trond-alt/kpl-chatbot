"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface ChatProps {
  mode: "fagassistent" | "exam";
}

export function Chat({ mode }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const conversationIdRef = useRef(crypto.randomUUID());
  const prevModeRef = useRef(mode);

  // Reset chat when mode changes
  useEffect(() => {
    if (prevModeRef.current !== mode) {
      setMessages([]);
      conversationIdRef.current = crypto.randomUUID();
      prevModeRef.current = mode;
    }
  }, [mode]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    }
  }, [input]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          mode: mode === "exam" ? "exam" : "chat",
          conversationId: conversationIdRef.current,
        }),
      });

      if (!response.ok) {
        throw new Error(`Feil: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantContent = "";
      let pendingUpdate = false;

      setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

      // Flush buffered text to UI at ~30fps for smooth rendering
      function flushToUI(done = false) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: assistantContent,
            streaming: !done,
          };
          return updated;
        });
        pendingUpdate = false;
      }

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              assistantContent += parsed.text;
              if (!pendingUpdate) {
                pendingUpdate = true;
                requestAnimationFrame(() => flushToUI());
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }

      // Final flush - mark streaming as done so markdown renders
      flushToUI(true);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Beklager, det oppstod en feil. Sjekk at API-nøkkelen er satt i .env.local og prøv igjen.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  const welcomeText =
    mode === "exam"
      ? "Velkommen til eksamenstrening! Velg fag og jeg lager en eksamensoppgave for deg."
      : "Hei! Jeg er din fagassistent i kjemiprosess- og laboratoriefag. Spør meg om reguleringsteknikk, kjemiske beregninger, analysemetoder eller annet pensum.";

  const quickButtons =
    mode === "exam"
      ? [
          "KPL2001 Produksjon og tjenester",
          "KPL2002 Kjemisk teknologi",
          "KPL2003 Analyse og kvalitet",
        ]
      : [
          "Forklar PID-regulering",
          "Hva er støkiometri?",
          "Hvordan utfører man titrering?",
          "Hva viser et P&ID-diagram?",
        ];

  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-block max-w-lg">
              <h2 className="text-2xl font-semibold text-[var(--ba-black)] mb-2 tracking-tight">
                {mode === "exam" ? "Eksamenstrening" : "Fagassistent"}
              </h2>
              <p className="text-[var(--ba-gray)] text-sm leading-relaxed mb-6">
                {welcomeText}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {quickButtons.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      const text =
                        mode === "exam"
                          ? `Gi meg en eksamensoppgave i ${q}`
                          : q;
                      setInput(text);
                      textareaRef.current?.focus();
                    }}
                    className="px-4 py-2 bg-white text-[var(--ba-dark)] rounded-full text-sm border border-[var(--ba-light-gray)] hover:border-[var(--ba-dark)] transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-[#F5F5F5] border border-[#E6E6E6] flex items-center justify-center flex-shrink-0 mt-1 mr-3 overflow-hidden">
                <Image
                  src="/icon.png"
                  alt="BA"
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain"
                />
              </div>
            )}
            <div
              className={`rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "max-w-[75%] bg-[var(--ba-black)] text-white"
                  : "max-w-[85%] bg-white border border-[#E6E6E6]"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="text-[var(--ba-dark)] text-[0.9375rem]">
                  {msg.streaming ? (
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.content || (
                      <span className="flex gap-1 py-2">
                        <span className="w-1.5 h-1.5 bg-[var(--ba-gray)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-[var(--ba-gray)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-[var(--ba-gray)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    )}<span className="inline-block w-0.5 h-4 bg-[var(--ba-dark)] animate-pulse ml-0.5 align-text-bottom" /></div>
                  ) : (
                    <div className="markdown-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-[0.9375rem]">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#E6E6E6] bg-white px-4 py-3">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto"
        >
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "exam"
                  ? "Velg fag eller skriv ditt svar her..."
                  : "Still et spørsmål om kjemiprosess eller lab..."
              }
              rows={1}
              className="flex-1 resize-none rounded-xl border border-[var(--ba-light-gray)] px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[var(--ba-black)]/10 focus:border-[var(--ba-dark)] text-[var(--ba-dark)] text-[0.9375rem] placeholder:text-[#999]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[var(--ba-black)] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[var(--ba-dark)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex-shrink-0 text-sm"
            >
              {isLoading ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-[#BBB] mt-2">
            BETA – Svarene er generert av KI og er ikke kvalitetssikret.
          </p>
        </form>
      </div>
    </>
  );
}
