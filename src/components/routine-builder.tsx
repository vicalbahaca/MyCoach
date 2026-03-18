"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useState,
  type ChangeEvent,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  FileText,
  ImageUp,
  LoaderCircle,
  Sparkles,
  Target,
  Video,
  X,
} from "lucide-react";

import { ExerciseIllustration } from "@/components/exercise-illustration";
import { RoutineWorkspace } from "@/components/routine-workspace";
import { exportRoutineWorkbook } from "@/lib/excel";
import type {
  DynamicAnswerValue,
  DynamicAnswers,
  DynamicQuestion,
  DynamicSection,
  ExercisePlan,
  GenerateRoutinePayload,
  IntakeAnalysis,
  IntakeProfile,
  RoutinePlan,
} from "@/lib/types";

const STEP_META = [
  { id: 1, title: "Perfil y contexto", icon: ClipboardList },
  { id: 2, title: "Visual opcional", icon: ImageUp },
  { id: 3, title: "Formulario dinámico", icon: BrainCircuit },
  { id: 4, title: "Preferencias del bloque", icon: Target },
  { id: 5, title: "Confirmar y generar", icon: Sparkles },
];

const DISCIPLINE_OPTIONS = [
  { value: "bodybuilding", label: "Musculación" },
  { value: "hyrox", label: "Hyrox" },
  { value: "crossfit", label: "CrossFit" },
  { value: "strength", label: "Pesas / fuerza" },
  { value: "recomposition", label: "Recomposición" },
] as const;

const SURFACE =
  "rounded-[2rem] border border-white/70 bg-white/90 shadow-[0_30px_100px_-55px_rgba(14,116,144,0.52)] backdrop-blur";

function optionalLabel() {
  return <span className="text-xs font-medium text-slate-400">Opcional</span>;
}

function FieldLabel({
  title,
  helper,
}: {
  title: string;
  helper?: React.ReactNode;
}) {
  return (
    <label className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-700">
      <span>{title}</span>
      {helper ?? optionalLabel()}
    </label>
  );
}

function inputClassName() {
  return "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-300 focus:ring-4 focus:ring-sky-100";
}

function arrayValue(value: DynamicAnswerValue | undefined) {
  return Array.isArray(value) ? value : [];
}

