import type { Metadata } from "next";

import { RoutineBuilder } from "@/components/routine-builder";

export const metadata: Metadata = {
  title: "Creador de Rutinas | MyCoach",
  description:
    "Construye rutinas personalizadas de musculación, Hyrox y CrossFit con análisis previo, formulario dinámico y exportación a Excel.",
};

export default function PlanPage() {
  return <RoutineBuilder />;
}
