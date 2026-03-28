import { supabase } from "@/lib/supabase";
import { invalidateKnowledgeCache } from "@/lib/knowledge";

export const dynamic = "force-dynamic";

const ADMIN_KEY = process.env.ADMIN_KEY || "boreakademiet2026";

function checkAuth(req: Request): boolean {
  const key = req.headers.get("x-admin-key");
  return key === ADMIN_KEY;
}

// GET: List all knowledge files
export async function GET(req: Request) {
  if (!checkAuth(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("knowledge_files")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ files: data });
}

// PUT: Update a single knowledge file
export async function PUT(req: Request) {
  if (!checkAuth(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, content, title, keywords } = body;

  if (!id) {
    return Response.json({ error: "Missing file id" }, { status: 400 });
  }

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (content !== undefined) updateData.content = content;
  if (title !== undefined) updateData.title = title;
  if (keywords !== undefined) updateData.keywords = keywords;

  const { error } = await supabase
    .from("knowledge_files")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Invalidate cache so next chat request gets fresh data
  invalidateKnowledgeCache();

  return Response.json({ success: true });
}

// POST: Create a new knowledge file
export async function POST(req: Request) {
  if (!checkAuth(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, category, title, keywords, content, sort_order } = body;

  if (!id || !category || !title || !content) {
    return Response.json(
      { error: "Missing required fields: id, category, title, content" },
      { status: 400 }
    );
  }

  const { error } = await supabase.from("knowledge_files").insert({
    id,
    category,
    title,
    keywords: keywords || [],
    content,
    sort_order: sort_order || 99,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  invalidateKnowledgeCache();
  return Response.json({ success: true });
}

// DELETE: Remove a knowledge file
export async function DELETE(req: Request) {
  if (!checkAuth(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing file id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("knowledge_files")
    .delete()
    .eq("id", id);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  invalidateKnowledgeCache();
  return Response.json({ success: true });
}
