import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import type { ChatMessage } from "./types";
import type { RetrievedChunk } from "./retrieval";

const SYSTEM_INSTRUCTIONS = `You are a research assistant inside a notebook app. You answer ONLY from the source excerpts below. Each excerpt is labelled with its source id, e.g. "[Source 3: Title]".

Return a JSON object with two fields:
- "answer": your answer. Mark each supported statement with an inline citation like [1], [2]. These markers are sequential citation numbers (NOT source ids); place each marker right after the statement it supports.
- "citations": one entry per marker you used, each { "marker": <the number used in answer>, "sourceId": <id of the source the fact comes from>, "quote": <a short, VERBATIM span of 1-2 sentences copied EXACTLY from that source's excerpt that literally states the fact> }.

Rules:
- Use ONLY information found in the excerpts. Never use outside or prior knowledge.
- The "quote" must be copied character-for-character from the excerpt text (you may end it at a sentence boundary). It must literally contain the fact you are citing. Never paraphrase or shorten words inside the quote.
- Set "sourceId" to the id of the excerpt the quote was actually copied from.
- If the excerpts do not answer the question, set "answer" to a brief statement that the sources don't cover it, and "citations" to [].
- Be concise and neutral. Do not mention "excerpts" or "chunks" — speak in terms of the sources.`;

/** Render the labelled excerpts block the model must ground its answer in. */
function renderSources(chunks: RetrievedChunk[]): string {
  return chunks
    .map(
      (chunk) =>
        `[Source ${chunk.sourceId}: ${chunk.sourceTitle}]\n${chunk.content.trim()}`
    )
    .join("\n\n");
}

/**
 * Assemble the OpenAI message list: a system message with the grounding rules +
 * labelled source excerpts, followed by the prior conversation turns.
 */
export function buildChatMessages(
  chunks: RetrievedChunk[],
  history: ChatMessage[]
): ChatCompletionMessageParam[] {
  const system = `${SYSTEM_INSTRUCTIONS}\n\nSources:\n${renderSources(chunks)}`;
  return [
    { role: "system", content: system },
    ...history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  ];
}

/** Strict JSON schema forcing the answer + quote-bearing citations shape. */
export const ANSWER_RESPONSE_FORMAT: ChatCompletionCreateParams["response_format"] =
  {
    type: "json_schema",
    json_schema: {
      name: "grounded_answer",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          answer: { type: "string" },
          citations: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                marker: { type: "integer" },
                sourceId: { type: "integer" },
                quote: { type: "string" },
              },
              required: ["marker", "sourceId", "quote"],
            },
          },
        },
        required: ["answer", "citations"],
      },
    },
  };