export function RoutineBuilder() {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<IntakeProfile>({ disciplines: [] });
  const [contextFiles, setContextFiles] = useState<File[]>([]);
  const [visualFiles, setVisualFiles] = useState<File[]>([]);
  const [analysis, setAnalysis] = useState<IntakeAnalysis | null>(null);
  const [answers, setAnswers] = useState<DynamicAnswers>({});
  const [routine, setRoutine] = useState<RoutinePlan | null>(null);
  const [rotationIndex, setRotationIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedExercise, setSelectedExercise] = useState<ExercisePlan | null>(null);
  const [swapTarget, setSwapTarget] = useState<{ sessionId: string; exerciseId: string } | null>(null);
  const [isModifyOpen, setIsModifyOpen] = useState(false);
  const [changeRequest, setChangeRequest] = useState("");

  const scrollToActiveStep = useEffectEvent(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  useEffect(() => {
    scrollToActiveStep();
  }, [step, routine]);

  function invalidateAnalysis() {
    setAnalysis(null);
    setAnswers({});
    setRoutine(null);
    setErrorMessage("");
  }

  function updateProfile<K extends keyof IntakeProfile>(key: K, value: IntakeProfile[K]) {
    invalidateAnalysis();
    setProfile((current) => ({ ...current, [key]: value }));
  }

  function toggleDiscipline(value: (typeof DISCIPLINE_OPTIONS)[number]["value"]) {
    invalidateAnalysis();
    setProfile((current) => {
      const disciplines = current.disciplines || [];
      const next = disciplines.includes(value)
        ? disciplines.filter((item) => item !== value)
        : [...disciplines, value];

      return { ...current, disciplines: next };
    });
  }

  function updateFiles(type: "context" | "visual", event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files || []);
    invalidateAnalysis();
    if (type === "context") {
      setContextFiles(nextFiles);
      return;
    }

    setVisualFiles(nextFiles.slice(0, 10));
  }

  function moveTo(nextStep: number) {
    startTransition(() => setStep(nextStep));
  }

  async function personalizeForm() {
    setIsAnalyzing(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("payload", JSON.stringify({ profile }));

      contextFiles.forEach((file) => formData.append("contextFiles", file));
      visualFiles.forEach((file) => formData.append("visualFiles", file));

      const response = await fetch("/api/intake/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("No se pudo preparar el formulario.");
      }

      const data = (await response.json()) as { analysis: IntakeAnalysis };
      setAnalysis(data.analysis);
      moveTo(3);
    } catch {
      setErrorMessage("No se pudo personalizar el formulario. Vuelve a intentarlo.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  function updateAnswer(questionId: string, value: DynamicAnswerValue) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  }

  async function generatePlan() {
    if (!analysis) return;

    setIsGenerating(true);
    setErrorMessage("");

    try {
      const payload: GenerateRoutinePayload = {
        profile,
        analysis,
        answers,
      };

      const response = await fetch("/api/routine/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("No se pudo generar la rutina.");
      }

      const data = (await response.json()) as { routine: RoutinePlan };
      setRoutine(data.routine);
      setRotationIndex(0);
    } catch {
      setErrorMessage("No se pudo generar la rutina. Vuelve a intentarlo.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function reviseCurrentPlan() {
    if (!routine || !analysis || !changeRequest.trim()) return;

    setIsRevising(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/routine/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          analysis,
          answers,
          currentRoutine: routine,
          changeRequest,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo revisar la rutina.");
      }

      const data = (await response.json()) as { routine: RoutinePlan };
      setRoutine(data.routine);
      setIsModifyOpen(false);
      setChangeRequest("");
    } catch {
      setErrorMessage("No se pudo modificar la rutina. Vuelve a intentarlo.");
    } finally {
      setIsRevising(false);
    }
  }

  function swapExercise(alternative: string) {
    if (!swapTarget || !routine) return;

    setRoutine({
      ...routine,
      sessions: routine.sessions.map((session) => {
        if (session.id !== swapTarget.sessionId) return session;

        return {
          ...session,
          exercises: session.exercises.map((exercise) => {
            if (exercise.id !== swapTarget.exerciseId) return exercise;

            return {
              ...exercise,
              name: alternative,
              whyThisExercise: `Alternativa aplicada manualmente sobre ${exercise.name}. Mantiene el mismo hueco dentro del bloque.`,
              notes: `Sustitución aplicada desde la interfaz de MyCoach. ${exercise.notes}`,
            };
          }),
        };
      }),
    });
    setSwapTarget(null);
  }

  const swapExerciseOptions =
    swapTarget && routine
      ? routine.sessions
          .find((session) => session.id === swapTarget.sessionId)
          ?.exercises.find((exercise) => exercise.id === swapTarget.exerciseId)?.alternatives || []
      : [];

  const currentSwapExercise =
    swapTarget && routine
      ? routine.sessions
          .find((session) => session.id === swapTarget.sessionId)
          ?.exercises.find((exercise) => exercise.id === swapTarget.exerciseId) || null
      : null;

  if (routine) {
    return (
      <>
        <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.15),_transparent_28%),linear-gradient(180deg,_#f5fbff_0%,_#ffffff_28%,_#f7fbff_100%)]">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
            <Link className="font-display text-2xl font-semibold tracking-tight text-slate-950" href="/">
              MyCoach
            </Link>
            <button
              className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
              onClick={() => setRoutine(null)}
              type="button"
            >
              Volver al formulario
            </button>
          </div>

          {errorMessage ? (
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </div>
            </div>
          ) : null}

          <RoutineWorkspace
            onExport={() => exportRoutineWorkbook(routine)}
            onOpenExercise={setSelectedExercise}
            onOpenModify={() => setIsModifyOpen(true)}
            onOpenSwap={(sessionId, exerciseId) => setSwapTarget({ sessionId, exerciseId })}
            onRotationChange={setRotationIndex}
            rotationIndex={rotationIndex}
            routine={routine}
          />
        </div>

        {selectedExercise ? (
          <ModalShell onClose={() => setSelectedExercise(null)} title={selectedExercise.name}>
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[1.5rem] border border-sky-100 bg-sky-50/70 p-4">
                <div className="aspect-[1.15/1] overflow-hidden rounded-[1.25rem] border border-white/70 bg-white/80">
                  <ExerciseIllustration
                    name={selectedExercise.name}
                    pattern={selectedExercise.pattern}
                  />
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    Cómo hacerlo
                  </div>
                  <p className="text-sm leading-7 text-slate-600">{selectedExercise.notes}</p>
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    Cue principal
                  </div>
                  <p className="text-sm leading-7 text-slate-600">{selectedExercise.cue}</p>
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    Por qué está en la rutina
                  </div>
                  <p className="text-sm leading-7 text-slate-600">
                    {selectedExercise.whyThisExercise}
                  </p>
                </div>
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                    Alternativas
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.alternatives.map((alternative) => (
                      <span
                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600"
                        key={alternative}
                      >
                        {alternative}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </ModalShell>
        ) : null}

        {currentSwapExercise ? (
          <ModalShell
            onClose={() => setSwapTarget(null)}
            title={`Cambiar ${currentSwapExercise.name}`}
          >
            <div className="space-y-4">
              <p className="text-sm leading-7 text-slate-600">
                Selecciona una alternativa para mantener el mismo hueco dentro del bloque sin rehacer toda la sesión.
              </p>
              <div className="grid gap-3">
                {swapExerciseOptions.map((alternative) => (
                  <button
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-sky-200 hover:bg-sky-50"
                    key={alternative}
                    onClick={() => swapExercise(alternative)}
                    type="button"
                  >
                    <div className="font-semibold text-slate-900">{alternative}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      Sustituye el ejercicio actual y conserva el resto de la estructura.
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </ModalShell>
        ) : null}

        {isModifyOpen ? (
          <ModalShell onClose={() => setIsModifyOpen(false)} title="Modificar rutina">
            <div className="space-y-4">
              <p className="text-sm leading-7 text-slate-600">
                Escribe qué quieres cambiar. Cuanto más concreto seas, mejor quedará el reajuste.
              </p>
              <textarea
                className={`${inputClassName()} min-h-36 resize-none`}
                onChange={(event) => setChangeRequest(event.target.value)}
                placeholder="Ej: baja a 4 días, más prioridad a dorsal y tríceps, menos bisagra y sesiones de 75 min."
                value={changeRequest}
              />
              <div className="flex justify-end gap-3">
                <button
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
                  onClick={() => setIsModifyOpen(false)}
                  type="button"
                >
                  Cerrar
                </button>
                <button
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={isRevising || !changeRequest.trim()}
                  onClick={reviseCurrentPlan}
                  type="button"
                >
                  {isRevising ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Aplicar cambios
                </button>
              </div>
            </div>
          </ModalShell>
        ) : null}
      </>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_25%),radial-gradient(circle_at_85%_8%,_rgba(96,165,250,0.16),_transparent_20%),linear-gradient(180deg,_#f5fbff_0%,_#ffffff_32%,_#f7fbff_100%)]">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link className="font-display text-2xl font-semibold tracking-tight text-slate-950" href="/">
          MyCoach
        </Link>
        <Link
          className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
          href="/"
        >
          Ver landing
        </Link>
      </div>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 pb-10 pt-2 sm:px-6 lg:grid-cols-[0.38fr_0.62fr] lg:px-8">
        <aside className={`${SURFACE} h-fit p-6`}>
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              <Sparkles className="h-4 w-4" />
              Constructor MyCoach
            </div>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-slate-950">
                Diseña la rutina sin colapsar al usuario.
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Primero entendemos el caso. Después pedimos solo las preguntas que sí cambian el mesociclo. Y solo al final generamos una rutina exportable y editable.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {STEP_META.map((item) => {
              const Icon = item.icon;
              const isActive = step === item.id;
              const isDone = step > item.id || (item.id === 5 && routine);

              return (
                <div
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                    isActive
                      ? "border-sky-200 bg-sky-50 text-sky-700"
                      : isDone
                        ? "border-slate-200 bg-white text-slate-600"
                        : "border-transparent bg-transparent text-slate-400"
                  }`}
                  key={item.id}
                >
                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                      isActive
                        ? "bg-white text-sky-700"
                        : isDone
                          ? "bg-slate-100 text-slate-600"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.16em]">
                      Paso {item.id}
                    </div>
                    <div className="text-sm font-semibold">{item.title}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-sky-100 bg-sky-50/70 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Archivos admitidos
            </div>
            <p className="text-sm leading-6 text-slate-600">
              Texto, Excel, CSV, DOCX y PDF para la rutina actual. Imágenes o vídeo para el análisis visual opcional.
            </p>
          </div>
        </aside>

        <section className={`${SURFACE} p-6 sm:p-8`}>
          {errorMessage ? (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-8">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                  Paso 1
                </div>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950">
                  Contexto base, rutina actual y datos del atleta
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Todo es opcional. Puedes escribir el caso, pegar la rutina actual o subir un archivo para arrancar con más contexto.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel title="Sexo" />
                  <input
                    className={inputClassName()}
                    onChange={(event) => updateProfile("sex", event.target.value)}
                    placeholder="Ej: hombre, mujer..."
                    value={profile.sex || ""}
                  />
                </div>
                <div>
                  <FieldLabel title="Nivel" />
                  <input
                    className={inputClassName()}
                    onChange={(event) => updateProfile("level", event.target.value)}
                    placeholder="Ej: amateur, avanzado..."
                    value={profile.level || ""}
                  />
                </div>
                <div>
                  <FieldLabel title="Años de entrenamiento" />
                  <input
                    className={inputClassName()}
                    onChange={(event) => updateProfile("yearsTraining", event.target.value)}
                    placeholder="Ej: 5 años"
                    value={profile.yearsTraining || ""}
                  />
                </div>
                <div>
                  <FieldLabel title="Peso y altura" />
                  <input
                    className={inputClassName()}
                    onChange={(event) => updateProfile("weight", event.target.value)}
                    placeholder="Ej: 88 kg · 1.88 m"
                    value={profile.weight || ""}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel title="Dieta o contexto nutricional" />
                  <input
                    className={inputClassName()}
                    onChange={(event) => updateProfile("diet", event.target.value)}
                    placeholder="Ej: mantenimiento, ligero superávit..."
                    value={profile.diet || ""}
                  />
                </div>
                <div>
                  <FieldLabel title="Objetivo principal" />
                  <input
                    className={inputClassName()}
                    onChange={(event) => updateProfile("objective", event.target.value)}
                    placeholder="Ej: ganar masa, Hyrox, bajar peso..."
                    value={profile.objective || ""}
                  />
                </div>
              </div>

              <div>
                <FieldLabel title="Disciplinas a considerar" helper={optionalLabel()} />
                <div className="flex flex-wrap gap-3">
                  {DISCIPLINE_OPTIONS.map((option) => {
                    const selected = profile.disciplines?.includes(option.value) || false;
                    return (
                      <button
                        className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                          selected
                            ? "bg-slate-950 text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700"
                        }`}
                        key={option.value}
                        onClick={() => toggleDiscipline(option.value)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <FieldLabel title="Entrenamiento actual" />
                  <textarea
                    className={`${inputClassName()} min-h-28 resize-none`}
                    onChange={(event) => updateProfile("currentTraining", event.target.value)}
                    placeholder="Ej: actualmente hago clases, full body, Hyrox 3 días, o no tengo estructura fija..."
                    value={profile.currentTraining || ""}
                  />
                </div>
                <div>
                  <FieldLabel title="Contexto de la persona o rutina actual copiada" />
                  <textarea
                    className={`${inputClassName()} min-h-40 resize-none`}
                    onChange={(event) => updateProfile("currentRoutineText", event.target.value)}
                    placeholder="Pega aquí la rutina actual, feedback del bloque, limitaciones o cualquier contexto útil."
                    value={profile.currentRoutineText || ""}
                  />
                </div>
                <div>
                  <FieldLabel title="Adjuntar rutina actual o documentos" />
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center transition hover:border-sky-300 hover:bg-sky-50">
                    <FileText className="mb-3 h-6 w-6 text-sky-700" />
                    <span className="text-sm font-semibold text-slate-700">
                      TXT, CSV, Excel, DOCX o PDF
                    </span>
                    <span className="mt-1 text-xs leading-6 text-slate-500">
                      Sube la rutina actual o cualquier documento útil para arrancar.
                    </span>
                    <input
                      accept=".txt,.csv,.xlsx,.xls,.docx,.pdf,.md"
                      className="hidden"
                      multiple
                      onChange={(event) => updateFiles("context", event)}
                      type="file"
                    />
                  </label>
                  {contextFiles.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {contextFiles.map((file) => (
                        <span
                          className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600"
                          key={file.name}
                        >
                          {file.name}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <WizardActions
                nextLabel="Continuar"
                onNext={() => moveTo(2)}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-8">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                  Paso 2
                </div>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950">
                  Recurso visual del físico
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Este paso es totalmente opcional. Si subes material visual, MyCoach lanzará una revisión previa para personalizar mejor el siguiente formulario.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-sky-100 bg-sky-50/70 p-5">
                <div className="flex items-start gap-3">
                  <Video className="mt-1 h-5 w-5 shrink-0 text-sky-700" />
                  <div className="text-sm leading-7 text-slate-600">
                    Recomendación: vídeo corto de alrededor de 30 segundos, cuerpo completo, frente, lado y espalda, posando o relajado, con buena iluminación. También puedes subir hasta 10 imágenes.
                  </div>
                </div>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-sky-300 hover:bg-sky-50">
                <ImageUp className="mb-3 h-6 w-6 text-sky-700" />
                <span className="text-sm font-semibold text-slate-700">
                  Imágenes o vídeo opcional
                </span>
                <span className="mt-1 text-xs leading-6 text-slate-500">
                  Acepta imágenes y vídeo. Si no subes nada, el flujo sigue igualmente.
                </span>
                <input
                  accept="image/*,video/mp4,video/quicktime,video/webm"
                  className="hidden"
                  multiple
                  onChange={(event) => updateFiles("visual", event)}
                  type="file"
                />
              </label>

              {visualFiles.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {visualFiles.map((file) => (
                    <div
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600"
                      key={file.name}
                    >
                      {file.name}
                    </div>
                  ))}
                </div>
              ) : null}

              <WizardActions
                backLabel="Volver"
                nextLabel={isAnalyzing ? "Personalizando..." : "Personalizar formulario"}
                onBack={() => moveTo(1)}
                onNext={personalizeForm}
                nextDisabled={isAnalyzing}
                nextIcon={isAnalyzing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : undefined}
              />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-8">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                  Paso 3
                </div>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950">
                  Formulario personalizado
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Estas preguntas se han ajustado al caso. Siguen siendo cortas, opcionales y pensadas para cambiar la programación de verdad.
                </p>
              </div>

              {analysis ? (
                <div className="space-y-5">
                  {analysis.personalizedSections.map((section) => (
                    <DynamicSectionCard
                      answers={answers}
                      key={section.id}
                      onAnswer={updateAnswer}
                      section={section}
                    />
                  ))}
                </div>
              ) : (
                <LoaderBlock />
              )}

              <WizardActions
                backLabel="Volver"
                nextLabel="Continuar"
                onBack={() => moveTo(2)}
                onNext={() => moveTo(4)}
              />
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-8">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                  Paso 4
                </div>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950">
                  Preferencias del bloque
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Aquí cerramos las variables logísticas que más influyen en la adherencia y en el reparto semanal.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <FieldLabel title="Días por semana deseados" />
                  <div className="flex flex-wrap gap-3">
                    {["3", "4", "5", "6", "Auto"].map((value) => (
                      <button
                        className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                          profile.daysPerWeek === value
                            ? "bg-slate-950 text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700"
                        }`}
                        key={value}
                        onClick={() =>
                          updateProfile("daysPerWeek", value === "Auto" ? "" : value)
                        }
                        type="button"
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <FieldLabel title="Duración preferida" />
                  <div className="flex flex-wrap gap-3">
                    {["45-60", "60-75", "75-90", "90+"].map((value) => (
                      <button
                        className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                          profile.sessionLength === value
                            ? "bg-slate-950 text-white"
                            : "border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700"
                        }`}
                        key={value}
                        onClick={() => updateProfile("sessionLength", value)}
                        type="button"
                      >
                        {value} min
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <FieldLabel title="Material disponible" />
                  <input
                    className={inputClassName()}
                    onChange={(event) => updateProfile("equipment", event.target.value)}
                    placeholder="Ej: Technogym, Hammer, gym80, racks, ergs..."
                    value={profile.equipment || ""}
                  />
                </div>
                <div>
                  <FieldLabel title="Limitaciones o molestias a vigilar" />
                  <input
                    className={inputClassName()}
                    onChange={(event) => updateProfile("limitationNotes", event.target.value)}
                    placeholder="Ej: hombro en press plano, ciática, rodilla..."
                    value={profile.limitationNotes || ""}
                  />
                </div>
              </div>

              <WizardActions
                backLabel="Volver"
                nextLabel="Revisar todo"
                onBack={() => moveTo(3)}
                onNext={() => moveTo(5)}
              />
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-8">
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                  Paso 5
                </div>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950">
                  Confirmar y generar rutina
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Con todo lo guardado, MyCoach lanzará la generación del bloque y devolverá una rutina en tablas con tooltips, cambio de ejercicios y exportación a Excel.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SummaryCard
                  icon={<FileText className="h-5 w-5" />}
                  title="Contexto"
                  value={
                    profile.currentRoutineText?.trim()
                      ? "Texto de contexto añadido"
                      : "Sin texto específico"
                  }
                  extra={`${contextFiles.length} archivos adjuntos`}
                />
                <SummaryCard
                  icon={<ImageUp className="h-5 w-5" />}
                  title="Visual"
                  value={
                    visualFiles.length
                      ? `${visualFiles.length} recursos visuales`
                      : "Sin adjuntos visuales"
                  }
                  extra="Paso opcional"
                />
                <SummaryCard
                  icon={<BrainCircuit className="h-5 w-5" />}
                  title="Formulario dinámico"
                  value={`${Object.values(answers).filter(Boolean).length} respuestas capturadas`}
                  extra="Se usan para personalizar la estructura final"
                />
                <SummaryCard
                  icon={<Target className="h-5 w-5" />}
                  title="Logística"
                  value={`${profile.daysPerWeek || "Auto"} días · ${profile.sessionLength || "Auto"} min`}
                  extra={profile.equipment || "Sin material especificado"}
                />
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Resumen rápido
                </div>
                <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
                  <div>Objetivo: {profile.objective || "No indicado"}</div>
                  <div>Disciplinas: {(profile.disciplines || []).join(", ") || "No indicadas"}</div>
                  <div>Nivel: {profile.level || "No indicado"}</div>
                  <div>Material: {profile.equipment || "No indicado"}</div>
                </div>
              </div>

              <WizardActions
                backLabel="Volver"
                nextLabel={isGenerating ? "Generando..." : "Generar rutina"}
                onBack={() => moveTo(4)}
                onNext={generatePlan}
                nextDisabled={isGenerating}
                nextIcon={isGenerating ? <LoaderCircle className="h-4 w-4 animate-spin" /> : undefined}
              />
            </div>
          ) : null}
        </section>
      </section>

      {isAnalyzing || isGenerating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className={`${SURFACE} flex w-full max-w-lg flex-col items-center gap-4 p-8 text-center`}>
            <LoaderCircle className="h-10 w-10 animate-spin text-sky-700" />
            <div className="space-y-2">
              <h3 className="font-display text-2xl font-semibold text-slate-950">
                {isAnalyzing
                  ? "Personalizando el formulario"
                  : "Generando tu mesociclo"}
              </h3>
              <p className="text-sm leading-7 text-slate-600">
                {isAnalyzing
                  ? "MyCoach está revisando el contexto y el material opcional para decidir qué preguntas sí merece la pena hacer."
                  : "MyCoach está construyendo la rutina final con toda la información guardada."}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function LoaderBlock() {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8">
      <div className="flex items-center gap-3">
        <LoaderCircle className="h-5 w-5 animate-spin text-sky-700" />
        <span className="text-sm font-medium text-slate-600">
          Cargando formulario personalizado...
        </span>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  extra,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  extra: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5">
      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
        {icon}
      </div>
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>
      <div className="mt-2 text-base font-semibold text-slate-950">{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-500">{extra}</div>
    </div>
  );
}

function DynamicSectionCard({
  section,
  answers,
  onAnswer,
}: {
  section: DynamicSection;
  answers: DynamicAnswers;
  onAnswer: (questionId: string, value: DynamicAnswerValue) => void;
}) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-slate-50/80 p-5">
      <div className="mb-5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          {section.title}
        </div>
        <p className="mt-2 text-sm leading-7 text-slate-600">{section.description}</p>
      </div>

      <div className="space-y-5">
        {section.questions.map((question) => (
          <QuestionField
            answer={answers[question.id]}
            key={question.id}
            onAnswer={onAnswer}
            question={question}
          />
        ))}
      </div>
    </article>
  );
}

function QuestionField({
  question,
  answer,
  onAnswer,
}: {
  question: DynamicQuestion;
  answer: DynamicAnswerValue | undefined;
  onAnswer: (questionId: string, value: DynamicAnswerValue) => void;
}) {
  if (question.type === "textarea" || question.type === "text") {
    return (
      <div>
        <FieldLabel title={question.label} helper={optionalLabel()} />
        <p className="mb-3 text-sm leading-6 text-slate-500">{question.help}</p>
        {question.type === "textarea" ? (
          <textarea
            className={`${inputClassName()} min-h-28 resize-none`}
            onChange={(event) => onAnswer(question.id, event.target.value)}
            placeholder={question.placeholder}
            value={typeof answer === "string" ? answer : ""}
          />
        ) : (
          <input
            className={inputClassName()}
            onChange={(event) => onAnswer(question.id, event.target.value)}
            placeholder={question.placeholder}
            value={typeof answer === "string" ? answer : ""}
          />
        )}
      </div>
    );
  }

  if (question.type === "slider") {
    const currentValue = typeof answer === "number" ? answer : question.min || 1;

    return (
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-800">{question.label}</div>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            {currentValue}
          </span>
        </div>
        <p className="mb-4 text-sm leading-6 text-slate-500">{question.help}</p>
        <input
          className="slider-accent h-2 w-full appearance-none rounded-full bg-sky-100"
          max={question.max}
          min={question.min}
          onChange={(event) => onAnswer(question.id, Number(event.target.value))}
          step={question.step || 1}
          type="range"
          value={currentValue}
        />
      </div>
    );
  }

  if (question.type === "radio") {
    return (
      <div>
        <FieldLabel title={question.label} helper={optionalLabel()} />
        <p className="mb-3 text-sm leading-6 text-slate-500">{question.help}</p>
        <div className="grid gap-3">
          {question.options?.map((option) => {
            const selected = answer === option.value;

            return (
              <button
                className={`rounded-[1.5rem] border px-4 py-4 text-left transition ${
                  selected
                    ? "border-sky-200 bg-sky-50"
                    : "border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/50"
                }`}
                key={option.value}
                onClick={() => onAnswer(question.id, option.value)}
                type="button"
              >
                <div className="font-semibold text-slate-900">{option.label}</div>
                {option.description ? (
                  <div className="mt-1 text-sm leading-6 text-slate-500">
                    {option.description}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <FieldLabel title={question.label} helper={optionalLabel()} />
      <p className="mb-3 text-sm leading-6 text-slate-500">{question.help}</p>
      <div className="flex flex-wrap gap-3">
        {question.options?.map((option) => {
          const values = arrayValue(answer);
          const selected = values.includes(option.value);

          return (
            <button
              className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                selected
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700"
              }`}
              key={option.value}
              onClick={() => {
                const next = selected
                  ? values.filter((value) => value !== option.value)
                  : [...values, option.value];
                onAnswer(question.id, next);
              }}
              type="button"
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WizardActions({
  backLabel,
  nextLabel,
  onBack,
  onNext,
  nextDisabled,
  nextIcon,
}: {
  backLabel?: string;
  nextLabel: string;
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextIcon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div>
        {onBack ? (
          <button
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </button>
        ) : (
          <div />
        )}
      </div>
      <button
        className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={nextDisabled}
        onClick={onNext}
        type="button"
      >
        {nextIcon}
        {nextLabel}
        {!nextIcon ? <ArrowRight className="h-4 w-4" /> : null}
      </button>
    </div>
  );
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-10 backdrop-blur-sm">
      <div className="max-h-full w-full max-w-4xl overflow-auto rounded-[2rem] border border-white/70 bg-white p-6 shadow-[0_40px_120px_-50px_rgba(14,116,144,0.55)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-950">
              {title}
            </h3>
          </div>
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
