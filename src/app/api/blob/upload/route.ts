import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import {
  BLOB_UPLOAD_RULES,
  isAllowedBlobPathname,
  isAllowedExtension,
} from "@/lib/blob-upload";
import type { UploadedAssetKind } from "@/lib/types";

export const runtime = "nodejs";

type UploadClientPayload = {
  kind: UploadedAssetKind;
  originalName: string;
};

function parseClientPayload(clientPayload: string | null): UploadClientPayload | null {
  if (!clientPayload) return null;

  try {
    const parsed = JSON.parse(clientPayload) as Partial<UploadClientPayload>;
    if (!parsed.kind || !parsed.originalName) return null;
    if (parsed.kind !== "context" && parsed.kind !== "visual") return null;
    return {
      kind: parsed.kind,
      originalName: parsed.originalName,
    };
  } catch {
    return null;
  }
}

function withError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const traceId = request.headers.get("x-trace-id") || `blob-${Date.now()}`;
  let body: HandleUploadBody;

  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return withError(400, "Body inválido para la subida de archivos.");
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload, multipart) => {
        const parsedPayload = parseClientPayload(clientPayload);
        if (!parsedPayload) {
          throw new Error("Client payload inválido.");
        }

        const { kind, originalName } = parsedPayload;
        if (!isAllowedExtension(kind, originalName)) {
          throw new Error(`Formato no permitido para ${kind}.`);
        }

        if (!isAllowedBlobPathname(kind, pathname)) {
          throw new Error(`Pathname no permitido para ${kind}.`);
        }

        console.info("[blob/upload] token-request", {
          traceId,
          kind,
          originalName,
          pathname,
          multipart,
        });

        return {
          allowedContentTypes: [...BLOB_UPLOAD_RULES[kind].contentTypes],
          maximumSizeInBytes: BLOB_UPLOAD_RULES[kind].maxBytes,
          validUntil: Date.now() + 60 * 60 * 1000,
          addRandomSuffix: false,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({ kind, originalName }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const parsedPayload = parseClientPayload(tokenPayload ?? null);
        console.info("[blob/upload] completed", {
          traceId,
          pathname: blob.pathname,
          contentType: blob.contentType,
          kind: parsedPayload?.kind ?? "unknown",
          originalName: parsedPayload?.originalName ?? "unknown",
        });
      },
    });

    return Response.json(jsonResponse);
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    console.error("[blob/upload] failed", {
      traceId,
      details,
      hasBlobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      eventType: body?.type ?? "unknown",
    });
    return withError(400, `No se pudo preparar la subida del archivo. ${details}`);
  }
}
