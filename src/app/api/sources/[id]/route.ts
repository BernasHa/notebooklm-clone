import { NextRequest, NextResponse } from "next/server";
import { getSourceDetail } from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Return a single source including its full content (for the viewer). */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return NextResponse.json(
        { ok: false, error: "Invalid source id." },
        { status: 400 }
      );
    }

    const source = getSourceDetail(numericId);
    if (!source) {
      return NextResponse.json(
        { ok: false, error: "Source not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true, data: source });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
