export const runtime = "nodejs";

export async function POST() {
  return Response.json(
    {
      error: "La revisión automática está temporalmente desactivada por mantenimiento de plataforma.",
    },
    { status: 503 }
  );
}
