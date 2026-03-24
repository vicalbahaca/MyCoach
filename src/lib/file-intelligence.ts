import mammoth from "mammoth";
import { extname } from "node:path";
import * as XLSX from "xlsx";

import type { AttachmentDigest, ProcessedAttachment } from "@/lib/types";

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

const INLINE_LIMIT_BYTES = 10 * 1024 * 1024;
const TEXT_LIMIT = 12000;

function clip(text: string, max = TEXT_LIMIT) {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

function isTextLike(extension: string, mimeType: string) {
  return (
    mimeType.startsWith("text/") ||
    [".txt", ".md", ".csv", ".json", ".yaml", ".yml"].includes(extension)
  );
}

function isExcel(extension: string) {
  return [".xlsx", ".xls", ".csv"].includes(extension);
}

function isDocx(extension: string) {
  return extension === ".docx";
}

function canInline(mimeType: string, size: number) {
  return (
    size <= INLINE_LIMIT_BYTES &&
    (mimeType.startsWith("image/") ||
      mimeType.startsWith("video/") ||
      mimeType === "application/pdf")
  );
}

async function extractExcelText(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const slices = workbook.SheetNames.slice(0, 3).map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const asCsv = XLSX.utils.sheet_to_csv(sheet);
    return `# ${sheetName}\n${clip(asCsv, 5000)}`;
  });
  return clip(slices.join("\n\n"), TEXT_LIMIT);
}

async function processFile(
  file: File,
  kind: "context" | "visual",
  allowInline: boolean
): Promise<ProcessedAttachment> {
  const extension = extname(file.name).toLowerCase();
  const mimeType = file.type || "application/octet-stream";
  const buffer = Buffer.from(await file.arrayBuffer());

  if (kind === "context") {
    if (isTextLike(extension, mimeType)) {
      return {
        name: file.name,
        kind,
        mimeType,
        size: file.size,
        extractedText: clip(buffer.toString("utf8")),
      };
    }

    if (isExcel(extension)) {
      return {
        name: file.name,
        kind,
        mimeType,
        size: file.size,
        extractedText: await extractExcelText(buffer),
      };
    }

    if (isDocx(extension)) {
      const result = await mammoth.extractRawText({ buffer });
      return {
        name: file.name,
        kind,
        mimeType,
        size: file.size,
        extractedText: clip(result.value),
      };
    }
  }

  if (allowInline && canInline(mimeType, file.size)) {
    return {
      name: file.name,
      kind,
      mimeType,
      size: file.size,
      inlineData: {
        mimeType,
        data: buffer.toString("base64"),
      },
    };
  }

  return {
    name: file.name,
    kind,
    mimeType,
    size: file.size,
    note:
      kind === "visual"
        ? "Archivo visual recibido pero no se pudo inyectar directamente al modelo. Se usa como referencia declarativa."
        : "Archivo de contexto recibido sin extracción local compatible. Se usa como referencia declarativa.",
  };
}

export async function processAttachments(
  contextFiles: File[],
  visualFiles: File[],
  allowInline: boolean
): Promise<AttachmentDigest> {
  return {
    contextFiles: await Promise.all(
      contextFiles.map((file) => processFile(file, "context", allowInline))
    ),
    visualFiles: await Promise.all(
      visualFiles.map((file) => processFile(file, "visual", allowInline))
    ),
  };
}

export function attachmentsDigestText(attachments: AttachmentDigest) {
  const blocks: string[] = [];

  if (attachments.contextFiles.length) {
    blocks.push("Archivos de contexto:");
    attachments.contextFiles.forEach((file) => {
      blocks.push(`- ${file.name} (${file.mimeType}, ${file.size} bytes)`);
      if (file.extractedText) {
        blocks.push(`  Extracto: ${file.extractedText}`);
      }
      if (file.note) {
        blocks.push(`  Nota: ${file.note}`);
      }
    });
  }

  if (attachments.visualFiles.length) {
    blocks.push("Archivos visuales:");
    attachments.visualFiles.forEach((file) => {
      blocks.push(`- ${file.name} (${file.mimeType}, ${file.size} bytes)`);
      if (file.note) {
        blocks.push(`  Nota: ${file.note}`);
      }
    });
  }

  return blocks.join("\n");
}

export function attachmentsToGeminiParts(attachments: AttachmentDigest): GeminiPart[] {
  const parts: GeminiPart[] = [];

  attachments.contextFiles.forEach((file) => {
    if (file.extractedText) {
      parts.push({
        text: `Archivo de contexto "${file.name}" (${file.mimeType}). Contenido extraído:\n${file.extractedText}`,
      });
      return;
    }

    if (file.inlineData) {
      parts.push({
        text: `Analiza el archivo de contexto "${file.name}" y úsalo para entender la rutina actual.`,
      });
      parts.push({ inlineData: file.inlineData });
      return;
    }

    parts.push({
      text: `Archivo de contexto recibido: ${file.name}. ${file.note ?? "Sin extracción automática."}`,
    });
  });

  attachments.visualFiles.forEach((file) => {
    if (file.inlineData) {
      parts.push({
        text: `Analiza este recurso visual del atleta (${file.name}) y extrae solo señales claras y accionables para personalizar el siguiente formulario.`,
      });
      parts.push({ inlineData: file.inlineData });
      return;
    }

    parts.push({
      text: `Se ha recibido un recurso visual llamado ${file.name}. ${file.note ?? "No se ha podido adjuntar directamente al modelo."}`,
    });
  });

  return parts;
}
