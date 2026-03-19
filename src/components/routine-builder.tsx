"use client";

import Image from "next/image";
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
  Bolt,
  CheckCircle2,
  ClipboardList,
  Edit3,
  FileText,
  ImageUp,
  LoaderCircle,
  Plus,
  PlusCircle,
  Sparkles,
  Target,
  X,
} from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { ExerciseIllustration } from "@/components/exercise-illustration";
import { RoutineWorkspace } from "@/components/routine-workspace";
import {
  FormChoiceCard,
  FormChipButton,
  FormFooter,
  FormLineInput,
  FormLineSelect,
  FormQuestionCard,
  FormSection,
  FormStepIntro,
  FormTextArea,
  FormTopBar,
  FormProgress,
  FormPillButton,
  FormUploadTile,
  type FormOption,
} from "@/components/ui-kit/form";
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
import {
  getExerciseVisual,
  landingPhotos,
} from "@/lib/visual-assets";
import {
  getInitialSportDisciplineOptions,
  getNextSportDisciplineBatch,
  getSportDisciplineLabel,
  getVisibleSportDisciplines,
  SPORT_DISCIPLINE_BATCH_SIZE,
} from "@/lib/sport-disciplines";

const STEP_META = [
  {
    id: 1,
    title: "Datos",
    blurb: "Base del caso: perfil del atleta, objetivo principal y disciplinas que hay que tener en cuenta.",
    icon: ClipboardList,
  },
  {
    id: 2,
    title: "Contexto",
    blurb: "Aqui entra el bloque actual: puedes escribirlo en texto plano o adjuntarlo en archivo.",
    icon: FileText,
  },
  {
    id: 3,
    title: "Análisis",
    blurb: "Lectura del físico para personalizar prioridades y detectar sesgos del bloque.",
    icon: ImageUp,
  },
  {
    id: 4,
    title: "Formulario",
    blurb: "Preguntas adaptadas al caso. Nada de pedir lo mismo a todos.",
    icon: BrainCircuit,
  },
  {
    id: 5,
    title: "Preferencias",
    blurb: "Logística, tiempo real, frecuencia y material disponible.",
    icon: Target,
  },
  {
    id: 6,
    title: "Generar",
    blurb: "Resumen final antes de lanzar la rutina editable y exportable.",
    icon: Sparkles,
  },
] as const;

const SEX_OPTIONS = ["Hombre", "Mujer", "Otro"] as const;

const DIET_OPTIONS: FormOption[] = [
  { value: "Omnívora", label: "Omnívora" },
  { value: "Vegetariana", label: "Vegetariana" },
  { value: "Vegana", label: "Vegana" },
  { value: "Keto", label: "Keto" },
  { value: "Flexible / intuitiva", label: "Flexible / intuitiva" },
];

const OBJECTIVE_OPTIONS: FormOption[] = [
  { value: "Ganar músculo", label: "Ganar músculo" },
  { value: "Perder grasa", label: "Perder grasa" },
  { value: "Rendimiento deportivo", label: "Rendimiento deportivo" },
  { value: "Recomposición corporal", label: "Recomposición corporal" },
  { value: "Salud general", label: "Salud general" },
];

const VISIBLE_STEP_TOTAL = 4;

function arrayValue(value: DynamicAnswerValue | undefined) {
  return Array.isArray(value) ? value : [];
}

