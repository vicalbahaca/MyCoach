export const runtime = "nodejs";

export async function POST() {
  return Response.json(
    {
      error: "La generación automática está temporalmente desactivada por mantenimiento de plataforma.",
    },
    { status: 503 }
  );
}
