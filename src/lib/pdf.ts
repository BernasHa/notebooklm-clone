import { PDFParse } from "pdf-parse";

// NUL bytes occasionally leak out of PDF text extraction; strip them without
// embedding a control char in source.
const NUL = String.fromCharCode(0);

/** Collapse CRLF, strip NUL bytes, and trim — keeps offsets stable app-wide. */
function normalize(text: string): string {
  return text.replace(/\r\n/g, "\n").split(NUL).join("").trim();
}

/** Extract and normalize text from a PDF buffer (pdf-parse v2 class API). */
export async function extractPdfText(data: Buffer): Promise<string> {
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return normalize(result.text);
  } finally {
    await parser.destroy();
  }
}
