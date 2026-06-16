import { chunkText } from "./chunk";
import { embedTexts } from "./embeddings";
import { extractPdfText } from "./pdf";
import {
  createSourceWithChunks,
  getOrCreateDefaultNotebook,
} from "./repository";
import type { SourceSummary, SourceType } from "./types";

/** Shared tail of the pipeline: chunk → embed → store. */
async function ingest(
  title: string,
  content: string,
  type: SourceType
): Promise<SourceSummary> {
  const chunks = chunkText(content);
  if (chunks.length === 0) {
    throw new Error("Source produced no chunks.");
  }

  const embeddings = await embedTexts(chunks.map((chunk) => chunk.content));

  const notebookId = getOrCreateDefaultNotebook();
  return createSourceWithChunks({
    notebookId,
    title,
    type,
    content,
    chunks,
    embeddings,
  });
}

/** Ingest pasted text. */
export async function ingestText(params: {
  title: string;
  text: string;
}): Promise<SourceSummary> {
  const content = params.text.replace(/\r\n/g, "\n").trim();
  if (!content) {
    throw new Error("Source text is empty.");
  }
  return ingest(params.title, content, "text");
}

/** Ingest a PDF buffer (parse → pipeline). */
export async function ingestPdf(params: {
  title: string;
  data: Buffer;
}): Promise<SourceSummary> {
  const content = await extractPdfText(params.data);
  if (!content) {
    throw new Error(
      "No extractable text found in PDF (it may be scanned images — OCR is out of scope)."
    );
  }
  return ingest(params.title, content, "pdf");
}
