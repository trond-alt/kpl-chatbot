import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { code } = await req.json();
  const validCode = process.env.ACCESS_CODE || "BRT2026";

  if (code === validCode) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Ugyldig kode" }, { status: 401 });
}
