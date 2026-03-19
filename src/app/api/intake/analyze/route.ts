export const runtime = "nodejs";

export async function POST() {
  return Response.json(
    {
      error:
        "La personalización automática está temporalmente desactivada por mantenimiento de plataforma.",
    },
    { status: 503 }
  );
}
