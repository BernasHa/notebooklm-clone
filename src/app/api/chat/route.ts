import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CHAT_MODEL, getOpenAI } from "@/lib/openai";
import { retrieveChunks } from "@/lib/retrieval";
import { ANSWER_RESPONSE_FORMAT, buildChatMessages } from "@/lib/prompt";
import { resolveCitations } from "@/lib/citations";
import type { ChatResponse } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      })
    )
    .min(1),
});

// Shape the model must return (mirrors ANSWER_RESPONSE_FORMAT); validated so a
// malformed completion fails loudly instead of corrupting citations.
const modelOutputSchema = z.object({
  answer: z.string(),
  citations: z.array(
    z.object({
      marker: z.number().int(),
      sourceId: z.number().int(),
      quote: z.string(),
    })
  ),
});

const NO_SOURCES_REPLY =
  "I don't have any sources to answer from yet. Add a source on the left, then ask again.";

export async function POST(request: NextRequest) {
  let messages: z.infer<typeof bodySchema>["messages"];
  try {
    messages = bodySchema.parse(await request.json()).messages;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser || !lastUser.content.trim()) {
    return NextResponse.json(
      { ok: false, error: "No question provided." },
      { status: 400 }
    );
  }

  try {
    const chunks = await retrieveChunks(lastUser.content);
    if (chunks.length === 0) {
      const data: ChatResponse = { answer: NO_SOURCES_REPLY, citations: [] };
      return NextResponse.json({ ok: true, data });
    }

    const completion = await getOpenAI().chat.completions.create({
      model: CHAT_MODEL,
      temperature: 0.2,
      response_format: ANSWER_RESPONSE_FORMAT,
      messages: buildChatMessages(chunks, messages),
    });

    const rawContent = completion.choices[0]?.message?.content ?? "";
    let parsed: z.infer<typeof modelOutputSchema>;
    try {
      parsed = modelOutputSchema.parse(JSON.parse(rawContent));
    } catch {
      return NextResponse.json(
        { ok: false, error: "Model returned an unexpected format." },
        { status: 502 }
      );
    }

    const data: ChatResponse = {
      answer: parsed.answer,
      citations: resolveCitations(parsed.citations, chunks),
    };
    return NextResponse.json({ ok: true, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
