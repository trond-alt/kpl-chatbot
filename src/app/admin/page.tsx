"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: string;
  content: string;
}

interface Conversation {
  id: string;
  timestamp: string;
  mode: string;
  messages: Message[];
}

interface KnowledgeFile {
  id: string;
  category: string;
  title: string;
  keywords: string[];
  content: string;
  sort_order: number;
  updated_at: string;
}

type Tab = "logs" | "knowledge";

const CATEGORY_LABELS: Record<string, string> = {
  base: "Grunnleggende",
  kpl2001: "KPL2001 Produksjon og tjenester",
  kpl2002: "KPL2002 Kjemisk teknologi",
  kpl2003: "KPL2003 Analyse og kvalitet",
  hms: "HMS og sikkerhet",
  formler: "Formler og beregninger",
  ordliste: "Ordliste",
};

const CATEGORY_COLORS: Record<string, string> = {
  base: "bg-gray-100 text-gray-700",
  kpl2001: "bg-blue-100 text-blue-700",
  kpl2002: "bg-green-100 text-green-700",
  kpl2003: "bg-purple-100 text-purple-700",
  hms: "bg-red-100 text-red-700",
  formler: "bg-yellow-100 text-yellow-700",
  ordliste: "bg-orange-100 text-orange-700",
};

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("logs");

  // Logs state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState("");

  // Knowledge state
  const [kFiles, setKFiles] = useState<KnowledgeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<KnowledgeFile | null>(null);
  const [kbLoading, setKbLoading] = useState(false);
  const [kbSaving, setKbSaving] = useState(false);
  const [kbSaved, setKbSaved] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editKeywords, setEditKeywords] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = dateFilter ? `?date=${dateFilter}` : "";
      const res = await fetch(`/api/logs${params}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
        setAuthenticated(true);
      } else {
        alert("Feil admin-passord");
      }
    } catch {
      alert("Kunne ikke hente logger");
    } finally {
      setLoading(false);
    }
  }, [adminKey, dateFilter]);

  async function fetchKnowledge() {
    setKbLoading(true);
    try {
      const res = await fetch("/api/knowledge", {
        headers: { "x-admin-key": adminKey },
      });
      if (res.ok) {
        const data = await res.json();
        setKFiles(data.files);
      }
    } catch {
      console.error("Kunne ikke hente kunnskapsfiler");
    } finally {
      setKbLoading(false);
    }
  }

  async function saveFile() {
    if (!selectedFile) return;
    setKbSaving(true);
    setKbSaved(false);
    try {
      const keywords = editKeywords
        .split(",")
        .map((k) => k.trim())
        .filter((k) => k.length > 0);

      const res = await fetch("/api/knowledge", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          id: selectedFile.id,
          content: editContent,
          keywords,
        }),
      });
      if (res.ok) {
        setKbSaved(true);
        // Update local state
        setKFiles((prev) =>
          prev.map((f) =>
            f.id === selectedFile.id
              ? {
                  ...f,
                  content: editContent,
                  keywords,
                  updated_at: new Date().toISOString(),
                }
              : f
          )
        );
        setSelectedFile((prev) =>
          prev
            ? {
                ...prev,
                content: editContent,
                keywords,
                updated_at: new Date().toISOString(),
              }
            : null
        );
        setTimeout(() => setKbSaved(false), 3000);
      } else {
        alert("Kunne ikke lagre endringer");
      }
    } catch {
      alert("Feil ved lagring");
    } finally {
      setKbSaving(false);
    }
  }

  function selectFile(file: KnowledgeFile) {
    setSelectedFile(file);
    setEditContent(file.content);
    setEditKeywords(file.keywords.join(", "));
  }

  useEffect(() => {
    if (authenticated) fetchLogs();
  }, [dateFilter, authenticated, fetchLogs]);

  useEffect(() => {
    if (authenticated && activeTab === "knowledge") fetchKnowledge();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, activeTab]);

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
          <h1 className="text-xl font-bold text-gray-800 mb-4">
            Admin - Boreakademiet
          </h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchLogs();
            }}
            className="space-y-4"
          >
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin-passord"
              className="w-full px-4 py-2.5 border rounded-lg"
              autoFocus
            />
            <button
              type="submit"
              className="w-full bg-gray-800 text-white py-2.5 rounded-lg font-medium"
            >
              Logg inn
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Tab navigation */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("logs")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "logs"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Samtalelogger
          </button>
          <button
            onClick={() => setActiveTab("knowledge")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "knowledge"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Kunnskapsbase ({kFiles.length} filer)
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "logs" ? (
        <LogsView
          conversations={conversations}
          selectedConv={selectedConv}
          setSelectedConv={setSelectedConv}
          loading={loading}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
        />
      ) : (
        <KnowledgeView
          files={kFiles}
          selectedFile={selectedFile}
          selectFile={selectFile}
          editContent={editContent}
          setEditContent={setEditContent}
          editKeywords={editKeywords}
          setEditKeywords={setEditKeywords}
          kbLoading={kbLoading}
          kbSaving={kbSaving}
          kbSaved={kbSaved}
          onSave={saveFile}
        />
      )}
    </div>
  );
}

// === Logs View ===
function LogsView({
  conversations,
  selectedConv,
  setSelectedConv,
  loading,
  dateFilter,
  setDateFilter,
}: {
  conversations: Conversation[];
  selectedConv: Conversation | null;
  setSelectedConv: (c: Conversation | null) => void;
  loading: boolean;
  dateFilter: string;
  setDateFilter: (d: string) => void;
}) {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <div className="w-96 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-49px)]">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Samtalelogger</h2>
          <p className="text-sm text-gray-500">
            {conversations.length} samtaler
          </p>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="mt-2 w-full px-3 py-1.5 border rounded text-sm"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="p-4 text-gray-500 text-sm">Laster...</p>
          )}
          {conversations.map((conv) => {
            const userMessages = conv.messages.filter(
              (m) => m.role === "user"
            );
            const preview =
              userMessages[0]?.content.substring(0, 80) || "(tom samtale)";
            const time = new Date(conv.timestamp).toLocaleString("nb-NO", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <button
                key={conv.id + conv.timestamp}
                onClick={() => setSelectedConv(conv)}
                className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedConv?.id === conv.id &&
                  selectedConv?.timestamp === conv.timestamp
                    ? "bg-blue-50"
                    : ""
                }`}
              >
                <div className="flex justify-between items-start">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      conv.mode === "exam"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {conv.mode === "exam" ? "Eksamen" : "Fagassistent"}
                  </span>
                  <span className="text-xs text-gray-400">{time}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                  {preview}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {conv.messages.length} meldinger
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation detail */}
      <div className="flex-1 overflow-y-auto h-[calc(100vh-49px)]">
        {selectedConv ? (
          <div className="max-w-3xl mx-auto p-6 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <span
                className={`text-sm px-3 py-1 rounded-full ${
                  selectedConv.mode === "exam"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {selectedConv.mode === "exam"
                  ? "Eksamenstrening"
                  : "Fagassistent"}
              </span>
              <span className="text-sm text-gray-500">
                {new Date(selectedConv.timestamp).toLocaleString("nb-NO")}
              </span>
            </div>
            {selectedConv.messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="markdown-content text-gray-800 text-sm">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Velg en samtale fra listen
          </div>
        )}
      </div>
    </div>
  );
}

// === Knowledge View ===
function KnowledgeView({
  files,
  selectedFile,
  selectFile,
  editContent,
  setEditContent,
  editKeywords,
  setEditKeywords,
  kbLoading,
  kbSaving,
  kbSaved,
  onSave,
}: {
  files: KnowledgeFile[];
  selectedFile: KnowledgeFile | null;
  selectFile: (f: KnowledgeFile) => void;
  editContent: string;
  setEditContent: (s: string) => void;
  editKeywords: string;
  setEditKeywords: (s: string) => void;
  kbLoading: boolean;
  kbSaving: boolean;
  kbSaved: boolean;
  onSave: () => void;
}) {
  // Group files by category
  const grouped = files.reduce(
    (acc, file) => {
      if (!acc[file.category]) acc[file.category] = [];
      acc[file.category].push(file);
      return acc;
    },
    {} as Record<string, KnowledgeFile[]>
  );

  const categoryOrder = ["base", "kpl2001", "kpl2002", "kpl2003", "hms", "formler", "ordliste"];

  if (kbLoading) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        Laster kunnskapsbase...
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* File list sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-49px)]">
        <div className="p-3 border-b border-gray-200">
          <h2 className="text-sm font-bold text-gray-800">Kunnskapsfiler</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {files.length} filer ·{" "}
            {files.reduce((s, f) => s + f.content.length, 0).toLocaleString()}{" "}
            tegn totalt
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {categoryOrder.map((cat) => {
            const catFiles = grouped[cat] || [];
            if (catFiles.length === 0) return null;
            return (
              <div key={cat}>
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      CATEGORY_COLORS[cat] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {CATEGORY_LABELS[cat] || cat}
                  </span>
                </div>
                {catFiles.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => selectFile(file)}
                    className={`w-full text-left px-3 py-2 border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                      selectedFile?.id === file.id ? "bg-blue-50" : ""
                    }`}
                  >
                    <p className="text-sm text-gray-800 font-medium">
                      {file.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {file.content.length.toLocaleString()} tegn ·{" "}
                      {file.keywords.length} nøkkelord
                    </p>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col h-[calc(100vh-49px)]">
        {selectedFile ? (
          <>
            {/* Editor header */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    CATEGORY_COLORS[selectedFile.category] ||
                    "bg-gray-100 text-gray-600"
                  }`}
                >
                  {CATEGORY_LABELS[selectedFile.category] ||
                    selectedFile.category}
                </span>
                <span className="text-sm font-medium text-gray-800">
                  {selectedFile.title}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {selectedFile.id}
                </span>
                <span className="text-xs text-gray-400">
                  {editContent.length.toLocaleString()} tegn
                </span>
              </div>
              <div className="flex items-center gap-3">
                {kbSaved && (
                  <span className="text-sm text-green-600 font-medium">
                    Lagret!
                  </span>
                )}
                <button
                  onClick={onSave}
                  disabled={kbSaving}
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {kbSaving ? "Lagrer..." : "Lagre"}
                </button>
              </div>
            </div>

            {/* Keywords editor */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
              <label className="text-xs text-gray-500 font-medium">
                Nøkkelord (kommaseparert) – brukes for å matche elevens
                spørsmål:
              </label>
              <input
                value={editKeywords}
                onChange={(e) => setEditKeywords(e.target.value)}
                className="w-full mt-1 px-3 py-1.5 text-sm border rounded-lg bg-white font-mono"
                placeholder="nøkkelord1, nøkkelord2, nøkkelord3"
              />
            </div>

            {/* Content editor */}
            <div className="flex-1 p-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{ height: "calc(100vh - 190px)" }}
                className="w-full p-4 font-mono text-sm text-gray-800 resize-none focus:outline-none leading-relaxed bg-white rounded-xl border border-gray-200"
                placeholder="Skriv faginnholdet her..."
                spellCheck={false}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">Velg en fil fra listen</p>
              <p className="text-sm">
                Kunnskapsbasen er delt i moduler. Kun relevante moduler lastes
                inn per spørsmål for å spare tokens.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
