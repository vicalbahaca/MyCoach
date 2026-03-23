import { AI_MAINTENANCE_MODE, buildAiMaintenancePayload } from "@/lib/ai-maintenance";
import { generateRoutine } from "@/lib/gemini";
import type { GenerateRoutinePayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (AI_MAINTENANCE_MODE) {
      return Response.json(buildAiMaintenancePayload(), { status: 503 });
    }

    const payload = (await request.json()) as GenerateRoutinePayload;
    const { routine, usage } = await generateRoutine(payload);

    return Response.json({ routine, usage });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "No se pudo generar la rutina." },
      { status: 500 }
    );
  }
}
