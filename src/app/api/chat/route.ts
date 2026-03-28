import { readFileSync } from "fs";
import { resolve } from "path";
import { after } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { saveConversation } from "@/lib/logger";
import { buildSystemPrompt } from "@/lib/knowledge";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function loadApiKey(): string {
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }
  try {
    const envPath = resolve(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^ANTHROPIC_API_KEY=(.+)$/);
      if (match) return match[1].trim();
    }
  } catch {
    // ignore
  }
  return "";
}

const anthropic = new Anthropic({ apiKey: loadApiKey() });

export async function POST(req: Request) {
  const { messages, mode, conversationId } = await req.json();

  // Get the last user message for topic matching
  const lastUserMessage =
    messages.filter((m: { role: string }) => m.role === "user").pop()?.content || "";

  // Build system prompt with only relevant knowledge modules
  const systemPrompt = await buildSystemPrompt(
    lastUserMessage,
    mode === "exam" ? "exam" : "fagassistent"
  );

  // Only send last 20 messages to API to avoid token limits
  const recentMessages = messages.slice(-20);

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: recentMessages.map(
      (m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })
    ),
  });

  let fullResponse = "";
  const logId = conversationId || crypto.randomUUID();
  const logMode = mode === "exam" ? "exam" : "fagassistent";

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of stream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          fullResponse += event.delta.text;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
            )
          );
        }
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  // Log after response is sent - guaranteed to complete on Vercel
  after(async () => {
    try {
      await saveConversation({
        id: logId,
        timestamp: new Date().toISOString(),
        mode: logMode as "fagassistent" | "exam",
        messages: [
          ...messages,
          { role: "assistant", content: fullResponse },
        ],
      });
    } catch (e) {
      console.error("Failed to log conversation:", e);
    }
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
