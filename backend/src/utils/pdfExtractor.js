import fs from "fs";

export async function extractTextFromPdfUrl(pdfPath) {
  // Dynamic import to avoid loading pdf-parse at startup
  const pdfParse = (await import("pdf-parse")).default;
  const buffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(buffer);
  return data.text;
}