import { supabase } from "./supabase";

export interface KnowledgeFile {
  id: string;
  category: string;
  title: string;
  keywords: string[];
  content: string;
  sort_order: number;
  updated_at: string;
}

// Cache for knowledge files - refreshed every 5 minutes
let cache: KnowledgeFile[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function getAllKnowledgeFiles(): Promise<KnowledgeFile[]> {
  const now = Date.now();
  if (cache && now - cacheTime < CACHE_TTL) {
    return cache;
  }

  const { data, error } = await supabase
    .from("knowledge_files")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch knowledge files:", error);
    return cache || [];
  }

  cache = data as KnowledgeFile[];
  cacheTime = now;
  return cache;
}

/**
 * Match relevant knowledge files based on user message.
 * Returns base prompt + up to 3 most relevant topic files.
 */
export async function buildSystemPrompt(
  userMessage: string,
  mode: "fagassistent" | "exam"
): Promise<string> {
  const files = await getAllKnowledgeFiles();

  if (files.length === 0) {
    // Fallback - should not happen
    return "Du er en faglig assistent for kjemiprosess- og laboratoriefag vg2.";
  }

  // Always include base prompt
  const baseId = mode === "exam" ? "base-exam" : "base";
  const baseFile = files.find((f) => f.id === baseId);
  const baseFagFile = files.find((f) => f.id === "base");

  // For exam mode, include both base instructions and exam instructions
  let baseContent = "";
  if (mode === "exam") {
    baseContent = (baseFile?.content || "") + "\n\n" + (baseFagFile?.content || "");
  } else {
    baseContent = baseFagFile?.content || "";
  }

  // Get non-base files
  const topicFiles = files.filter((f) => f.category !== "base");

  // Score each file based on keyword matches
  const messageLower = userMessage.toLowerCase();
  // Also check recent context - split into words for matching
  const messageWords = messageLower.split(/\s+/);

  const scored = topicFiles.map((file) => {
    let score = 0;

    for (const keyword of file.keywords) {
      const kw = keyword.toLowerCase();
      // Exact match in message
      if (messageLower.includes(kw)) {
        // Longer keywords are more specific = higher score
        score += kw.length > 5 ? 3 : 2;
      }
      // Word-level match for short keywords
      if (kw.length <= 4 && messageWords.includes(kw)) {
        score += 2;
      }
    }

    // Bonus for category-level matches
    if (
      (file.category === "kpl2001" &&
        (messageLower.includes("kpl2001") ||
          messageLower.includes("regulering") ||
          messageLower.includes("styring") ||
          messageLower.includes("måling") ||
          messageLower.includes("vedlikehold") ||
          messageLower.includes("p&id") ||
          messageLower.includes("pid") ||
          messageLower.includes("scada"))) ||
      (file.category === "kpl2002" &&
        (messageLower.includes("kpl2002") ||
          messageLower.includes("kjemi") ||
          messageLower.includes("reaksjon") ||
          messageLower.includes("beregn") ||
          messageLower.includes("mol") ||
          messageLower.includes("destillasjon") ||
          messageLower.includes("energi"))) ||
      (file.category === "kpl2003" &&
        (messageLower.includes("kpl2003") ||
          messageLower.includes("analyse") ||
          messageLower.includes("titrering") ||
          messageLower.includes("laboratori") ||
          messageLower.includes("mikroskop") ||
          messageLower.includes("spektro") ||
          messageLower.includes("ph"))) ||
      (file.category === "hms" &&
        (messageLower.includes("hms") ||
          messageLower.includes("sikkerhet") ||
          messageLower.includes("risiko") ||
          messageLower.includes("verneutstyr") ||
          messageLower.includes("avfall")))
    ) {
      score += 1;
    }

    return { file, score };
  });

  // Sort by score descending, take top matches
  scored.sort((a, b) => b.score - a.score);

  // Take files with score > 0, max 3
  const relevant = scored.filter((s) => s.score > 0).slice(0, 3);

  // If no matches found, include nothing extra (base prompt handles general questions)
  // But if user asks a very general question, include a broad overview
  if (relevant.length === 0 && messageLower.length > 10) {
    // Check if it's a general question about one of the subjects
    if (messageLower.includes("kpl2001") || messageLower.includes("produksjon")) {
      const kpl1Files = topicFiles
        .filter((f) => f.category === "kpl2001")
        .slice(0, 2);
      relevant.push(
        ...kpl1Files.map((f) => ({ file: f, score: 1 }))
      );
    } else if (
      messageLower.includes("kpl2002") ||
      messageLower.includes("kjemisk teknologi")
    ) {
      const kpl2Files = topicFiles
        .filter((f) => f.category === "kpl2002")
        .slice(0, 2);
      relevant.push(
        ...kpl2Files.map((f) => ({ file: f, score: 1 }))
      );
    } else if (
      messageLower.includes("kpl2003") ||
      messageLower.includes("analyse")
    ) {
      const kpl3Files = topicFiles
        .filter((f) => f.category === "kpl2003")
        .slice(0, 2);
      relevant.push(
        ...kpl3Files.map((f) => ({ file: f, score: 1 }))
      );
    }
  }

  // Build final prompt
  let prompt = baseContent;

  if (relevant.length > 0) {
    prompt += "\n\n## Relevant fagkunnskap\n\n";
    prompt += relevant.map((r) => r.file.content).join("\n\n");
  }

  return prompt;
}

// Invalidate cache (called when admin updates knowledge)
export function invalidateKnowledgeCache() {
  cache = null;
  cacheTime = 0;
}
