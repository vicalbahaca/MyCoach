import { processAttachments } from "@/lib/file-intelligence";
import { generateIntakeAnalysis } from "@/lib/gemini";
import type { AnalyzeIntakePayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const payloadRaw = formData.get("payload");

    if (typeof payloadRaw !== "string") {
      return Response.json(
        { error: "Falta el payload del onboarding." },
        { status: 400 }
      );
    }

    const payload = JSON.parse(payloadRaw) as AnalyzeIntakePayload;
    const contextFiles = formData
      .getAll("contextFiles")
      .filter((value): value is File => value instanceof File)
      .slice(0, 5);
    const visualFiles = formData
      .getAll("visualFiles")
      .filter((value): value is File => value instanceof File)
      .slice(0, 10);

    const attachments = await processAttachments(
      contextFiles,
      visualFiles,
      Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY)
    );

    const analysis = await generateIntakeAnalysis(payload, attachments);

    return Response.json({ analysis });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "No se pudo preparar el formulario personalizado." },
      { status: 500 }
    );
  }
}
