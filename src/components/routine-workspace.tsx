import { Download, PencilLine, RefreshCcw, Sparkles } from "lucide-react";

import { InfoTooltip } from "@/components/info-tooltip";
import type { ExercisePlan, RoutinePlan } from "@/lib/types";

type Props = {
  routine: RoutinePlan;
  rotationIndex: number;
  onRotationChange: (index: number) => void;
  onOpenExercise: (exercise: ExercisePlan) => void;
  onOpenSwap: (sessionId: string, exerciseId: string) => void;
  onOpenModify: () => void;
  onExport: () => void;
};

export function RoutineWorkspace({
  routine,
  rotationIndex,
  onRotationChange,
  onOpenExercise,
  onOpenSwap,
  onOpenModify,
  onExport,
}: Props) {
  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_30px_100px_-40px_rgba(14,116,144,0.45)] backdrop-blur">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
              <Sparkles className="h-4 w-4" />
              {routine.mesocycleLabel}
            </div>
            <div className="space-y-3">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {routine.headline}
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {routine.subtitle}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-4">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                  Objetivo
                  <InfoTooltip label="Qué es este objetivo">
                    El objetivo resume el criterio principal con el que se ha generado el bloque y condiciona la prioridad del estímulo.
                  </InfoTooltip>
                </div>
                <p className="text-sm leading-6 text-slate-700">{routine.objective}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Split
                </div>
                <p className="text-sm leading-6 text-slate-700">{routine.split}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Mesociclo
                  <InfoTooltip label="Qué es un mesociclo">
                    Un mesociclo es un bloque de varias semanas con una lógica de progresión concreta. No es una rutina aislada sin continuidad.
                  </InfoTooltip>
                </div>
                <p className="text-sm leading-6 text-slate-700">{routine.glossary.mesocycle}</p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              onClick={onOpenModify}
              type="button"
            >
              <PencilLine className="h-4 w-4" />
              Modificar
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full border border-sky-200 bg-white px-5 py-3 text-sm font-semibold text-sky-700 transition hover:border-sky-300 hover:bg-sky-50"
              onClick={onExport}
              type="button"
            >
              <Download className="h-4 w-4" />
              Exportar a Excel
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {routine.priorityTargets.map((target) => (
            <span
              className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"
              key={target}
            >
              {target}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-[0_24px_90px_-50px_rgba(14,116,144,0.45)] backdrop-blur">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-slate-950">
              Rotaciones del bloque
            </h2>
            <p className="text-sm text-slate-600">
              Cambia entre semanas/rotaciones para ver cómo evoluciona cada ejercicio.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {routine.rotationLabels.map((label, index) => (
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  index === rotationIndex
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700"
                }`}
                key={label}
                onClick={() => onRotationChange(index)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {routine.sessions.map((session) => (
            <article
              className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50/80"
              key={session.id}
            >
              <div className="flex flex-col gap-3 border-b border-slate-200 bg-white/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
                    {session.dayLabel}
                  </div>
                  <h3 className="font-display text-xl font-semibold text-slate-950">
                    {session.name}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">{session.focus}</p>
                </div>
                <div className="flex gap-4 text-sm text-slate-500">
                  <span>{session.duration}</span>
                  <span className="hidden h-5 w-px bg-slate-200 sm:block" />
                  <span className="max-w-xs">{session.recoveryTip}</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead>
                    <tr className="text-xs uppercase tracking-[0.16em] text-slate-500">
                      <th className="px-5 py-4 font-semibold">Ejercicio</th>
                      <th className="px-5 py-4 font-semibold">Series</th>
                      <th className="px-5 py-4 font-semibold">Reps</th>
                      <th className="px-5 py-4 font-semibold">RIR</th>
                      <th className="px-5 py-4 font-semibold">Descanso</th>
                      <th className="px-5 py-4 font-semibold">Rotación activa</th>
                      <th className="px-5 py-4 font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                    {session.exercises.map((exercise) => {
                      const rotation =
                        exercise.rotations[rotationIndex] || exercise.rotations[0];

                      return (
                        <tr key={exercise.id}>
                          <td className="px-5 py-4 align-top">
                            <button
                              className="text-left transition hover:text-sky-700"
                              onClick={() => onOpenExercise(exercise)}
                              type="button"
                            >
                              <div className="font-semibold text-slate-950">
                                {exercise.name}
                              </div>
                              <div className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                                {exercise.whyThisExercise}
                              </div>
                            </button>
                          </td>
                          <td className="px-5 py-4 align-top">{exercise.sets}</td>
                          <td className="px-5 py-4 align-top">{exercise.reps}</td>
                          <td className="px-5 py-4 align-top">{exercise.rir}</td>
                          <td className="px-5 py-4 align-top">{exercise.rest}</td>
                          <td className="px-5 py-4 align-top">
                            <div className="space-y-1">
                              <div className="font-medium text-slate-900">
                                {rotation.label}
                              </div>
                              <div className="text-xs leading-5 text-slate-500">
                                {rotation.protocol}
                              </div>
                              <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-sky-700">
                                {rotation.loadReference}
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 align-top">
                            <div className="flex flex-wrap gap-2">
                              <button
                                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
                                onClick={() => onOpenExercise(exercise)}
                                type="button"
                              >
                                Ver técnica
                              </button>
                              <button
                                aria-label="Cambiar ejercicio"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
                                onClick={() => onOpenSwap(session.id, exercise.id)}
                                type="button"
                              >
                                <RefreshCcw className="h-3.5 w-3.5" />
                                Cambiar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
