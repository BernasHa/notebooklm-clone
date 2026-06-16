import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CHAT_MODEL, getOpenAI } from "@/lib/openai";
import {
  getNotebookSourceContents,
  getOrCreateDefaultNotebook,
} from "@/lib/repository";
import { buildStudioMessages } from "@/lib/studio";
import type { StudioResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  kind: z.enum(["summary", "study_guide", "faq"]),
});

/** Generate a Studio artifact (Summary / Study Guide / FAQ) over the notebook. */
export async function POST(request: NextRequest) {
  let kind: z.infer<typeof bodySchema>["kind"];
  try {
    kind = bodySchema.parse(await request.json()).kind;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  try {
    const notebookId = getOrCreateDefaultNotebook();
    const sources = getNotebookSourceContents(notebookId);
    if (sources.length === 0) {
      return NextResponse.json(
        { ok: false, error: "Add a source first — Studio needs something to work from." },
        { status: 400 }
      );
    }

    const completion = await getOpenAI().chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.3,
      messages: buildStudioMessages(kind, sources),
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!content) {
      return NextResponse.json(
        { ok: false, error: "The model returned an empty result." },
        { status: 502 }
      );
    }

    const data: StudioResponse = { kind, content };
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Studio generation failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
