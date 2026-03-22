import type { UploadedAssetKind } from "@/lib/types";

export const BLOB_UPLOAD_RULES = {
  context: {
    folder: "intake/context",
    maxBytes: 10 * 1024 * 1024,
    extensions: [".pdf", ".xls", ".xlsx", ".csv", ".txt", ".doc"],
    contentTypes: [
      "application/pdf",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
      "text/plain",
      "application/msword",
      "application/octet-stream",
    ],
  },
  visual: {
    folder: "intake/visual",
    maxBytes: 15 * 1024 * 1024,
    extensions: [".jpg", ".jpeg", ".png", ".heic", ".mp4", ".mov", ".avi"],
    contentTypes: [
      "image/jpeg",
      "image/png",
      "image/heic",
      "image/heif",
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "application/octet-stream",
    ],
  },
} as const;

function fileExtension(fileName: string) {
  const normalized = fileName.trim().toLowerCase();
  const dotIndex = normalized.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return normalized.slice(dotIndex);
}

export function isAllowedExtension(kind: UploadedAssetKind, fileName: string) {
  const extension = fileExtension(fileName);
  const allowedExtensions = BLOB_UPLOAD_RULES[kind].extensions as readonly string[];
  return allowedExtensions.includes(extension);
}

export function sanitizeForPath(rawFileName: string) {
  const trimmed = rawFileName.trim().toLowerCase();
  const extension = fileExtension(trimmed);
  const baseName = extension ? trimmed.slice(0, -extension.length) : trimmed;
  const normalizedBase = baseName
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const safeBase = normalizedBase || "archivo";

  return `${safeBase}${extension}`;
}

export function createBlobPathname(kind: UploadedAssetKind, fileName: string) {
  const safeName = sanitizeForPath(fileName);
  const uniqueId =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
  return `${BLOB_UPLOAD_RULES[kind].folder}/${Date.now()}-${uniqueId}-${safeName}`;
}

export function isAllowedBlobPathname(kind: UploadedAssetKind, pathname: string) {
  const normalizedPathname = pathname.trim().toLowerCase();
  if (!normalizedPathname.startsWith(`${BLOB_UPLOAD_RULES[kind].folder}/`)) return false;
  return isAllowedExtension(kind, normalizedPathname);
}
