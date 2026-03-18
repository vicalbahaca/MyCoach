import Image from "next/image";
import { Download, PencilLine, RefreshCcw, Sparkles } from "lucide-react";

import { InfoTooltip } from "@/components/info-tooltip";
import { generatedVisuals } from "@/lib/visual-assets";
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
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <article className="soft-card p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
                <Sparkles className="h-4 w-4" />
                {routine.mesocycleLabel}
              </div>
              <div className="space-y-3">
                <h1 className="font-display text-3xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-5xl">
                  {routine.headline}
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  {routine.subtitle}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
              <button className="black-button px-5 py-3 text-sm" onClick={onOpenModify} type="button">
                <PencilLine className="h-4 w-4" />
                Modificar
              </button>
              <button className="ghost-button px-5 py-3 text-sm" onClick={onExport} type="button">
                <Download className="h-4 w-4" />
                Exportar a Excel
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <OverviewCard
              label="Objetivo"
              tooltip="Qué es este objetivo"
              tooltipContent="Resume el criterio central del bloque y condiciona la selección de ejercicios, frecuencia y margen de fatiga."
              value={routine.objective}
            />
            <OverviewCard label="Split" value={routine.split} />
            <OverviewCard
              label="Mesociclo"
              tooltip="Qué es un mesociclo"
              tooltipContent={routine.glossary.mesocycle}
              value="Bloque estructurado"
            />
            <OverviewCard label="Rotación activa" value={routine.rotationLabels[rotationIndex] || routine.rotationLabels[0]} />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {routine.priorityTargets.map((target) => (
              <span
                className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                key={target}
              >
                {target}
              </span>
            ))}
          </div>
        </article>

        <article className="soft-card overflow-hidden p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)]">
            <div className="rounded-[28px] border border-slate-200 bg-[#faf9f4] p-3">
              <Image
                alt="Visualización editorial de la progresión del mesociclo"
                className="h-auto w-full"
                height={760}
                src={generatedVisuals.mesocycleGraph}
                width={1200}
              />
            </div>
            <div className="grid gap-4">
              <SummaryList title="Lectura del atleta" values={routine.athleteSnapshot} />
              <SummaryList title="Por qué está construido así" values={routine.structureRationale} />
            </div>
          </div>
        </article>
      </div>

      <article className="soft-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-950">
              Rotaciones del bloque
            </h2>
            <p className="mt-1 text-sm leading-7 text-slate-600">
              Cambia entre rotaciones para ver la progresión de repeticiones, carga y margen real.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {routine.rotationLabels.map((label, index) => (
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  index === rotationIndex
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-[rgba(66,108,255,0.3)] hover:text-slate-950"
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
      </article>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {routine.sessions.map((session) => (
            <article className="soft-card overflow-hidden" key={session.id}>
              <div className="border-b border-slate-200/80 bg-white/80 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--primary)]">
                      {session.dayLabel}
                    </div>
                    <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-950">
                      {session.name}
                    </h3>
                    <p className="max-w-2xl text-sm leading-7 text-slate-600">{session.focus}</p>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-500 sm:grid-cols-2 lg:max-w-md">
                    <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                      {session.duration}
                    </div>
                    <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-3">
                      {session.recoveryTip}
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-slate-200 text-left">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                      <th className="px-6 py-4 font-bold">Ejercicio</th>
                      <th className="px-6 py-4 font-bold">Series</th>
                      <th className="px-6 py-4 font-bold">Reps</th>
                      <th className="px-6 py-4 font-bold">RIR</th>
                      <th className="px-6 py-4 font-bold">Descanso</th>
                      <th className="px-6 py-4 font-bold">Rotación activa</th>
                      <th className="px-6 py-4 font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                    {session.exercises.map((exercise) => {
                      const rotation = exercise.rotations[rotationIndex] || exercise.rotations[0];

                      return (
                        <tr key={exercise.id}>
                          <td className="px-6 py-5 align-top">
                            <button
                              className="max-w-md text-left transition hover:text-[var(--primary)]"
                              onClick={() => onOpenExercise(exercise)}
                              type="button"
                            >
                              <div className="font-semibold text-slate-950">{exercise.name}</div>
                              <div className="mt-1 text-xs leading-5 text-slate-500">
                                {exercise.whyThisExercise}
                              </div>
                            </button>
                          </td>
                          <td className="px-6 py-5 align-top">{exercise.sets}</td>
                          <td className="px-6 py-5 align-top">{exercise.reps}</td>
                          <td className="px-6 py-5 align-top">{exercise.rir}</td>
                          <td className="px-6 py-5 align-top">{exercise.rest}</td>
                          <td className="px-6 py-5 align-top">
                            <div className="space-y-1">
                              <div className="font-semibold text-slate-950">{rotation.label}</div>
                              <div className="text-xs leading-5 text-slate-500">
                                {rotation.protocol}
                              </div>
                              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--primary)]">
                                {rotation.loadReference}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 align-top">
                            <ActionButtons
                              exercise={exercise}
                              onOpenExercise={onOpenExercise}
                              onOpenSwap={() => onOpenSwap(session.id, exercise.id)}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-4 p-4 md:hidden">
                {session.exercises.map((exercise) => {
                  const rotation = exercise.rotations[rotationIndex] || exercise.rotations[0];

                  return (
                    <article className="rounded-[28px] border border-slate-200 bg-white p-4" key={exercise.id}>
                      <button
                        className="w-full text-left"
                        onClick={() => onOpenExercise(exercise)}
                        type="button"
                      >
                        <div className="font-display text-xl font-semibold tracking-tight text-slate-950">
                          {exercise.name}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{exercise.whyThisExercise}</p>
                      </button>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700">
                        <DataPill label="Series" value={String(exercise.sets)} />
                        <DataPill label="Reps" value={exercise.reps} />
                        <DataPill label="RIR" value={exercise.rir} />
                        <DataPill label="Descanso" value={exercise.rest} />
                      </div>

                      <div className="mt-4 rounded-[22px] bg-[#f7f8fc] p-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
                          {rotation.label}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{rotation.protocol}</p>
                        <div className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                          {rotation.loadReference}
                        </div>
                      </div>

                      <div className="mt-4">
                        <ActionButtons
                          exercise={exercise}
                          onOpenExercise={onOpenExercise}
                          onOpenSwap={() => onOpenSwap(session.id, exercise.id)}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        <aside className="space-y-6">
          <article className="soft-card p-5">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#faf9f4]">
              <Image
                alt="Mockup móvil del resultado de rutina de MyCoach"
                className="h-auto w-full"
                height={980}
                src={generatedVisuals.phoneRoutine}
                width={520}
              />
            </div>
          </article>

          <article className="soft-card p-5">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              Ajustes rápidos
            </div>
            <div className="mt-4 grid gap-3">
              {routine.modificationHints.map((hint) => (
                <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700" key={hint}>
                  {hint}
                </div>
              ))}
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}

function OverviewCard({
  label,
  value,
  tooltip,
  tooltipContent,
}: {
  label: string;
  value: string;
  tooltip?: string;
  tooltipContent?: string;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white px-4 py-4">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
        {label}
        {tooltip && tooltipContent ? (
          <InfoTooltip label={tooltip}>{tooltipContent}</InfoTooltip>
        ) : null}
      </div>
      <div className="text-sm leading-7 text-slate-800">{value}</div>
    </div>
  );
}

function SummaryList({
  title,
  values,
}: {
  title: string;
  values: string[];
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
        {title}
      </div>
      <div className="mt-4 grid gap-3">
        {values.map((value) => (
          <div className="rounded-[20px] bg-[#f7f8fc] px-4 py-3 text-sm leading-7 text-slate-700" key={value}>
            {value}
          </div>
        ))}
      </div>
    </div>
  );
}

function DataPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] bg-[#f7f8fc] px-4 py-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function ActionButtons({
  exercise,
  onOpenExercise,
  onOpenSwap,
}: {
  exercise: ExercisePlan;
  onOpenExercise: (exercise: ExercisePlan) => void;
  onOpenSwap: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-[rgba(66,108,255,0.32)] hover:text-slate-950"
        onClick={() => onOpenExercise(exercise)}
        type="button"
      >
        Ver técnica
      </button>
      <button
        aria-label="Cambiar ejercicio"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:border-[rgba(66,108,255,0.32)] hover:text-slate-950"
        onClick={onOpenSwap}
        type="button"
      >
        <RefreshCcw className="h-3.5 w-3.5" />
        Cambiar
      </button>
    </div>
  );
}
