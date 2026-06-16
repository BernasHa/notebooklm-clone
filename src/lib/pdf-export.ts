/**
 * Export Studio Markdown as a clean LIGHT pdf (black text on white), built from
 * the content itself — not a screenshot of the dark UI. Produces selectable,
 * printable text. jsPDF is dynamic-imported so it stays out of the server and
 * the initial bundle.
 */
export async function exportStudioPdf(
  title: string,
  markdown: string
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const margin = 56;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setTextColor(0, 0, 0);

  const ensureSpace = (lineHeight: number) => {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const writeBlock = (
    text: string,
    fontSize: number,
    style: "normal" | "bold",
    indent = 0,
    spacingAfter = 5,
    bullet?: string
  ) => {
    doc.setFont("helvetica", style);
    doc.setFontSize(fontSize);
    const lineHeight = fontSize * 1.4;
    const lines = doc.splitTextToSize(text, contentWidth - indent) as string[];
    lines.forEach((line, i) => {
      ensureSpace(lineHeight);
      if (bullet && i === 0) doc.text(bullet, margin + indent - 14, y);
      doc.text(line, margin + indent, y);
      y += lineHeight;
    });
    y += spacingAfter;
  };

  // Strip inline Markdown emphasis / code / leading heading marks.
  const strip = (s: string) =>
    s
      .replace(/^#{1,6}\s*/, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`([^`]*)`/g, "$1")
      .trim();

  // Title + rule.
  writeBlock(title, 20, "bold", 0, 8);
  ensureSpace(12);
  doc.setDrawColor(210);
  doc.line(margin, y, pageWidth - margin, y);
  y += 18;

  for (const raw of markdown.split("\n")) {
    const line = raw.replace(/\r$/, "");
    if (!line.trim()) {
      y += 6;
      continue;
    }
    if (/^#\s/.test(line)) writeBlock(strip(line), 16, "bold", 0, 6);
    else if (/^##\s/.test(line)) writeBlock(strip(line), 13.5, "bold", 0, 5);
    else if (/^###\s/.test(line)) writeBlock(strip(line), 12, "bold", 0, 4);
    else if (/^\s*[-*]\s/.test(line))
      writeBlock(strip(line.replace(/^\s*[-*]\s/, "")), 11, "normal", 16, 3, "•");
    else writeBlock(strip(line), 11, "normal", 0, 5);
  }

  doc.save(`${title}.pdf`);
}
