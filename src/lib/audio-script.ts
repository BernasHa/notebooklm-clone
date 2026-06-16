import type {
  ChatCompletionCreateParams,
  ChatCompletionMessageParam,
} from "openai/resources/chat/completions";
import { z } from "zod";
import type { DialogueLine, SourceDetail } from "./types";
import { renderNotebookContext } from "./notebook-context";
import { CHAT_MODEL, getOpenAI } from "./openai";

// Hard cap on dialogue turns — bounds TTS cost + latency in Phase B.
export const MAX_TURNS = 20;

const scriptOutputSchema = z.object({
  script: z
    .array(
      z.object({
        speaker: z.enum(["A", "B"]),
        text: z.string().trim().min(1),
      })
    )
    .min(1),
});

const SYSTEM = `You are the producer of a short two-host podcast ("Audio Overview") about the notebook's sources. Write a natural, engaging conversation between Host A and Host B.

Rules:
- Ground EVERYTHING strictly in the provided sources. Never introduce outside facts.
- Make it sound like real people talking: a brief greeting, then they riff off each other, ask and answer, react. Vary the turn lengths.
- Keep each turn to 1-3 sentences. Aim for about 14-18 turns total (~2-3 minutes spoken). Never exceed 20 turns.
- Open with a short hook and close with a brief wrap-up.
- Write in the language of the sources.
- Output JSON: { "script": [ { "speaker": "A" | "B", "text": "..." } ] }. Put no speaker names or stage directions inside "text".`;

/** Build the messages for generating the two-host script over the notebook. */
export function buildAudioScriptMessages(
  sources: SourceDetail[]
): ChatCompletionMessageParam[] {
  return [
    { role: "system", content: SYSTEM },
    { role: "user", content: `Sources:\n\n${renderNotebookContext(sources)}` },
  ];
}

/**
 * Generate and validate the two-host script from notebook sources, capped at
 * MAX_TURNS. Throws on an empty/malformed model response. Shared by the
 * script-only route and the full Audio Overview route.
 */
export async function generateScript(
  sources: SourceDetail[]
): Promise<DialogueLine[]> {
  const completion = await getOpenAI().chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.6,
    response_format: AUDIO_SCRIPT_RESPONSE_FORMAT,
    messages: buildAudioScriptMessages(sources),
  });

  const rawContent = completion.choices[0]?.message?.content ?? "";
  const parsed = scriptOutputSchema.parse(JSON.parse(rawContent));
  return parsed.script.slice(0, MAX_TURNS);
}

/** Strict JSON schema forcing the two-speaker dialogue shape. */
export const AUDIO_SCRIPT_RESPONSE_FORMAT: ChatCompletionCreateParams["response_format"] =
  {
    type: "json_schema",
    json_schema: {
      name: "podcast_script",
      strict: true,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: {
          script: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                speaker: { type: "string", enum: ["A", "B"] },
                text: { type: "string" },
              },
              required: ["speaker", "text"],
            },
          },
        },
        required: ["script"],
      },
    },
  };
