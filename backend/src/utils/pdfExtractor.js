import pdfParse from "pdf-parse";
import fs from "fs";

export async function extractTextFromPdfUrl(pdfPath) {
  const buffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(buffer);
  return data.text;
}