function chunkQuestions(section: DynamicSection) {
  const chunks: DynamicQuestion[][] = [];
  for (let index = 0; index < section.questions.length; index += 2) {
    chunks.push(section.questions.slice(index, index + 2));
  }

  return chunks.map((questions, index) => ({
    ...section,
    id: `${section.id}-${index}`,
    title: index === 0 ? section.title : `${section.title} · ${index + 1}`,
    questions,
  }));
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
  const [swapTarget, setSwapTarget] = useState<{ sessionId: string; exerciseId: string } | null>(
    null
  );
  const [selectedSwapAlternative, setSelectedSwapAlternative] = useState("");
  const [isModifyOpen, setIsModifyOpen] = useState(false);
  const [changeRequest, setChangeRequest] = useState("");
  const [visibleDisciplineValues, setVisibleDisciplineValues] = useState<string[]>(
    () => getInitialSportDisciplineOptions().map((option) => option.value)
  );

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

  function updateTrainingDescription(value: string) {
    invalidateAnalysis();
    setProfile((current) => ({
      ...current,
      currentTraining: value,
      currentRoutineText: value,
    }));
  }

  function toggleDiscipline(value: string) {
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

  function removeFile(type: "context" | "visual", target: File) {
    invalidateAnalysis();

    if (type === "context") {
      setContextFiles((current) =>
        current.filter(
          (file) =>
            !(
              file.name === target.name &&
              file.lastModified === target.lastModified &&
              file.size === target.size
            )
        )
      );
      return;
    }

    setVisualFiles((current) =>
      current.filter(
        (file) =>
          !(
            file.name === target.name &&
            file.lastModified === target.lastModified &&
            file.size === target.size
          )
      )
    );
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
      moveTo(4);
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

  const currentMeta = STEP_META[step - 1];
  const visibleStep = Math.min(step, VISIBLE_STEP_TOTAL);
  const personalizedCards = analysis
    ? analysis.personalizedSections.flatMap((section) => chunkQuestions(section))
    : [];
  const visibleDisciplines = getVisibleSportDisciplines(visibleDisciplineValues);
  const nextDisciplineBatch = getNextSportDisciplineBatch(
    profile.disciplines || [],
    visibleDisciplineValues,
    SPORT_DISCIPLINE_BATCH_SIZE
  );
  const canLoadMoreDisciplines = nextDisciplineBatch.length > 0;

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

  useEffect(() => {
    if (!currentSwapExercise) {
      setSelectedSwapAlternative("");
      return;
    }

    if (
      !selectedSwapAlternative ||
      !currentSwapExercise.alternatives.includes(selectedSwapAlternative)
    ) {
      setSelectedSwapAlternative(currentSwapExercise.alternatives[0] || "");
    }
  }, [currentSwapExercise, selectedSwapAlternative]);

  if (routine) {
    const selectedVisual = selectedExercise ? getExerciseVisual(selectedExercise.pattern) : null;
    const currentSwapVisual = currentSwapExercise
      ? getExerciseVisual(currentSwapExercise.pattern)
      : null;

    return (
      <>
        <main className="page-haze min-h-screen pb-12">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
            <Link className="text-slate-950" href="/">
              <BrandMark className="text-2xl font-semibold" />
            </Link>
            <button
              className="ghost-button px-4 py-2 text-sm"
              onClick={() => setRoutine(null)}
              type="button"
            >
              Volver al formulario
            </button>
          </div>

          {errorMessage ? (
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
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
        </main>

        {selectedExercise ? (
          <ModalShell onClose={() => setSelectedExercise(null)} title={selectedExercise.name}>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)]">
              <div className="rounded-[28px] border border-slate-200 bg-[#faf9f4] p-4">
                <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
                  {selectedVisual ? (
                    <Image
                      alt={selectedVisual.alt}
                      className="h-[360px] w-full object-cover"
                      height={1200}
                      src={selectedVisual.src}
                      width={1800}
                    />
                  ) : (
                    <div className="aspect-[1.05/1]">
                      <ExerciseIllustration
                        name={selectedExercise.name}
                        pattern={selectedExercise.pattern}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <DetailBlock title="Cómo hacerlo" value={selectedExercise.notes} />
                <DetailBlock title="Cue principal" value={selectedExercise.cue} />
                <DetailBlock title="Por qué está en la rutina" value={selectedExercise.whyThisExercise} />
                <div>
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
                    Alternativas
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedExercise.alternatives.map((alternative) => (
                      <span
                        className="rounded-full border border-slate-200 bg-[#f7f8fc] px-3 py-2 text-xs font-semibold text-slate-700"
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
          <ModalShell onClose={() => setSwapTarget(null)} title="Cambiar ejercicio">
            <div className="space-y-10">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#424656]">
                  <ArrowLeft className="h-4 w-4 text-[#0050cc]" />
                  <span>Volver a {currentSwapExercise.name}</span>
                </div>
                <p className="max-w-md text-sm leading-7 text-slate-600">
                  Selecciona una alternativa técnica equivalente para mantener la
                  intensidad de tu sesión sin romper la lógica del bloque.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-6">
                  <h2 className="font-display text-xl font-bold uppercase tracking-tight text-[#1b1b1b]/40">
                    Ejercicio actual
                  </h2>
                  <div className="rounded-[2rem] border-l-4 border-[#c2c6d8] bg-[#f4f4f2] p-8">
                    <div className="mb-6 flex items-start justify-between">
                      <div>
                        <h3 className="font-display mb-1 text-2xl font-extrabold text-[#1b1b1b]">
                          {currentSwapExercise.name}
                        </h3>
                        <span className="rounded-full bg-[#dae1ff] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#003fa4]">
                          {currentSwapExercise.category}
                        </span>
                      </div>
                      <Bolt className="h-6 w-6 text-[#595959]" />
                    </div>

                    <div className="mb-6 aspect-video w-full overflow-hidden rounded-xl bg-[#e2e3e1]">
                      {currentSwapVisual ? (
                        <Image
                          alt={currentSwapVisual.alt}
                          className="h-full w-full object-cover grayscale opacity-80"
                          height={960}
                          src={currentSwapVisual.src}
                          width={1280}
                        />
                      ) : (
                        <div className="h-full w-full">
                          <ExerciseIllustration
                            name={currentSwapExercise.name}
                            pattern={currentSwapExercise.pattern}
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-[#424656]">
                        {currentSwapExercise.sets} Series × {currentSwapExercise.reps}
                      </p>
                      <div className="h-1 w-full rounded-full bg-[#e2e3e1]">
                        <div className="h-full w-1/4 rounded-full bg-[#c2c6d8]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="font-display text-xl font-bold uppercase tracking-tight text-[#1b1b1b]">
                    Alternativas sugeridas
                  </h2>
                  <div className="space-y-4">
                    {swapExerciseOptions.map((alternative, index) => {
                      const selected = selectedSwapAlternative === alternative;
                      const difficulty = Math.min(3, (index % 3) + 1);
                      const equivalence = Math.max(82, 95 - index * 6);

                      return (
                        <button
                          className={`group relative w-full rounded-[2rem] p-6 text-left transition-all ${
                            selected
                              ? "border-2 border-[#0050cc] bg-white shadow-[0_20px_40px_-10px_rgba(26,28,27,0.06)]"
                              : "bg-[#f4f4f2] hover:bg-white"
                          }`}
                          key={alternative}
                          onClick={() => setSelectedSwapAlternative(alternative)}
                          type="button"
                        >
                          <div className="mb-4 flex items-center justify-between">
                            <h4 className="font-display text-xl font-bold">{alternative}</h4>
                            {selected ? (
                              <div className="flex items-center gap-2 text-[#0050cc]">
                                <span className="text-xs font-bold uppercase tracking-[0.2em]">
                                  Seleccionado
                                </span>
                                <CheckCircle2 className="h-5 w-5 fill-current" />
                              </div>
                            ) : (
                              <PlusCircle />
                            )}
                          </div>

                          <p className="mb-4 text-sm leading-relaxed text-[#424656]">
                            {buildAlternativeExplanation(
                              currentSwapExercise.name,
                              alternative,
                              index
                            )}
                          </p>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#424656]/60">
                              Dificultad técnica:
                            </span>
                            <div className="flex gap-1">
                              {Array.from({ length: 3 }).map((_, markerIndex) => (
                                <div
                                  className={`h-1 w-3 rounded-full ${
                                    markerIndex < difficulty
                                      ? "bg-[#0050cc]"
                                      : "bg-[#e2e3e1]"
                                  }`}
                                  key={`${alternative}-${markerIndex}`}
                                />
                              ))}
                            </div>
                          </div>

                          {selected ? (
                            <>
                              <div className="mt-6 flex items-center gap-4">
                                <div className="flex -space-x-2">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#dae1ff]">
                                    <Bolt className="h-4 w-4 text-[#003fa4]" />
                                  </div>
                                </div>
                                <span className="text-xs font-semibold text-[#0266ff]">
                                  Equivalencia Metabólica: {equivalence}%
                                </span>
                              </div>
                              <button
                                className="mt-6 w-full rounded-full bg-[linear-gradient(135deg,#0050cc_0%,#0266ff_100%)] py-3 text-xs font-bold uppercase tracking-[0.2em] text-white"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  swapExercise(alternative);
                                }}
                                type="button"
                              >
                                Confirmar selección
                              </button>
                            </>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-6 rounded-[2rem] border-t-2 border-[#0050cc]/10 bg-white p-8">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-[#0050cc]">
                  <Image
                    alt="Avatar del coach"
                    className="h-full w-full object-cover"
                    height={320}
                    src={landingPhotos[0].src}
                    width={320}
                  />
                </div>
                <div>
                  <h5 className="font-display mb-1 text-lg font-bold">Nota del Coach</h5>
                  <p className="italic leading-relaxed text-[#424656]">
                    &quot;Sustituir por {selectedSwapAlternative || swapExerciseOptions[0]} es una
                    opción táctica sólida si quieres mantener el estímulo del día sin
                    pagar más fatiga de la necesaria. Mantén una ejecución limpia y no
                    fuerces la carga si la alternativa te cambia el patrón dominante.&quot;
                  </p>
                </div>
              </div>
            </div>
          </ModalShell>
        ) : null}

        {isModifyOpen ? (
          <ModalShell onClose={() => setIsModifyOpen(false)} title="Modificar rutina">
            <div className="relative space-y-10 overflow-hidden">
              <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#0050cc]/5 blur-3xl" />

              <div className="relative space-y-3">
                <div className="flex items-center gap-2 text-[#0050cc]">
                  <Edit3 className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-[0.22em]">
                    Ajuste Inteligente
                  </span>
                </div>
                <h2 className="font-display text-4xl font-black leading-tight tracking-[-0.05em] text-[#1a1c1b]">
                  ¿Qué deseas modificar?
                </h2>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <label className="mb-3 block text-xs font-bold uppercase tracking-[0.18em] text-[#424656]">
                    Tus ajustes
                  </label>
                  <textarea
                    className="min-h-[160px] w-full resize-none border-0 border-b-2 border-[#c2c6d8] bg-transparent px-0 py-2 text-xl font-medium text-[#1a1c1b] transition-all placeholder:text-[#424656]/30 focus:border-[#0050cc] focus:outline-none focus:ring-0"
                    onChange={(event) => setChangeRequest(event.target.value)}
                    placeholder="Escribe aquí tus ajustes (ej: quiero priorizar hombros o cambiar el día 3 por HIIT)"
                    value={changeRequest}
                  />
                </div>

                <div className="flex items-start gap-4 rounded-xl bg-[#f4f4f2] p-5">
                  <Sparkles className="h-5 w-5 text-[#3e4853]" />
                  <p className="text-sm leading-relaxed text-[#3e4853]">
                    <span className="font-bold">Pro Tip:</span> Puedes ser específico con
                    ejercicios, tiempos de descanso o grupos musculares que quieras
                    enfatizar hoy.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 pt-4 md:flex-row-reverse">
                <button
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#1b1b1b] px-10 py-5 text-lg font-bold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300 md:w-auto"
                  disabled={isRevising || !changeRequest.trim()}
                  onClick={reviseCurrentPlan}
                  type="button"
                >
                  {isRevising ? (
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span>Aplicar cambios</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
                <button
                  className="w-full px-10 py-5 text-lg font-semibold text-[#424656] transition-colors hover:text-[#1a1c1b] md:w-auto"
                  onClick={() => setIsModifyOpen(false)}
                  type="button"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </ModalShell>
        ) : null}
      </>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--form-bg)] pb-12">
      <FormTopBar closeHref="/" />

      <section className="mx-auto w-full max-w-3xl px-6 pb-20 pt-12 sm:px-8">
        {errorMessage ? (
          <div className="form-ui-panel mb-8 border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <section>
          <FormProgress
            step={visibleStep}
            title={currentMeta.title}
            totalSteps={VISIBLE_STEP_TOTAL}
          />

          <div className="space-y-12">
            {step === 1 ? (
              <div className="space-y-10">
                <FormSection label="Género">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {SEX_OPTIONS.map((option) => (
                      <FormPillButton
                        active={profile.sex === option}
                        key={option}
                        onClick={() => updateProfile("sex", option)}
                      >
                        {option}
                      </FormPillButton>
                    ))}
                  </div>
                </FormSection>

                <div className="grid gap-8 md:grid-cols-3">
                  <FormLineInput
                    inputMode="numeric"
                    label="Altura (cm)"
                    onChange={(value) => updateProfile("height", value)}
                    placeholder="180"
                    value={profile.height || ""}
                  />
                  <FormLineInput
                    inputMode="decimal"
                    label="Peso (kg)"
                    onChange={(value) => updateProfile("weight", value)}
                    placeholder="75"
                    value={profile.weight || ""}
                  />
                  <FormLineInput
                    inputMode="numeric"
                    label="Años entrenando"
                    onChange={(value) => updateProfile("yearsTraining", value)}
                    placeholder="2"
                    value={profile.yearsTraining || ""}
                  />
                </div>

                <div className="space-y-8">
                  <FormLineSelect
                    label="Dieta"
                    onChange={(value) => updateProfile("diet", value)}
                    options={DIET_OPTIONS}
                    placeholder="Selecciona tu preferencia"
                    value={profile.diet || ""}
                  />
                  <FormLineSelect
                    label="Objetivo principal"
                    onChange={(value) => updateProfile("objective", value)}
                    options={OBJECTIVE_OPTIONS}
                    placeholder="¿Qué quieres lograr?"
                    value={profile.objective || ""}
                  />
                </div>

                <FormSection label="Disciplinas deportivas">
                  <div className="flex flex-wrap gap-3">
                    {visibleDisciplines.map((option) => {
                      const selected = profile.disciplines?.includes(option.value) || false;
                      return (
                        <FormChipButton
                          active={selected}
                          key={option.value}
                          onClick={() => toggleDiscipline(option.value)}
                        >
                          {option.label}
                        </FormChipButton>
                      );
                    })}
                    {canLoadMoreDisciplines ? (
                      <button
                        aria-label="Mostrar 7 disciplinas más"
                        className="form-ui-chip h-11 w-11 bg-transparent text-[var(--form-ink)]"
                        onClick={() =>
                          setVisibleDisciplineValues((current) => [
                            ...current,
                            ...nextDisciplineBatch.map((option) => option.value),
                          ])
                        }
                        type="button"
                      >
                        <Plus className="h-4 w-4" strokeWidth={2.2} />
                      </button>
                    ) : null}
                  </div>
                </FormSection>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="mx-auto max-w-xl space-y-12">
                <section className="space-y-4">
                  <label className="form-ui-label block pl-1">
                    Descripción del entrenamiento
                  </label>
                  <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_40px_-10px_rgba(26,28,27,0.06)] ring-1 ring-transparent transition-all focus-within:ring-2 focus-within:ring-[rgba(0,80,204,0.12)]">
                    <textarea
                      className="min-h-[240px] w-full resize-none border-0 bg-transparent px-6 py-6 font-display text-sm font-semibold text-[var(--form-ink)] outline-none placeholder:text-[rgba(114,118,135,0.45)]"
                      onChange={(event) => updateTrainingDescription(event.target.value)}
                      placeholder="Pega aquí tu rutina actual o describe cómo entrenas hoy (ej: 4 días de fuerza, foco en tren inferior...)"
                      value={profile.currentRoutineText || profile.currentTraining || ""}
                    />
                  </div>
                  <p className="pl-1 text-[11px] font-medium italic leading-relaxed text-[var(--form-muted)]/80">
                    Este paso es opcional pero nos ayuda a entender tu punto de partida.
                  </p>
                </section>

                <section className="space-y-4">
                  <label className="form-ui-label block pl-1">Documentos adjuntos</label>
                  <FormUploadTile
                    accept=".pdf,.xls,.xlsx,.txt,.csv,.md,.doc,.docx"
                    files={contextFiles}
                    formatHint="PDF, XLS, XLSX, CSV, TXT, MD, DOC, DOCX"
                    onChange={(event) => updateFiles("context", event)}
                    onRemoveFile={(file) => removeFile("context", file)}
                    subtitle="Sube tu rutina actual o documentación de contexto."
                    title="Sube tu rutina actual"
                  />
                </section>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="mx-auto max-w-xl space-y-10">
                <article className="form-ui-panel px-8 py-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                  <div className="mb-8 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--form-accent)]">
                    <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[rgba(0,80,204,0.16)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--form-accent)]" />
                    </span>
                    Guía de captura técnica
                  </div>
                  <div className="space-y-8">
                    {[
                      "Iluminación frontal clara, evita sombras duras sobre el torso.",
                      "Cuerpo completo visible desde los pies hasta la cabeza.",
                      "Ángulos clave: frente, perfil izquierdo/derecho y espalda.",
                    ].map((item, index) => (
                      <div className="flex items-start gap-6" key={item}>
                        <span className="font-display text-3xl font-black text-[rgba(114,118,135,0.22)]">
                          {String(index + 1).padStart(2, "0")}.
                        </span>
                        <p className="pt-1 text-base font-medium leading-tight text-[var(--form-ink)]">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>

                <div className="space-y-6">
                  <FormUploadTile
                    accept=".jpg,.jpeg,.png,.webp,.heic,.heif,.bmp,.gif,.mp4,.mov,.webm,.m4v,.avi,.mkv"
                    files={visualFiles}
                    formatHint="JPG, JPEG, PNG, WEBP, HEIC, HEIF, BMP, GIF, MP4, MOV, WEBM, M4V, AVI, MKV"
                    onChange={(event) => updateFiles("visual", event)}
                    onRemoveFile={(file) => removeFile("visual", file)}
                    subtitle="Video máx 30s o hasta 10 imágenes (JPG, PNG)"
                    title="Subir Video o Fotos"
                  />
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-10">
                <FormStepIntro
                  eyebrow="Preguntas dinámicas"
                  text="Cada bloque contiene preguntas que sí cambian la estructura, el volumen o la selección de ejercicios."
                  title="El formulario ya está ajustado al caso."
                />

                {analysis ? (
                  <>
                    {analysis.signalSummary.length ? (
                      <FormSection label="Señales detectadas">
                        <div className="flex flex-wrap gap-3">
                          {analysis.signalSummary.map((signal) => (
                            <span
                              className="form-ui-chip min-h-10 px-4 text-sm"
                              key={signal}
                            >
                              {signal}
                            </span>
                          ))}
                        </div>
                      </FormSection>
                    ) : null}

                    <div className="grid gap-4">
                      {personalizedCards.map((section) => (
                        <DynamicSectionCard
                          answers={answers}
                          key={section.id}
                          onAnswer={updateAnswer}
                          section={section}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <LoaderBlock />
                )}
              </div>
            ) : null}

            {step === 5 ? (
              <div className="space-y-10">
                <FormStepIntro
                  eyebrow="Cierre logístico"
                  text="Estas decisiones terminan de definir adherencia, densidad de las sesiones y selección final de ejercicios."
                  title="Ajustamos tiempo real, frecuencia y material."
                />

                <FormSection
                  description="Escoge la frecuencia que tendría sentido para este bloque."
                  label="Días por semana"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {["3", "4", "5", "6", "Auto"].map((value) => (
                      <FormChoiceCard
                        active={profile.daysPerWeek === (value === "Auto" ? "" : value)}
                        key={value}
                        label={value === "Auto" ? "Auto" : `${value} días`}
                        onClick={() => updateProfile("daysPerWeek", value === "Auto" ? "" : value)}
                        sublabel={value === "Auto" ? "Decidir más tarde" : "Sesiones por semana"}
                      />
                    ))}
                  </div>
                </FormSection>

                <FormSection
                  description="Importa para repartir patrones, descansos y número de ejercicios."
                  label="Duración preferida"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    {["45-60", "60-75", "75-90", "90+"].map((value) => (
                      <FormChoiceCard
                        active={profile.sessionLength === value}
                        key={value}
                        label={`${value} min`}
                        onClick={() => updateProfile("sessionLength", value)}
                        sublabel="Rango objetivo"
                      />
                    ))}
                  </div>
                </FormSection>

                <FormSection
                  description="Máquinas, racks, ergs o marcas concretas cambian bastante la selección."
                  label="Material disponible"
                >
                  <FormTextArea
                    label="Equipamiento"
                    onChange={(value) => updateProfile("equipment", value)}
                    placeholder="Technogym, Hammer, gym80, ergs, racks, mancuernas..."
                    rows={4}
                    value={profile.equipment || ""}
                  />
                </FormSection>

                <FormSection
                  description="Molestias, zonas a vigilar o patrones que prefieres evitar."
                  label="Limitaciones"
                >
                  <FormTextArea
                    label="Notas"
                    onChange={(value) => updateProfile("limitationNotes", value)}
                    placeholder="Hombro en press plano, ciática, rodilla, poca tolerancia al impacto..."
                    rows={4}
                    value={profile.limitationNotes || ""}
                  />
                </FormSection>
              </div>
            ) : null}

            {step === 6 ? (
              <div className="space-y-10">
                <FormStepIntro
                  eyebrow="Listo para generar"
                  text="En el siguiente paso MyCoach genera la rutina final, abre el workspace editable y deja el bloque listo para exportar."
                  title="Todo el contexto está preparado."
                />

                <FormQuestionCard
                  description="Este es el resumen del contexto con el que se va a construir el mesociclo."
                  title="Resultado esperado"
                >
                  <div className="font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--form-ink)]">
                    Rutina editable y exportable
                  </div>
                  <div className="grid gap-3 text-sm leading-7 text-[var(--form-muted)] md:grid-cols-2">
                    <div>Contexto: {profile.currentRoutineText?.trim() ? "Texto o rutina añadida" : "Sin texto específico"}</div>
                    <div>Archivos: {contextFiles.length} adjuntos</div>
                    <div>Visual: {visualFiles.length ? `${visualFiles.length} recursos visuales` : "Sin adjuntos visuales"}</div>
                    <div>Formulario: {Object.values(answers).filter(Boolean).length} respuestas guardadas</div>
                    <div>Objetivo: {profile.objective || "No indicado"}</div>
                    <div>Disciplinas: {(profile.disciplines || []).map(labelForDiscipline).join(", ") || "No indicadas"}</div>
                    <div>Material: {profile.equipment || "No indicado"}</div>
                    <div>Frecuencia: {profile.daysPerWeek || "Auto"} días</div>
                    <div>Duración: {profile.sessionLength || "Auto"} min</div>
                    <div>Altura / peso: {[profile.height, profile.weight].filter(Boolean).join(" · ") || "No indicado"}</div>
                  </div>
                </FormQuestionCard>
              </div>
            ) : null}
          </div>

          <FormFooter
            backLabel={step > 1 ? "Paso anterior" : undefined}
            nextDisabled={isAnalyzing || isGenerating}
            nextIcon={
              isAnalyzing || isGenerating ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : undefined
            }
            nextLabel={getNextLabel(step, isAnalyzing, isGenerating)}
            onBack={step > 1 ? () => moveTo(Math.max(1, step - 1)) : undefined}
            onNext={() => {
              if (step === 1) {
                moveTo(2);
                return;
              }

              if (step === 2) {
                moveTo(3);
                return;
              }

              if (step === 3) {
                void personalizeForm();
                return;
              }

              if (step === 4) {
                moveTo(5);
                return;
              }

              if (step === 5) {
                moveTo(6);
                return;
              }

              void generatePlan();
            }}
          />
        </section>
      </section>

      {isAnalyzing || isGenerating ? (
        <LoaderOverlay
          title={isAnalyzing ? "Personalizando el formulario" : "Generando tu mesociclo"}
          text={
            isAnalyzing
              ? "MyCoach está revisando contexto y material opcional para decidir qué preguntas merece la pena hacer."
              : "MyCoach está construyendo la rutina final con toda la información guardada."
          }
        />
      ) : null}
    </main>
  );
}

function getNextLabel(step: number, isAnalyzing: boolean, isGenerating: boolean) {
  if (step === 3) {
    return isAnalyzing ? "Personalizando..." : "Personalizar formulario";
  }

  if (step === 6) {
    return isGenerating ? "Generando..." : "Generar rutina";
  }

  return "Continuar";
}

function labelForDiscipline(value: string) {
  return getSportDisciplineLabel(value);
}

function LoaderBlock() {
  return (
    <div className="form-ui-panel p-6">
      <div className="flex items-center gap-3">
        <LoaderCircle className="h-5 w-5 animate-spin text-[var(--primary)]" />
        <span className="text-sm font-semibold text-[var(--form-muted)]">
          Cargando formulario personalizado...
        </span>
      </div>
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
    <FormQuestionCard description={section.description} title={section.title}>
      <div className="grid gap-5">
        {section.questions.map((question) => (
          <QuestionField
            answer={answers[question.id]}
            key={question.id}
            onAnswer={onAnswer}
            question={question}
          />
        ))}
      </div>
    </FormQuestionCard>
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
      <div className="space-y-3">
        <p className="text-sm leading-7 text-[var(--form-muted)]">{question.help}</p>
        {question.type === "textarea" ? (
          <FormTextArea
            label={question.label}
            onChange={(value) => onAnswer(question.id, value)}
            placeholder={question.placeholder}
            rows={5}
            value={typeof answer === "string" ? answer : ""}
          />
        ) : (
          <FormLineInput
            label={question.label}
            onChange={(value) => onAnswer(question.id, value)}
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
      <div className="form-ui-panel bg-[rgba(244,244,242,0.72)] p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="form-ui-label">{question.label}</div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--form-accent)]">
            {currentValue}
          </span>
        </div>
        <p className="mb-4 text-sm leading-7 text-[var(--form-muted)]">{question.help}</p>
        <input
          className="slider-accent h-2 w-full appearance-none rounded-full bg-[rgba(66,108,255,0.16)]"
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
      <div className="space-y-4">
        <div>
          <div className="form-ui-label">{question.label}</div>
          <p className="mt-2 text-sm leading-7 text-[var(--form-muted)]">{question.help}</p>
        </div>
        <div className="grid gap-3">
          {question.options?.map((option) => {
            const selected = answer === option.value;

            return (
              <FormChoiceCard
                active={selected}
                key={option.value}
                onClick={() => onAnswer(question.id, option.value)}
                label={option.label}
                sublabel={option.description}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="form-ui-label">{question.label}</div>
        <p className="mt-2 text-sm leading-7 text-[var(--form-muted)]">{question.help}</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {question.options?.map((option) => {
          const values = arrayValue(answer);
          const selected = values.includes(option.value);

          return (
            <FormChipButton
              active={selected}
              key={option.value}
              onClick={() => {
                const next = selected
                  ? values.filter((value) => value !== option.value)
                  : [...values, option.value];
                onAnswer(question.id, next);
              }}
            >
              {option.label}
            </FormChipButton>
          );
        })}
      </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/48 px-4 py-8 backdrop-blur-md">
      <div className="max-h-full w-full max-w-5xl overflow-auto rounded-[38px] border border-white/70 bg-[#fcfbf8] p-6 shadow-[0_48px_140px_-70px_rgba(18,25,45,0.48)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <BrandMark className="text-sm font-black text-slate-500" />
            <h3 className="mt-2 font-display text-2xl font-semibold tracking-tight text-slate-950">
              {title}
            </h3>
          </div>
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-[rgba(66,108,255,0.3)]"
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

function DetailBlock({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
      <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
        {title}
      </div>
      <p className="text-sm leading-7 text-slate-700">{value}</p>
    </div>
  );
}

function LoaderOverlay({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#f9f9f7] px-6 text-[#1a1c1b]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-1/4 -top-1/4 h-[800px] w-[800px] rounded-full bg-[#0050cc]/5 blur-[120px]" />
        <div className="absolute -bottom-1/4 -left-1/4 h-[600px] w-[600px] rounded-full bg-[#0266ff]/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#0050cc 0.5px, transparent 0.5px)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
        <div className="animate-pulse-soft mb-20">
          <BrandMark className="text-5xl font-black text-[#1b1b1b]" />
        </div>

        <div className="w-full max-w-2xl">
          <div className="rounded-[2rem] bg-[#f4f4f2] p-12 backdrop-blur-sm">
            <div className="mb-8 flex items-end justify-between">
              <div className="flex flex-col">
                <span className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#0050cc]">
                  Motor de Análisis
                </span>
                <h1 className="font-display text-5xl font-extrabold leading-none tracking-[-0.05em]">
                  Generando<span className="text-[#0050cc]">.</span>
                </h1>
              </div>
              <div className="text-right">
                <span className="font-display text-6xl font-black leading-none text-[#1a1c1b]/10">
                  01
                </span>
              </div>
            </div>

            <div className="mb-12 space-y-6">
              <div className="group flex items-center gap-4">
                <div className="h-2 w-2 rounded-full bg-[#0050cc] ring-4 ring-[#0050cc]/20" />
                <p className="text-lg font-medium text-[#1a1c1b]">{title}...</p>
              </div>
              <div className="ml-8 flex items-center gap-4 opacity-40">
                <div className="h-1.5 w-1.5 rounded-full bg-[#727687]" />
                <p className="text-lg font-medium text-[#1a1c1b]">
                  Generando tu mesociclo...
                </p>
              </div>
              <div className="ml-16 flex items-center gap-4 opacity-40">
                <div className="h-1.5 w-1.5 rounded-full bg-[#727687]" />
                <p className="text-lg font-medium text-[#1a1c1b]">
                  Organizando prioridades, frecuencia y progresión
                </p>
              </div>
            </div>

            <div className="loading-shimmer relative h-[4px] w-full overflow-hidden rounded-full bg-[#e2e3e1]">
              <div className="absolute left-0 top-0 h-full w-[40%] bg-[#0050cc] transition-all duration-1000 ease-out" />
            </div>

            <div className="mt-4 flex justify-between">
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#727687]">
                Optimización Biomecánica
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#727687]">
                v2.4.0
              </span>
            </div>
          </div>

          <div className="mt-16 ml-auto max-w-sm text-right opacity-60">
            <p className="text-sm italic leading-relaxed text-[#424656]">
              &quot;La excelencia no es un acto, es un hábito. Estamos calibrando
              cada repetición para que tu hábito sea la victoria.&quot;
            </p>
          </div>
          <p className="sr-only">{text}</p>
        </div>
      </div>
    </div>
  );
}

function buildAlternativeExplanation(
  currentExercise: string,
  alternative: string,
  index: number
) {
  const patterns = [
    `Mantiene el hueco de ${currentExercise} con una ejecución más estable y un estímulo fácil de medir.`,
    `Reduce el coste técnico respecto a ${currentExercise} y permite seguir apretando sin romper la sesión.`,
    `Aporta una variante útil para mantener intensidad local, repartir fatiga y sostener la progresión del bloque.`,
  ];

  return `${alternative}. ${patterns[index % patterns.length]}`;
}
