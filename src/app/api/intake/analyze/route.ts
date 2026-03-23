import { del, get } from "@vercel/blob";

import { AI_MAINTENANCE_MODE, buildAiMaintenancePayload } from "@/lib/ai-maintenance";
import { isAllowedBlobPathname } from "@/lib/blob-upload";
import { processAttachments } from "@/lib/file-intelligence";
import { generateIntakeAnalysis } from "@/lib/gemini";
import type { AnalyzeIntakePayload, AnalyzeIntakeRequest, UploadedAsset } from "@/lib/types";

export const runtime = "nodejs";

const MAX_CONTEXT_FILES = 5;
const MAX_VISUAL_FILES = 10;

function withError(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function parsePayload(data: unknown): AnalyzeIntakePayload | null {
  if (!isObject(data)) return null;
  if (!isObject(data.profile)) return null;
  return data as AnalyzeIntakePayload;
}

function toUploadedAssets(value: unknown, kind: UploadedAsset["kind"]) {
  if (!Array.isArray(value)) return [];

  return value.filter((entry): entry is UploadedAsset => {
    if (!isObject(entry)) return false;
    if (entry.kind !== kind) return false;
    if (typeof entry.name !== "string") return false;
    if (typeof entry.pathname !== "string") return false;
    if (typeof entry.url !== "string") return false;
    if (typeof entry.contentType !== "string") return false;
    if (typeof entry.size !== "number" || Number.isNaN(entry.size)) return false;
    if (!isAllowedBlobPathname(kind, entry.pathname)) return false;
    return true;
  });
}

async function blobAssetToFile(asset: UploadedAsset) {
  const startedAt = Date.now();
  const blobResult = await get(asset.pathname, {
    access: "private",
    useCache: false,
  });

  if (!blobResult || blobResult.statusCode !== 200 || !blobResult.stream) {
    throw new Error(`No se pudo leer el archivo de Blob: ${asset.pathname}`);
  }

  const contentType =
    blobResult.blob.contentType || asset.contentType || "application/octet-stream";
  const arrayBuffer = await new Response(blobResult.stream).arrayBuffer();
  const file = new File([arrayBuffer], asset.name, {
    type: contentType,
    lastModified: Date.now(),
  });

  console.info("[intake/analyze] blob:downloaded", {
    pathname: asset.pathname,
    name: asset.name,
    size: file.size,
    contentType,
    durationMs: Date.now() - startedAt,
  });

  return file;
}

export async function POST(request: Request) {
  const uploadedPathnames: string[] = [];
  const traceId = request.headers.get("x-trace-id") || `intake-${Date.now()}`;
  const startedAt = Date.now();

  try {
    if (AI_MAINTENANCE_MODE) {
      console.info("[intake/analyze] maintenance:on", { traceId });
      return Response.json(buildAiMaintenancePayload(), { status: 503 });
    }

    console.info("[intake/analyze] phase:request-received", { traceId });

    const parseBodyStartedAt = Date.now();
    const body = (await request.json()) as AnalyzeIntakeRequest;
    console.info("[intake/analyze] phase:request-parsed", {
      traceId,
      durationMs: Date.now() - parseBodyStartedAt,
    });

    const payload = parsePayload(body.payload);

    if (!payload) {
      return withError(400, "Falta el payload del onboarding.");
    }

    const contextAssets = toUploadedAssets(body.contextFiles, "context").slice(
      0,
      MAX_CONTEXT_FILES
    );
    const visualAssets = toUploadedAssets(body.visualFiles, "visual").slice(0, MAX_VISUAL_FILES);

    uploadedPathnames.push(
      ...contextAssets.map((asset) => asset.pathname),
      ...visualAssets.map((asset) => asset.pathname)
    );

    console.info("[intake/analyze] phase:assets-validated", {
      traceId,
      contextRefs: contextAssets.length,
      visualRefs: visualAssets.length,
      contextBytes: contextAssets.reduce((sum, file) => sum + file.size, 0),
      visualBytes: visualAssets.reduce((sum, file) => sum + file.size, 0),
    });

    const blobDownloadStartedAt = Date.now();
    const [contextFiles, visualFiles] = await Promise.all([
      Promise.all(contextAssets.map((asset) => blobAssetToFile(asset))),
      Promise.all(visualAssets.map((asset) => blobAssetToFile(asset))),
    ]);

    console.info("[intake/analyze] phase:blob-download-complete", {
      traceId,
      contextFiles: contextFiles.length,
      visualFiles: visualFiles.length,
      durationMs: Date.now() - blobDownloadStartedAt,
    });

    const attachmentsStartedAt = Date.now();
    const attachments = await processAttachments(
      contextFiles,
      visualFiles,
      Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
    );
    console.info("[intake/analyze] phase:attachments-processed", {
      traceId,
      contextProcessed: attachments.contextFiles.length,
      visualProcessed: attachments.visualFiles.length,
      durationMs: Date.now() - attachmentsStartedAt,
    });

    const geminiStartedAt = Date.now();
    console.info("[intake/analyze] phase:gemini-start", { traceId });
    const { analysis, usage } = await generateIntakeAnalysis(payload, attachments);
    console.info("[intake/analyze] phase:gemini-complete", {
      traceId,
      durationMs: Date.now() - geminiStartedAt,
    });

    console.info("[intake/analyze] phase:success", {
      traceId,
      personalizedSections: analysis.personalizedSections.length,
      cautionFlags: analysis.cautionFlags.length,
      usage,
      totalDurationMs: Date.now() - startedAt,
    });

    return Response.json({ analysis, usage });
  } catch (error) {
    console.error("[intake/analyze] phase:failed", {
      traceId,
      totalDurationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return withError(500, "No se pudo preparar el formulario personalizado.");
  } finally {
    if (!uploadedPathnames.length) return;

    const cleanupStartedAt = Date.now();
    try {
      await del(Array.from(new Set(uploadedPathnames)));
      console.info("[intake/analyze] phase:blob-cleanup-ok", {
        traceId,
        deleted: Array.from(new Set(uploadedPathnames)).length,
        durationMs: Date.now() - cleanupStartedAt,
      });
    } catch (cleanupError) {
      console.error("[intake/analyze] phase:blob-cleanup-failed", {
        traceId,
        durationMs: Date.now() - cleanupStartedAt,
        error:
          cleanupError instanceof Error ? cleanupError.message : "Unknown cleanup error",
      });
    }
  }
}
