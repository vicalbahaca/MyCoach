import { generateRoutine } from "@/lib/gemini";
import type { GenerateRoutinePayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as GenerateRoutinePayload;
    const routine = await generateRoutine(payload);

    return Response.json({ routine });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "No se pudo generar la rutina." },
      { status: 500 }
    );
  }
}
