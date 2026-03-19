import Image from "next/image";
import {
  Bell,
  Bolt,
  CircleUserRound,
  Download,
  Grid2x2,
  History,
  LineChart,
  Lock,
  Search,
  TableProperties,
  Video,
} from "lucide-react";

import { getExerciseVisual } from "@/lib/visual-assets";
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
  const activeRotation = routine.rotationLabels[rotationIndex] || routine.rotationLabels[0];
  const heroTitle = replaceMesociclo(routine.headline || "Rutina principal");
  const heroBadge = replaceMesociclo(routine.mesocycleLabel || "Rutina principal");
  const rationale = routine.structureRationale[0] || routine.subtitle;
  const objectiveHint = routine.athleteSnapshot[0] || routine.subtitle;
  const progressWidth = `${Math.min(100, ((rotationIndex + 1) / Math.max(routine.rotationLabels.length, 1)) * 100)}%`;

  return (
    <>
      <section className="mx-auto max-w-[1440px] px-6 pb-32 pt-4">
        <TopUtilityBar />

        <section className="mb-16">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#dae1ff] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#003fa4]">
                  {routine.priorityTargets[0] || "Rutina premium"}
                </span>
                <span className="rounded-full bg-[#e2e3e1] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[#424656]">
                  {heroBadge}
                </span>
              </div>
              <h1 className="font-display mb-4 text-5xl font-black leading-none tracking-[-0.05em] text-[#1a1c1b] lg:text-7xl">
                {heroTitle}
              </h1>
              <p className="max-w-2xl text-xl font-medium text-[#424656]">
                {routine.subtitle}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                className="rounded-2xl border-2 border-[#1b1b1b] px-6 py-3 font-bold transition-all hover:bg-[#1b1b1b] hover:text-white"
                onClick={onOpenModify}
                type="button"
              >
                Modificar rutina
              </button>
              <button
                className="flex items-center gap-2 rounded-2xl bg-[#1b1b1b] px-6 py-3 font-bold text-white"
                onClick={onExport}
                type="button"
              >
                <Download className="h-4 w-4" />
                Exportar a Excel
              </button>
            </div>
          </div>
        </section>

        <section className="mb-20 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col justify-between rounded-[2rem] bg-white p-8 shadow-[0_20px_40px_-10px_rgba(26,28,27,0.06)]">
            <div>
              <h3 className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-[#424656]">
                Rationale
              </h3>
              <p className="text-lg font-medium italic leading-relaxed text-[#1a1c1b]">
                &quot;{rationale}&quot;
              </p>
            </div>
            <div className="mt-8 flex items-center gap-2 text-[#0050cc]">
              <Bolt className="h-5 w-5" />
              <span className="text-sm font-bold uppercase tracking-tight">Nota del Coach</span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-[2rem] bg-[#f4f4f2] p-8">
            <div>
              <h3 className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-[#424656]">
                Objetivo Principal
              </h3>
              <span className="font-display text-5xl font-extrabold text-[#1a1c1b]">
                {routine.objective}
              </span>
              <p className="mt-3 font-medium text-[#424656]">{objectiveHint}</p>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-[2rem] bg-[#0050cc] p-8 text-white">
            <div>
              <h3 className="mb-6 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
                Rotación Activa
              </h3>
              <h4 className="text-3xl font-bold">{activeRotation}</h4>
              <p className="mt-2 text-white/80">
                Bloque {rotationIndex + 1} de {routine.rotationLabels.length}
              </p>
            </div>
            <div className="mt-8 h-1 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-full bg-white" style={{ width: progressWidth }} />
            </div>
          </div>
        </section>

        <section className="mb-12">
          <div className="no-scrollbar flex items-center gap-4 overflow-x-auto pb-4">
            {routine.rotationLabels.map((label, index) => (
              <button
                className={`whitespace-nowrap rounded-full px-8 py-3 font-bold transition-all ${
                  index === rotationIndex
                    ? "bg-[#1b1b1b] text-white shadow-sm"
                    : "bg-[#f4f4f2] text-[#424656] hover:bg-[#e8e8e6]"
                }`}
                key={label}
                onClick={() => onRotationChange(index)}
                type="button"
              >
                {replaceMesociclo(label)}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-12">
          {routine.sessions.map((session, sessionIndex) => (
            <SessionCard
              activeRotation={activeRotation}
              exerciseCount={session.exercises.length}
              key={session.id}
              locked={sessionIndex > 0 && sessionIndex > 1}
              onOpenExercise={onOpenExercise}
              onOpenSwap={onOpenSwap}
              session={session}
              sessionIndex={sessionIndex}
            />
          ))}
        </section>
      </section>

      <BottomMobileBar />
    </>
  );
}

function TopUtilityBar() {
  return (
    <header className="sticky top-20 z-30 mb-10 rounded-[2rem] bg-[#f9f9f7]/70 backdrop-blur-xl">
      <nav className="flex w-full items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <span className="font-display text-2xl font-black tracking-[-0.05em] text-[#1b1b1b]">
            MyCoach
          </span>
          <div className="hidden items-center gap-6 lg:flex">
            <a className="border-b-2 border-[#0050cc] font-bold text-[#0050cc]" href="#">
              Dashboard
            </a>
            <a className="font-medium text-[#1b1b1b]/60 hover:text-[#0050cc]" href="#">
              Training
            </a>
            <a className="font-medium text-[#1b1b1b]/60 hover:text-[#0050cc]" href="#">
              Performance
            </a>
            <a className="font-medium text-[#1b1b1b]/60 hover:text-[#0050cc]" href="#">
              Coach
            </a>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full bg-[#f4f4f2] px-4 py-2 md:flex">
            <Search className="h-4 w-4 text-[#424656]" />
            <input
              className="border-none bg-transparent text-sm focus:outline-none"
              placeholder="Buscar rutina..."
              type="text"
            />
          </div>
          <Bell className="h-5 w-5 cursor-pointer text-[#424656]" />
          <CircleUserRound className="h-6 w-6 cursor-pointer text-[#424656]" />
        </div>
      </nav>
    </header>
  );
}

function SessionCard({
  session,
  sessionIndex,
  exerciseCount,
  locked,
  activeRotation,
  onOpenExercise,
  onOpenSwap,
}: {
  session: RoutinePlan["sessions"][number];
  sessionIndex: number;
  exerciseCount: number;
  locked: boolean;
  activeRotation: string;
  onOpenExercise: (exercise: ExercisePlan) => void;
  onOpenSwap: (sessionId: string, exerciseId: string) => void;
}) {
  if (locked) {
    return (
      <div className="overflow-hidden rounded-[2rem] bg-[#f4f4f2]/40 opacity-80 grayscale">
        <div className="flex flex-col justify-between gap-6 p-8 lg:flex-row lg:items-center lg:p-10">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="text-xl font-black text-[#424656]">
                {String(sessionIndex + 1).padStart(2, "0")}
              </span>
              <h2 className="font-display text-3xl font-black uppercase tracking-[-0.04em]">
                {session.name}
              </h2>
            </div>
            <p className="font-medium text-[#424656]/70">{session.focus}</p>
          </div>
          <Lock className="h-8 w-8 text-[#424656]/20" />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_40px_-10px_rgba(26,28,27,0.06)]">
      <div className="flex flex-col justify-between gap-6 border-b border-slate-200/40 p-8 lg:flex-row lg:items-center lg:p-10">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="text-xl font-black text-[#0050cc]">
              {String(sessionIndex + 1).padStart(2, "0")}
            </span>
            <h2 className="font-display text-3xl font-black uppercase tracking-[-0.04em]">
              {session.name}
            </h2>
          </div>
          <p className="flex flex-wrap items-center gap-4 font-medium text-[#424656]">
            <span className="flex items-center gap-1">
              <History className="h-4 w-4" /> {session.duration}
            </span>
            <span className="flex items-center gap-1">
              <TableProperties className="h-4 w-4" /> {exerciseCount} Ejercicios
            </span>
          </p>
        </div>

        <div className="flex gap-2">
          <button
            className="rounded-full bg-[#f4f4f2] p-3 transition-all hover:bg-[#dae1ff]"
            type="button"
          >
            <History className="h-5 w-5 text-[#1a1c1b]" />
          </button>
          <button className="rounded-full bg-[#0050cc] px-6 py-3 font-bold text-white transition-all hover:bg-[#0266ff]" type="button">
            Iniciar Sesión
          </button>
        </div>
      </div>

      <div className="px-8 pb-10 lg:px-10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left">
            <thead>
              <tr className="border-b border-slate-200/40 text-[10px] uppercase tracking-[0.2em] text-[#424656]/60">
                <th className="py-6 font-bold">Ejercicio</th>
                <th className="py-6 text-center font-bold">Series</th>
                <th className="py-6 text-center font-bold">Reps</th>
                <th className="py-6 text-center font-bold">RIR</th>
                <th className="py-6 text-center font-bold">Descanso</th>
                <th className="py-6 text-center font-bold">Rotación</th>
                <th className="py-6 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/20">
              {session.exercises.map((exercise) => {
                const visual = getExerciseVisual(exercise.pattern);
                const rotation = exercise.rotations.find((item) => item.label === activeRotation) || exercise.rotations[0];

                return (
                  <tr className="group" key={exercise.id}>
                    <td className="py-8">
                      <button
                        className="flex items-center gap-4 text-left"
                        onClick={() => onOpenExercise(exercise)}
                        type="button"
                      >
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-[#f4f4f2]">
                          {visual ? (
                            <Image
                              alt={visual.alt}
                              className="h-full w-full object-cover"
                              height={320}
                              src={visual.src}
                              width={320}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#dae1ff] text-[#0050cc]">
                              <Bolt className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-[#1a1c1b]">{exercise.name}</p>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#0050cc]">
                            {exercise.category}
                          </p>
                        </div>
                      </button>
                    </td>
                    <td className="py-8 text-center text-xl font-black">{exercise.sets}</td>
                    <td className="py-8 text-center font-bold text-[#424656]">{exercise.reps}</td>
                    <td className="py-8 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          exercise.rir.includes("1") || exercise.rir.includes("0")
                            ? "bg-[#ffdad6] text-[#93000a]"
                            : "bg-[#e2e3e1] text-[#424656]"
                        }`}
                      >
                        {exercise.rir}
                      </span>
                    </td>
                    <td className="py-8 text-center font-medium text-[#424656]">{exercise.rest}</td>
                    <td className="py-8 text-center">
                      <span className="rounded-full bg-[#f4f4f2] px-3 py-1 text-xs font-bold text-[#424656]">
                        {replaceMesociclo(rotation?.label || activeRotation)}
                      </span>
                    </td>
                    <td className="py-8">
                      <div className="flex justify-end gap-4">
                        <button
                          className="text-[#424656] transition-colors hover:text-[#0050cc]"
                          onClick={() => onOpenExercise(exercise)}
                          type="button"
                        >
                          <Video className="h-5 w-5" />
                        </button>
                        <button
                          aria-label="Cambiar ejercicio"
                          className="text-[#424656] transition-colors hover:text-[#0050cc]"
                          onClick={() => onOpenSwap(session.id, exercise.id)}
                          type="button"
                        >
                          <History className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function BottomMobileBar() {
  return (
    <div className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-[3rem] border-t border-[#c2c6d8]/15 bg-white/80 px-6 pb-8 pt-4 shadow-[0_-20px_40px_-10px_rgba(26,28,27,0.06)] backdrop-blur-md lg:hidden">
      <BottomNavItem icon={<Grid2x2 className="h-5 w-5" />} label="Feed" />
      <BottomNavItem icon={<TableProperties className="h-5 w-5" />} label="Plan" />
      <BottomNavItem active icon={<Bolt className="h-5 w-5 fill-current" />} label="Train" />
      <BottomNavItem icon={<LineChart className="h-5 w-5" />} label="Metrics" />
      <BottomNavItem icon={<CircleUserRound className="h-5 w-5" />} label="Profile" />
    </div>
  );
}

function BottomNavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <a
      className={`flex flex-col items-center justify-center ${
        active ? "scale-110 text-[#0050cc]" : "text-[#1b1b1b]/40"
      }`}
      href="#"
    >
      {icon}
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em]">
        {label}
      </span>
    </a>
  );
}

function replaceMesociclo(value: string) {
  return value.replace(/mesociclo/gi, "Rutina");
}
