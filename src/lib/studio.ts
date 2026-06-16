import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import type { SourceDetail, StudioKind } from "./types";
import { renderNotebookContext } from "./notebook-context";

interface StudioConfig {
  label: string;
  instruction: string;
}

export const STUDIO_CONFIG: Record<StudioKind, StudioConfig> = {
  summary: {
    label: "Summary",
    instruction:
      "Write a concise summary of the sources: a one-line overview, then 3-5 short paragraphs or tight bullet points capturing the main ideas and how they connect.",
  },
  study_guide: {
    label: "Study Guide",
    instruction:
      "Create a study guide in Markdown with these sections:\n## Key Concepts (bulleted, one line each)\n## Key Terms (each as **Term** — definition)\n## Review Questions (6-8 questions the sources can answer)",
  },
  faq: {
    label: "FAQ",
    instruction:
      "Create an FAQ of 6-10 question/answer pairs that the sources directly answer. Format each pair as a line starting with **Q:** then the question, followed by a line starting with **A:** then a concise answer.",
  },
};

const SYSTEM_BASE = `You generate study material STRICTLY from the provided sources of a single notebook. Use only information present in the sources — never add outside knowledge. If the sources are thin on a point, stay brief rather than inventing. Output clean GitHub-flavored Markdown and nothing else (no preamble like "Here is...").`;

/** Build the messages for a Studio generation over the whole notebook. */
export function buildStudioMessages(
  kind: StudioKind,
  sources: SourceDetail[]
): ChatCompletionMessageParam[] {
  const system = `${SYSTEM_BASE}\n\n${STUDIO_CONFIG[kind].instruction}`;
  const user = `Sources:\n\n${renderNotebookContext(sources)}`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}
