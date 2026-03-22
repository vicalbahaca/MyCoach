import { reviseRoutine } from "@/lib/gemini";
import type { ReviseRoutinePayload } from "@/lib/types";

export const runtime = "nodejs";

function buildAssistantSummary(changeRequest: string) {
  return `He aplicado cambios siguiendo esta petición: "${changeRequest}". Revisa el bloque actualizado y, si quieres, dime qué parte quieres seguir afinando.`;
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ReviseRoutinePayload;
    const trimmedRequest = payload.changeRequest.trim();

    if (trimmedRequest.split(/\s+/).length < 5) {
      return Response.json({
        assistantMessage:
          "Necesito algo más de contexto para tocar la rutina con criterio. Indícame qué ejercicio, día, grupo muscular, volumen o prioridad quieres cambiar y por qué.",
        requiresClarification: true,
      });
    }

    const { routine, usage } = await reviseRoutine(payload);

    return Response.json({
      assistantMessage: buildAssistantSummary(trimmedRequest),
      routine,
      usage,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "No se pudo modificar la rutina." },
      { status: 500 }
    );
  }
}
