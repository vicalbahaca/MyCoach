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
  BrainCircuit,
  Bolt,
  CheckCircle2,
  ClipboardList,
  FileText,
  ImageUp,
  Info,
  LoaderCircle,
  MessageCircle,
  Plus,
  PlusCircle,
  SendHorizontal,
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
    title: "Rutina",
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
const AGENT_MESSAGE_LIMIT = 10;

type AgentMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

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
  const [isDocsTooltipOpen, setIsDocsTooltipOpen] = useState(false);
  const [isAgentOpen, setIsAgentOpen] = useState(false);
  const [agentInput, setAgentInput] = useState("");
  const [agentCreditsUsed, setAgentCreditsUsed] = useState(0);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([
    {
      id: "agent-welcome",
      role: "assistant",
      content:
        "Soy el agente de personalización. Dime qué quieres ajustar de la rutina y te propondré cambios concretos o te pediré la información mínima que falte.",
    },
  ]);
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

  function isStepOneComplete() {
    return Boolean(
      profile.sex &&
        profile.height?.trim() &&
        profile.weight?.trim() &&
        profile.yearsTraining?.trim() &&
        profile.diet?.trim() &&
        profile.objective?.trim() &&
        profile.disciplines?.length
    );
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
      const response = await fetch("/api/routine/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          analysis,
          answers,
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo generar la rutina.");
      }

      const data = (await response.json()) as { routine: RoutinePlan };
      setRoutine(data.routine);
      setRotationIndex(0);
      setIsAgentOpen(false);
      setAgentInput("");
      setAgentCreditsUsed(0);
      setAgentMessages([
        {
          id: "agent-welcome",
          role: "assistant",
          content:
            "Soy el agente de personalización. Dime qué quieres ajustar de la rutina y te propondré cambios concretos o te pediré la información mínima que falte.",
        },
      ]);
    } catch {
      setErrorMessage("No se pudo generar la rutina. Vuelve a intentarlo.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function reviseCurrentPlan(changeRequest: string) {
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
        throw new Error("No se pudo modificar la rutina.");
      }

      const data = (await response.json()) as {
        routine?: RoutinePlan;
        assistantMessage: string;
        requiresClarification?: boolean;
      };

      if (data.routine) {
        setRoutine(data.routine);
      }

      setAgentMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.assistantMessage,
        },
      ]);
    } catch {
      setErrorMessage("No se pudo modificar la rutina. Vuelve a intentarlo.");
      setAgentMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content:
            "No he podido aplicar cambios ahora mismo. Revisa la petición o vuelve a intentarlo en unos segundos.",
        },
      ]);
    } finally {
      setIsRevising(false);
    }
  }

  async function submitAgentMessage() {
    const nextMessage = agentInput.trim();

    if (!nextMessage || !routine || agentCreditsUsed >= AGENT_MESSAGE_LIMIT || isRevising) {
      return;
    }

    setAgentMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content: nextMessage,
      },
    ]);
    setAgentInput("");
    setAgentCreditsUsed((current) => current + 1);
    await reviseCurrentPlan(nextMessage);
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

  const activeSwapAlternative =
    currentSwapExercise &&
    selectedSwapAlternative &&
    currentSwapExercise.alternatives.includes(selectedSwapAlternative)
      ? selectedSwapAlternative
      : currentSwapExercise?.alternatives[0] || "";

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
              onClick={() => {
                setRoutine(null);
                setAgentInput("");
                setIsAgentOpen(false);
              }}
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
            onOpenSwap={(sessionId, exerciseId) => setSwapTarget({ sessionId, exerciseId })}
            onRotationChange={setRotationIndex}
            rotationIndex={rotationIndex}
            routine={routine}
          />

          <AgentChatDrawer
            creditsUsed={agentCreditsUsed}
            inputValue={agentInput}
            isOpen={isAgentOpen}
            isSending={isRevising}
            messages={agentMessages}
            onChangeInput={setAgentInput}
            onOpenChange={setIsAgentOpen}
            onSubmit={submitAgentMessage}
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
                      const selected = activeSwapAlternative === alternative;
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
                    &quot;Sustituir por {activeSwapAlternative || swapExerciseOptions[0]} es una
                    opción táctica sólida si quieres mantener el estímulo del día sin
                    pagar más fatiga de la necesaria. Mantén una ejecución limpia y no
                    fuerces la carga si la alternativa te cambia el patrón dominante.&quot;
                  </p>
                </div>
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

          {step === 2 ? (
            <p className="mb-10 max-w-3xl text-base leading-8 text-[var(--form-muted)]">
              Este paso es opcional. Si compartes una breve descripción de cómo estás
              entrenando ahora o adjuntas tu rutina más reciente, podremos entender mejor
              tu punto de partida y el tipo de bloque desde el que vienes.
            </p>
          ) : null}

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

                <FormSection label="Disciplinas deportivas · Seleccionar al menos una">
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
              <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <section className="space-y-4">
                  <label className="form-ui-label block pl-1">
                    Descripción del entrenamiento (Opcional)
                  </label>
                  <div className="overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_40px_-10px_rgba(26,28,27,0.06)] ring-1 ring-transparent transition-all focus-within:ring-2 focus-within:ring-[rgba(0,80,204,0.12)]">
                    <textarea
                      className="min-h-[320px] w-full resize-none border-0 bg-transparent px-6 py-6 text-[15px] font-medium leading-7 text-[var(--form-ink)] outline-none placeholder:font-medium placeholder:text-[rgba(114,118,135,0.55)]"
                      onChange={(event) => updateTrainingDescription(event.target.value)}
                      placeholder="Pega aquí tu rutina actual o describe cómo entrenas hoy (ej: 4 días de fuerza, foco en tren inferior...)"
                      value={profile.currentRoutineText || profile.currentTraining || ""}
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex items-center gap-3 pl-1">
                    <label className="form-ui-label block">Documentos adjuntos</label>
                    <div className="relative">
                      <button
                        aria-expanded={isDocsTooltipOpen}
                        aria-label="Información sobre documentos adjuntos"
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--form-outline)] bg-white text-[var(--form-muted)] transition hover:border-[var(--form-accent)] hover:text-[var(--form-accent)]"
                        onBlur={() => setIsDocsTooltipOpen(false)}
                        onClick={() => setIsDocsTooltipOpen((current) => !current)}
                        type="button"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                      <div
                        className={`absolute left-0 top-full z-20 mt-3 w-[280px] rounded-[1.25rem] border border-slate-200 bg-white p-4 text-sm leading-6 text-[#424656] shadow-[0_20px_40px_-18px_rgba(26,28,27,0.22)] ${
                          isDocsTooltipOpen ? "block" : "hidden"
                        }`}
                      >
                        Lo más útil es subir la rutina que hayas seguido durante las
                        últimas semanas, o el último documento real con el que hayas
                        entrenado. Así entendemos mejor volumen, frecuencia y estructura.
                      </div>
                    </div>
                  </div>
                  <FormUploadTile
                    accept=".pdf,.xls,.csv,.txt,.doc"
                    files={contextFiles}
                    formatHint="Formatos admitidos: PDF, XLS, CSV, TXT, DOC"
                    onChange={(event) => updateFiles("context", event)}
                    onRemoveFile={(file) => removeFile("context", file)}
                    subtitle="Añade tu rutina reciente o cualquier archivo que ayude a entender cómo vienes entrenando."
                    title="Sube tu rutina actual"
                  />
                </section>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="mx-auto max-w-5xl">
                <article className="form-ui-panel grid gap-10 px-8 py-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
                  <div className="space-y-8">
                    <div className="mb-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--form-accent)]">
                      <span className="inline-flex h-8 w-8 items-center justify-center">
                        <svg
                          aria-hidden="true"
                          className="h-7 w-7"
                          fill="none"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            clipRule="evenodd"
                            d="M10.0512 15.75L9.51642 14.2768L9.18821 14.0137C8.15637 13.1865 7.5 11.9204 7.5 10.5C7.5 8.01472 9.51472 6 12 6C14.4853 6 16.5 8.01472 16.5 10.5C16.5 11.9204 15.8436 13.1865 14.8118 14.0137L14.4836 14.2768L13.9488 15.75H10.0512ZM9 17.25H15L15.75 15.184C17.1217 14.0844 18 12.3948 18 10.5C18 7.18629 15.3137 4.5 12 4.5C8.68629 4.5 6 7.18629 6 10.5C6 12.3948 6.87831 14.0844 8.25 15.184L9 17.25ZM14.25 19.5V18H9.75V19.5H14.25Z"
                            fill="#080341"
                            fillRule="evenodd"
                          />
                        </svg>
                      </span>
                      Guía del contenido para el análisis
                    </div>

                    <p className="max-w-xl text-[15px] leading-7 text-[var(--form-muted)]">
                      A continuación te mostramos algunas recomendaciones para que el
                      material que subas nos permita revisar tu físico con más claridad y
                      sacar mejores conclusiones del análisis.
                    </p>

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
                  </div>

                  <div className="space-y-4">
                    <label className="form-ui-label block pl-1">Archivos para el análisis</label>
                    <FormUploadTile
                      accept=".jpg,.jpeg,.png,.heic,.mp4,.mov,.avi"
                      files={visualFiles}
                      formatHint="Formatos admitidos: JPG, JPEG, PNG, HEIC, MP4, MOV, AVI"
                      onChange={(event) => updateFiles("visual", event)}
                      onRemoveFile={(file) => removeFile("visual", file)}
                      subtitle="Sube hasta 10 imágenes o un vídeo corto para revisar tu punto de partida."
                      title="Subir Video o Fotos"
                    />
                  </div>
                </article>
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
                if (!isStepOneComplete()) {
                  setErrorMessage(
                    "Completa todos los campos del paso 1 y selecciona al menos una disciplina deportiva."
                  );
                  return;
                }

                setErrorMessage("");
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

      {isAnalyzing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f9f9f7]/78 px-6 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/92 p-8 shadow-[0_30px_80px_-30px_rgba(18,25,45,0.32)]">
            <div className="mb-4 flex items-center gap-3 text-[#0050cc]">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-[0.22em]">
                Analizando contexto
              </span>
            </div>
            <h3 className="font-display text-3xl font-black tracking-[-0.04em] text-[#1a1c1b]">
              Personalizando el formulario
            </h3>
            <p className="mt-4 text-base leading-8 text-[#424656]">
              Estamos revisando tu contexto y el material visual para construir las
              preguntas que realmente merecen la pena en tu caso.
            </p>
          </div>
        </div>
      ) : null}

      {isGenerating ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#f9f9f7]/78 px-6 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/92 p-8 shadow-[0_30px_80px_-30px_rgba(18,25,45,0.32)]">
            <div className="mb-4 flex items-center gap-3 text-[#0050cc]">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              <span className="text-xs font-bold uppercase tracking-[0.22em]">
                Generando rutina
              </span>
            </div>
            <h3 className="font-display text-3xl font-black tracking-[-0.04em] text-[#1a1c1b]">
              Construyendo tu mesociclo
            </h3>
            <p className="mt-4 text-base leading-8 text-[#424656]">
              Estamos cruzando tu contexto, el análisis visual y las respuestas del
              formulario para devolverte una rutina editable con lógica real de progresión.
            </p>
          </div>
        </div>
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

function AgentChatDrawer({
  isOpen,
  onOpenChange,
  messages,
  creditsUsed,
  inputValue,
  onChangeInput,
  onSubmit,
  isSending,
}: {
  isOpen: boolean;
  onOpenChange: (next: boolean) => void;
  messages: AgentMessage[];
  creditsUsed: number;
  inputValue: string;
  onChangeInput: (value: string) => void;
  onSubmit: () => void;
  isSending: boolean;
}) {
  const creditsLeft = Math.max(0, AGENT_MESSAGE_LIMIT - creditsUsed);

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {isOpen ? (
        <div className="w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-[2rem] border border-white/70 bg-[#fcfbf8]/96 shadow-[0_34px_100px_-42px_rgba(18,25,45,0.48)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4 border-b border-slate-200/60 px-5 py-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0050cc]">
                Agente MyCoach
              </p>
              <h3 className="mt-1 font-display text-xl font-black tracking-[-0.04em] text-[#1a1c1b]">
                Ajusta la rutina desde el chat
              </h3>
            </div>
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-[rgba(66,108,255,0.3)]"
              onClick={() => onOpenChange(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center justify-between border-b border-slate-200/50 px-5 py-3 text-xs font-semibold text-[#727687]">
            <span>{creditsLeft} de {AGENT_MESSAGE_LIMIT} mensajes disponibles</span>
            <span>{isSending ? "Aplicando cambios..." : "Rutina editable"}</span>
          </div>

          <div className="max-h-[420px] space-y-4 overflow-y-auto px-5 py-5">
            {messages.map((message) => (
              <div
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                key={message.id}
              >
                <div
                  className={`max-w-[88%] rounded-[1.5rem] px-4 py-3 text-sm leading-7 ${
                    message.role === "user"
                      ? "bg-[#1b1b1b] text-white"
                      : "bg-[#f4f4f2] text-[#1a1c1b]"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200/60 px-5 py-4">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-3">
              <textarea
                className="min-h-[92px] w-full resize-none border-0 bg-transparent text-sm leading-7 text-[#1a1c1b] outline-none placeholder:text-[#727687]"
                disabled={creditsLeft === 0 || isSending}
                onChange={(event) => onChangeInput(event.target.value)}
                placeholder={
                  creditsLeft === 0
                    ? "Has agotado los mensajes de esta sesión."
                    : "Cuéntame qué quieres modificar de la rutina y lo ajusto directamente o te pediré el dato mínimo que falte."
                }
                value={inputValue}
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-xs leading-5 text-[#727687]">
                  Sé concreto con ejercicios, prioridades, molestias, volumen, frecuencia o fatiga.
                </p>
                <button
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#1b1b1b] text-white transition hover:bg-[#2a2a2a] disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={!inputValue.trim() || creditsLeft === 0 || isSending}
                  onClick={onSubmit}
                  type="button"
                >
                  {isSending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <SendHorizontal className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
          className="flex items-center gap-3 rounded-full bg-[#1b1b1b] px-5 py-4 text-sm font-bold text-white shadow-[0_24px_60px_-32px_rgba(18,18,18,0.7)] transition hover:bg-[#2a2a2a]"
          onClick={() => onOpenChange(true)}
          type="button"
        >
          <MessageCircle className="h-4 w-4" />
          Abrir agente
        </button>
      )}
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
