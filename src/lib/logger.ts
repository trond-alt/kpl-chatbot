import { supabase } from "./supabase";

export interface ConversationLog {
  id: string;
  timestamp: string;
  mode: "fagassistent" | "exam";
  messages: { role: string; content: string }[];
}

export async function saveConversation(log: ConversationLog) {
  const { error } = await supabase.from("conversations").insert({
    conversation_id: log.id,
    timestamp: log.timestamp,
    mode: log.mode,
    messages: log.messages,
  });

  if (error) {
    console.error("Failed to save conversation to Supabase:", error);
  }
}

export async function getConversations(
  date?: string
): Promise<ConversationLog[]> {
  let query = supabase
    .from("conversations")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(100);

  if (date) {
    query = query
      .gte("timestamp", `${date}T00:00:00`)
      .lt("timestamp", `${date}T23:59:59`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch conversations:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.conversation_id,
    timestamp: row.timestamp,
    mode: row.mode,
    messages: row.messages,
  }));
}
