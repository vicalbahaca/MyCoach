import { reviseRoutine } from "@/lib/gemini";
import type { ReviseRoutinePayload } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ReviseRoutinePayload;
    const routine = await reviseRoutine(payload);

    return Response.json({ routine });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "No se pudo modificar la rutina." },
      { status: 500 }
    );
  }
}
