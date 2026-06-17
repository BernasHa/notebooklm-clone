import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  clearNotebook,
  getOrCreateDefaultNotebook,
  listSources,
} from "@/lib/repository";
import { ingestPdf, ingestText } from "@/lib/ingest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

const textSchema = z.object({
  title: z.string().trim().min(1).max(200),
  text: z.string().trim().min(1),
});

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error";
}

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}

/** List sources for the default notebook. */
export async function GET() {
  try {
    const notebookId = getOrCreateDefaultNotebook();
    return NextResponse.json({ ok: true, data: listSources(notebookId) });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: errorMessage(err) },
      { status: 500 }
    );
  }
}

/** Create a source from an uploaded PDF or pasted text, running ingestion. */
export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const type = form.get("type");

    if (type === "pdf") {
      const file = form.get("file");
      if (!(file instanceof File) || file.size === 0) {
        return badRequest("No PDF file provided.");
      }
      if (file.size > MAX_PDF_BYTES) {
        return badRequest("PDF exceeds the 10 MB limit.");
      }
      const providedTitle =
        typeof form.get("title") === "string"
          ? (form.get("title") as string).trim()
          : "";
      const title = providedTitle || file.name || "Untitled PDF";
      const buffer = Buffer.from(await file.arrayBuffer());
      const source = await ingestPdf({ title, data: buffer });
      return NextResponse.json({ ok: true, data: source }, { status: 201 });
    }

    if (type === "text") {
      const parsed = textSchema.safeParse({
        title: form.get("title"),
        text: form.get("text"),
      });
      if (!parsed.success) {
        return badRequest("Both a title and non-empty text are required.");
      }
      const source = await ingestText(parsed.data);
      return NextResponse.json({ ok: true, data: source }, { status: 201 });
    }

    return badRequest("Unknown source type (expected 'pdf' or 'text').");
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: errorMessage(err) },
      { status: 500 }
    );
  }
}

/** Clear the whole default notebook (sources + chunks + vectors). */
export async function DELETE() {
  try {
    const notebookId = getOrCreateDefaultNotebook();
    clearNotebook(notebookId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: errorMessage(err) },
      { status: 500 }
    );
  }
}
