"use client";

import { useState } from "react";
import Image from "next/image";
import { Chat } from "./components/Chat";
import { LoginGate } from "./components/LoginGate";

type Mode = "fagassistent" | "exam";

export default function Home() {
  const [mode, setMode] = useState<Mode>("fagassistent");

  return (
    <LoginGate>
      <div className="flex flex-col h-screen bg-[var(--ba-bg)]">
        {/* Header */}
        <header className="bg-white border-b border-[var(--ba-light-gray)] px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Boreakademiet"
                width={180}
                height={50}
                className="h-10 w-auto"
                priority
              />
              <span className="text-xs text-[var(--ba-gray)] border-l border-[var(--ba-light-gray)] pl-3 hidden sm:block">
                Fagassistent for kjemiprosess- og laboratoriefag vg2
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => setMode("fagassistent")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  mode === "fagassistent"
                    ? "bg-[var(--ba-black)] text-white"
                    : "bg-transparent text-[var(--ba-dark)] border border-[var(--ba-light-gray)] hover:border-[var(--ba-dark)]"
                }`}
              >
                Fagassistent
              </button>
              <button
                onClick={() => setMode("exam")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  mode === "exam"
                    ? "bg-[var(--ba-black)] text-white"
                    : "bg-transparent text-[var(--ba-dark)] border border-[var(--ba-light-gray)] hover:border-[var(--ba-dark)]"
                }`}
              >
                Eksamenstrening
              </button>
            </div>
          </div>
        </header>

        {/* Chat */}
        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
          <Chat mode={mode} />
        </div>
      </div>
    </LoginGate>
  );
}
