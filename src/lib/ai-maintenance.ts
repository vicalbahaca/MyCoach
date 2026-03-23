export const AI_MAINTENANCE_MODE = true;

export const AI_MAINTENANCE_TITLE = "Plataforma en mantenimiento";

export const AI_MAINTENANCE_MESSAGE =
  "El módulo de personalización automática está temporalmente en mantenimiento. Inténtalo de nuevo en unos minutos.";

export function buildAiMaintenancePayload() {
  return {
    maintenance: true,
    error: AI_MAINTENANCE_MESSAGE,
  };
}
