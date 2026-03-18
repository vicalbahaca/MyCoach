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
  CheckCircle2,
  ClipboardList,
  FileText,
  ImageUp,
  LoaderCircle,
  ScanEye,
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
import {
  editorialMockups,
  generatedVisuals,
  getExerciseVisual,
  landingPhotos,
} from "@/lib/visual-assets";

const STEP_META = [
  {
    id: 1,
    title: "Perfil y contexto",
    blurb: "Base del caso, rutina actual y datos útiles para arrancar con criterio.",
    icon: ClipboardList,
  },
  {
    id: 2,
    title: "Visual opcional",
    blurb: "Lectura del físico para personalizar prioridades y detectar sesgos del bloque.",
    icon: ImageUp,
  },
  {
    id: 3,
    title: "Formulario dinámico",
    blurb: "Preguntas adaptadas al caso. Nada de pedir lo mismo a todos.",
    icon: BrainCircuit,
  },
  {
    id: 4,
    title: "Preferencias del bloque",
    blurb: "Logística, tiempo real, frecuencia y material disponible.",
    icon: Target,
  },
  {
    id: 5,
    title: "Confirmar y generar",
    blurb: "Resumen final antes de lanzar la rutina editable y exportable.",
    icon: Sparkles,
  },
] as const;

const DISCIPLINE_OPTIONS = [
  { value: "bodybuilding", label: "Musculación" },
  { value: "hyrox", label: "Hyrox" },
  { value: "crossfit", label: "CrossFit" },
  { value: "strength", label: "Pesas / fuerza" },
  { value: "recomposition", label: "Recomposición" },
] as const;

function optionalLabel() {
  return <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Opcional</span>;
}

function fieldClassName() {
  return "w-full rounded-[24px] border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[rgba(66,108,255,0.35)] focus:ring-4 focus:ring-[rgba(66,108,255,0.08)]";
}

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

  const currentMeta = STEP_META[step - 1];
  const progressWidth = `${(step / STEP_META.length) * 100}%`;
  const personalizedCards = analysis
    ? analysis.personalizedSections.flatMap((section) => chunkQuestions(section))
    : [];

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
    const selectedVisual = selectedExercise ? getExerciseVisual(selectedExercise.pattern) : null;

    return (
      <>
        <main className="page-haze min-h-screen pb-12">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
            <Link className="font-display text-2xl font-semibold tracking-tight text-slate-950" href="/">
              MyCoach
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
          <ModalShell onClose={() => setSwapTarget(null)} title={`Cambiar ${currentSwapExercise.name}`}>
            <div className="space-y-4">
              <p className="text-sm leading-7 text-slate-600">
                Selecciona una alternativa para mantener el mismo hueco dentro del bloque
                sin rehacer toda la sesión.
              </p>
              <div className="grid gap-3">
                {swapExerciseOptions.map((alternative) => (
                  <button
                    className="rounded-[24px] border border-slate-200 bg-[#fafaf8] px-4 py-4 text-left transition hover:border-[rgba(66,108,255,0.28)] hover:bg-white"
                    key={alternative}
                    onClick={() => swapExercise(alternative)}
                    type="button"
                  >
                    <div className="font-semibold text-slate-900">{alternative}</div>
                    <div className="mt-1 text-sm leading-6 text-slate-500">
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
                Escribe qué quieres cambiar. Cuanto más concreto seas, más fino quedará
                el reajuste.
              </p>
              <textarea
                className={`${fieldClassName()} min-h-36 resize-none`}
                onChange={(event) => setChangeRequest(event.target.value)}
                placeholder="Ej: baja a 4 días, más prioridad a dorsal y tríceps, menos bisagra y sesiones de 75 min."
                value={changeRequest}
              />
              <div className="flex justify-end gap-3">
                <button
                  className="ghost-button px-4 py-3 text-sm"
                  onClick={() => setIsModifyOpen(false)}
                  type="button"
                >
                  Cerrar
                </button>
                <button
                  className="black-button px-5 py-3 text-sm disabled:cursor-not-allowed disabled:bg-slate-300"
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
    <main className="page-haze min-h-screen pb-12">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <Link className="font-display text-2xl font-semibold tracking-tight text-slate-950" href="/">
          MyCoach
        </Link>
        <Link className="ghost-button px-4 py-2 text-sm" href="/">
          Ver landing
        </Link>
      </div>

      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {errorMessage ? (
          <div className="mb-6 rounded-[24px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] lg:items-start">
          <div className="mx-auto w-full max-w-[440px] lg:mx-0">
            <div className="phone-shell">
              <div className="phone-screen">
                <div className="px-4 pt-4">
                  <div className="phone-status" />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <button
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition ${
                        step === 1 ? "pointer-events-none opacity-30" : "hover:border-[rgba(66,108,255,0.3)]"
                      }`}
                      onClick={() => moveTo(Math.max(1, step - 1))}
                      type="button"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div className="text-center">
                      <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
                        Paso {step} de {STEP_META.length}
                      </div>
                      <div className="font-display text-xl font-semibold tracking-tight text-slate-950">
                        {currentMeta.title}
                      </div>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      móvil
                    </div>
                  </div>
                  <div className="mt-4 progress-rail">
                    <div className="progress-fill" style={{ width: progressWidth }} />
                  </div>
                </div>

                <div className="phone-scroll thin-scrollbar pt-5">
                  {step === 1 ? (
                    <div className="space-y-6">
                      <StepIntro
                        eyebrow="Contexto base"
                        title="Empezamos por el caso real del atleta."
                        text="Puedes escribir contexto, pegar la rutina actual o subir un archivo. Todo es opcional, pero cuanto mejor sea la base, más fino quedará el bloque."
                      />

                      <div className="grid gap-3 sm:grid-cols-2">
                        <MiniStat label="Inputs" value={`${contextFiles.length + Number(Boolean(profile.currentRoutineText?.trim()))}`} />
                        <MiniStat label="Perfil" value={profile.level || "abierto"} />
                      </div>

                      <FieldGroup
                        description="Datos básicos para contextualizar el caso. No frenan el flujo si no los rellenas."
                        title="Perfil"
                      >
                        <div className="grid gap-3 sm:grid-cols-2">
                          <TextField
                            label="Sexo"
                            onChange={(value) => updateProfile("sex", value)}
                            value={profile.sex || ""}
                          />
                          <TextField
                            label="Nivel"
                            onChange={(value) => updateProfile("level", value)}
                            value={profile.level || ""}
                          />
                          <TextField
                            label="Años de entrenamiento"
                            onChange={(value) => updateProfile("yearsTraining", value)}
                            value={profile.yearsTraining || ""}
                          />
                          <TextField
                            label="Peso y altura"
                            onChange={(value) => updateProfile("weight", value)}
                            placeholder="88 kg · 1.88 m"
                            value={profile.weight || ""}
                          />
                          <TextField
                            label="Dieta o contexto nutricional"
                            onChange={(value) => updateProfile("diet", value)}
                            placeholder="Mantenimiento, superávit, déficit..."
                            value={profile.diet || ""}
                          />
                          <TextField
                            label="Objetivo principal"
                            onChange={(value) => updateProfile("objective", value)}
                            placeholder="Hipertrofia, bajar peso, Hyrox..."
                            value={profile.objective || ""}
                          />
                        </div>
                      </FieldGroup>

                      <FieldGroup
                        description="Selecciona los contextos de entrenamiento que quieres que el sistema tenga en cuenta."
                        title="Disciplinas"
                      >
                        <div className="flex flex-wrap gap-2">
                          {DISCIPLINE_OPTIONS.map((option) => {
                            const selected = profile.disciplines?.includes(option.value) || false;
                            return (
                              <button
                                className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                                  selected
                                    ? "bg-slate-950 text-white"
                                    : "border border-slate-200 bg-white text-slate-700 hover:border-[rgba(66,108,255,0.3)]"
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
                      </FieldGroup>

                      <FieldGroup
                        description="Aquí es donde más valor suele entrar: rutina actual, problemas del bloque, contexto del atleta o feedback previo."
                        title="Rutina actual y contexto"
                      >
                        <div className="grid gap-3">
                          <TextAreaField
                            label="Entrenamiento actual"
                            onChange={(value) => updateProfile("currentTraining", value)}
                            placeholder="Ej: clases, full body, Hyrox 3 días, rutina libre..."
                            rows={4}
                            value={profile.currentTraining || ""}
                          />
                          <TextAreaField
                            label="Contexto libre o rutina pegada"
                            onChange={(value) => updateProfile("currentRoutineText", value)}
                            placeholder="Pega aquí la rutina, feedback del bloque, limitaciones o notas del atleta."
                            rows={6}
                            value={profile.currentRoutineText || ""}
                          />
                        </div>
                      </FieldGroup>

                      <FieldGroup
                        description="TXT, CSV, Excel, DOCX o PDF. La plataforma lo usa como contexto adicional."
                        title="Adjuntar rutina actual"
                      >
                        <UploadTile
                          accept=".txt,.csv,.xlsx,.xls,.docx,.pdf,.md"
                          icon={<FileText className="h-6 w-6" />}
                          onChange={(event) => updateFiles("context", event)}
                          subtitle="Sube la rutina actual o cualquier documento útil para arrancar."
                          title="Añadir archivo"
                        />
                        <FilePills files={contextFiles} />
                      </FieldGroup>
                    </div>
                  ) : null}

                  {step === 2 ? (
                    <div className="space-y-6">
                      <StepIntro
                        eyebrow="Paso opcional"
                        title="Si quieres, añade una lectura visual del físico."
                        text="Este paso es totalmente opcional. Si subes material visual, MyCoach revisa el físico antes de personalizar el formulario."
                      />

                      <div className="rounded-[28px] border border-slate-200 bg-[#eef3ff] p-4">
                        <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--primary)]">
                          <ScanEye className="h-4 w-4" />
                          Recomendación
                        </div>
                        <p className="text-sm leading-7 text-slate-700">
                          Vídeo corto de unos 30 segundos, cuerpo completo, frente, lado y
                          espalda, con buena iluminación. También puedes subir hasta 10
                          imágenes del físico.
                        </p>
                      </div>

                      <div className="rounded-[28px] border border-slate-200 bg-white p-3">
                        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#faf9f4]">
                          <Image
                            alt="Escaneo corporal opcional de MyCoach"
                            className="h-auto w-full"
                            height={900}
                            src={generatedVisuals.bodyScan}
                            width={760}
                          />
                        </div>
                      </div>

                      <FieldGroup
                        description="Acepta imágenes y vídeo. El flujo continúa aunque no subas nada."
                        title="Material visual"
                      >
                        <UploadTile
                          accept="image/*,video/mp4,video/quicktime,video/webm"
                          icon={<Video className="h-6 w-6" />}
                          onChange={(event) => updateFiles("visual", event)}
                          subtitle="Vídeo o imágenes del físico. Máximo 10 imágenes."
                          title="Subir recurso visual"
                        />
                        <FilePills files={visualFiles} />
                      </FieldGroup>
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div className="space-y-6">
                      <StepIntro
                        eyebrow="Preguntas dinámicas"
                        title="El formulario ya está ajustado al caso."
                        text="Cada tarjeta contiene una o dos preguntas que sí cambian la programación. Todo sigue siendo opcional."
                      />

                      {analysis ? (
                        <>
                          {analysis.signalSummary.length ? (
                            <div className="flex flex-wrap gap-2">
                              {analysis.signalSummary.map((signal) => (
                                <span
                                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"
                                  key={signal}
                                >
                                  {signal}
                                </span>
                              ))}
                            </div>
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

                  {step === 4 ? (
                    <div className="space-y-6">
                      <StepIntro
                        eyebrow="Cierre logístico"
                        title="Ajustamos tiempo real, frecuencia y material."
                        text="Esto influye en adherencia, densidad de las sesiones y selección final de ejercicios."
                      />

                      <FieldGroup
                        description="Escoge la frecuencia que tendría sentido para este bloque."
                        title="Días por semana"
                      >
                        <ChoiceGrid>
                          {["3", "4", "5", "6", "Auto"].map((value) => (
                            <ChoiceTile
                              active={profile.daysPerWeek === (value === "Auto" ? "" : value)}
                              key={value}
                              label={value}
                              onClick={() =>
                                updateProfile("daysPerWeek", value === "Auto" ? "" : value)
                              }
                              sublabel={value === "Auto" ? "Decidir más tarde" : "Sesiones por semana"}
                            />
                          ))}
                        </ChoiceGrid>
                      </FieldGroup>

                      <FieldGroup
                        description="Importa para repartir patrones, descansos y número de ejercicios."
                        title="Duración preferida"
                      >
                        <ChoiceGrid>
                          {["45-60", "60-75", "75-90", "90+"].map((value) => (
                            <ChoiceTile
                              active={profile.sessionLength === value}
                              key={value}
                              label={`${value} min`}
                              onClick={() => updateProfile("sessionLength", value)}
                              sublabel="Rango objetivo"
                            />
                          ))}
                        </ChoiceGrid>
                      </FieldGroup>

                      <FieldGroup
                        description="Máquinas, racks, ergs o marcas concretas cambian bastante la selección."
                        title="Material disponible"
                      >
                        <TextField
                          label="Equipamiento"
                          onChange={(value) => updateProfile("equipment", value)}
                          placeholder="Technogym, Hammer, gym80, ergs, racks..."
                          value={profile.equipment || ""}
                        />
                      </FieldGroup>

                      <FieldGroup
                        description="Molestias, zonas a vigilar o patrones que prefieres evitar."
                        title="Limitaciones"
                      >
                        <TextField
                          label="Notas"
                          onChange={(value) => updateProfile("limitationNotes", value)}
                          placeholder="Hombro en press plano, ciática, rodilla..."
                          value={profile.limitationNotes || ""}
                        />
                      </FieldGroup>
                    </div>
                  ) : null}

                  {step === 5 ? (
                    <div className="space-y-6">
                      <StepIntro
                        eyebrow="Listo para generar"
                        title="Todo el contexto está preparado."
                        text="En el siguiente paso MyCoach crea la rutina final, activa el workspace editable y deja el bloque listo para exportar a Excel."
                      />

                      <div className="rounded-[30px] border border-slate-200 bg-white p-4">
                        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[#faf9f4]">
                          <Image
                            alt="Vista previa del resultado final de la rutina"
                            className="h-auto w-full"
                            height={980}
                            src={generatedVisuals.phoneRoutine}
                            width={520}
                          />
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <SummaryCard
                          icon={<FileText className="h-5 w-5" />}
                          title="Contexto"
                          value={
                            profile.currentRoutineText?.trim()
                              ? "Texto o rutina añadida"
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
                          extra="Paso opcional completado o saltado"
                        />
                        <SummaryCard
                          icon={<BrainCircuit className="h-5 w-5" />}
                          title="Formulario"
                          value={`${Object.values(answers).filter(Boolean).length} respuestas guardadas`}
                          extra="Se usan para personalizar la estructura final"
                        />
                        <SummaryCard
                          icon={<Target className="h-5 w-5" />}
                          title="Logística"
                          value={`${profile.daysPerWeek || "Auto"} días · ${profile.sessionLength || "Auto"} min`}
                          extra={profile.equipment || "Sin material especificado"}
                        />
                      </div>

                      <div className="rounded-[28px] border border-slate-200 bg-[#fafaf8] p-5">
                        <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                          Resumen rápido
                        </div>
                        <div className="grid gap-3 text-sm text-slate-700">
                          <div>Objetivo: {profile.objective || "No indicado"}</div>
                          <div>
                            Disciplinas: {(profile.disciplines || []).join(", ") || "No indicadas"}
                          </div>
                          <div>Nivel: {profile.level || "No indicado"}</div>
                          <div>Material: {profile.equipment || "No indicado"}</div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="absolute inset-x-0 bottom-0 border-t border-slate-200/90 bg-[linear-gradient(180deg,rgba(247,246,241,0),rgba(247,246,241,0.95)_24%,rgba(247,246,241,0.98)_100%)] px-4 pb-4 pt-5">
                  <PhoneFooter
                    backLabel={step > 1 ? "Atrás" : undefined}
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
                        void personalizeForm();
                        return;
                      }

                      if (step === 3) {
                        moveTo(4);
                        return;
                      }

                      if (step === 4) {
                        moveTo(5);
                        return;
                      }

                      void generatePlan();
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6">
            <article className="soft-card p-5">
              <div className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Estado del flujo
              </div>
              <div className="grid gap-3">
                {STEP_META.map((item) => {
                  const Icon = item.icon;
                  const active = item.id === step;
                  const done = item.id < step;

                  return (
                    <div
                      className={`rounded-[26px] border px-4 py-4 transition ${
                        active
                          ? "border-[rgba(66,108,255,0.3)] bg-[rgba(66,108,255,0.08)]"
                          : done
                            ? "border-slate-200 bg-white"
                            : "border-slate-200/70 bg-[#fafaf8]"
                      }`}
                      key={item.id}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                            active
                              ? "bg-white text-[var(--primary)]"
                              : done
                                ? "bg-slate-950 text-white"
                                : "bg-white text-slate-400"
                          }`}
                        >
                          {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                            Paso {item.id}
                          </div>
                          <div className="mt-1 font-display text-xl font-semibold tracking-tight text-slate-950">
                            {item.title}
                          </div>
                          <p className="mt-2 text-sm leading-7 text-slate-600">{item.blurb}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="soft-card overflow-hidden p-4">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#faf9f4]">
                <Image
                  alt="Mockup editorial del producto MyCoach"
                  className="h-auto w-full"
                  height={980}
                  src={editorialMockups[Math.min(step - 1, editorialMockups.length - 1)]}
                  width={520}
                />
              </div>
            </article>

            <article className="soft-card overflow-hidden p-4">
              <div className="overflow-hidden rounded-[28px]">
                <Image
                  alt={landingPhotos[Math.min(step - 1, landingPhotos.length - 1)].alt}
                  className="h-[280px] w-full object-cover"
                  height={1201}
                  src={landingPhotos[Math.min(step - 1, landingPhotos.length - 1)].src}
                  width={1800}
                />
              </div>
            </article>
          </aside>
        </div>
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
  if (step === 2) {
    return isAnalyzing ? "Personalizando..." : "Personalizar formulario";
  }

  if (step === 5) {
    return isGenerating ? "Generando..." : "Generar rutina";
  }

  return "Continuar";
}

function StepIntro({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--primary)]">
        {eyebrow}
      </div>
      <h2 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-slate-950">
        {title}
      </h2>
      <p className="text-sm leading-7 text-slate-600">{text}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white px-4 py-4">
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-semibold tracking-tight text-slate-950">
        {value}
      </div>
    </div>
  );
}

function FieldGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-[30px] border border-slate-200 bg-white p-4">
      <div className="mb-4">
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
          {title}
        </div>
        <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
      </div>
      {children}
    </article>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
        <span>{label}</span>
        {optionalLabel()}
      </label>
      <input
        className={fieldClassName()}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows: number;
}) {
  return (
    <div>
      <label className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
        <span>{label}</span>
        {optionalLabel()}
      </label>
      <textarea
        className={`${fieldClassName()} resize-none`}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        value={value}
      />
    </div>
  );
}

function UploadTile({
  title,
  subtitle,
  accept,
  icon,
  onChange,
}: {
  title: string;
  subtitle: string;
  accept: string;
  icon: React.ReactNode;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-[#fafaf8] px-5 py-8 text-center transition hover:border-[rgba(66,108,255,0.32)] hover:bg-white">
      <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-[20px] bg-[var(--primary-soft)] text-[var(--primary)]">
        {icon}
      </div>
      <div className="text-base font-semibold text-slate-900">{title}</div>
      <div className="mt-2 max-w-xs text-sm leading-6 text-slate-500">{subtitle}</div>
      <input accept={accept} className="hidden" multiple onChange={onChange} type="file" />
    </label>
  );
}

function FilePills({ files }: { files: File[] }) {
  if (!files.length) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {files.map((file) => (
        <span
          className="rounded-full border border-slate-200 bg-[#f7f8fc] px-3 py-2 text-xs font-semibold text-slate-700"
          key={file.name}
        >
          {file.name}
        </span>
      ))}
    </div>
  );
}

function ChoiceGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function ChoiceTile({
  label,
  sublabel,
  active,
  onClick,
}: {
  label: string;
  sublabel: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-[24px] border px-4 py-4 text-left transition ${
        active
          ? "border-[rgba(66,108,255,0.34)] bg-[rgba(66,108,255,0.08)]"
          : "border-slate-200 bg-white hover:border-[rgba(66,108,255,0.24)]"
      }`}
      onClick={onClick}
      type="button"
    >
      <div className="font-semibold text-slate-950">{label}</div>
      <div className="mt-1 text-sm leading-6 text-slate-500">{sublabel}</div>
    </button>
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
    <div className="rounded-[24px] border border-slate-200 bg-white p-4">
      <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
        {icon}
      </div>
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </div>
      <div className="mt-2 text-base font-semibold text-slate-950">{value}</div>
      <div className="mt-2 text-sm leading-6 text-slate-500">{extra}</div>
    </div>
  );
}

function LoaderBlock() {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-6">
      <div className="flex items-center gap-3">
        <LoaderCircle className="h-5 w-5 animate-spin text-[var(--primary)]" />
        <span className="text-sm font-semibold text-slate-600">
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
    <article className="rounded-[30px] border border-slate-200 bg-white p-4">
      <div className="mb-5">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--primary)]">
          {section.title}
        </div>
        <p className="mt-2 text-sm leading-7 text-slate-600">{section.description}</p>
      </div>
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
        <label className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
          <span>{question.label}</span>
          {optionalLabel()}
        </label>
        <p className="mb-3 text-sm leading-6 text-slate-500">{question.help}</p>
        {question.type === "textarea" ? (
          <textarea
            className={`${fieldClassName()} min-h-28 resize-none`}
            onChange={(event) => onAnswer(question.id, event.target.value)}
            placeholder={question.placeholder}
            value={typeof answer === "string" ? answer : ""}
          />
        ) : (
          <input
            className={fieldClassName()}
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
      <div className="rounded-[24px] border border-slate-200 bg-[#fafaf8] p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-800">{question.label}</div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--primary)]">
            {currentValue}
          </span>
        </div>
        <p className="mb-4 text-sm leading-6 text-slate-500">{question.help}</p>
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
      <div>
        <label className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
          <span>{question.label}</span>
          {optionalLabel()}
        </label>
        <p className="mb-3 text-sm leading-6 text-slate-500">{question.help}</p>
        <div className="grid gap-3">
          {question.options?.map((option) => {
            const selected = answer === option.value;

            return (
              <button
                className={`rounded-[24px] border px-4 py-4 text-left transition ${
                  selected
                    ? "border-[rgba(66,108,255,0.34)] bg-[rgba(66,108,255,0.08)]"
                    : "border-slate-200 bg-white hover:border-[rgba(66,108,255,0.24)]"
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
      <label className="mb-2 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700">
        <span>{question.label}</span>
        {optionalLabel()}
      </label>
      <p className="mb-3 text-sm leading-6 text-slate-500">{question.help}</p>
      <div className="flex flex-wrap gap-2">
        {question.options?.map((option) => {
          const values = arrayValue(answer);
          const selected = values.includes(option.value);

          return (
            <button
              className={`rounded-full px-4 py-3 text-sm font-semibold transition ${
                selected
                  ? "bg-slate-950 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-[rgba(66,108,255,0.24)]"
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

function PhoneFooter({
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
    <div className="flex items-center gap-3">
      {onBack ? (
        <button className="ghost-button h-14 shrink-0 px-4 text-sm" onClick={onBack} type="button">
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </button>
      ) : null}
      <button
        className="black-button h-14 flex-1 px-5 text-sm disabled:cursor-not-allowed disabled:bg-slate-300"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/48 px-4 py-8 backdrop-blur-md">
      <div className="max-h-full w-full max-w-5xl overflow-auto rounded-[38px] border border-white/70 bg-[#fcfbf8] p-6 shadow-[0_48px_140px_-70px_rgba(18,25,45,0.48)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">
              MyCoach
            </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/42 px-4 backdrop-blur-md">
      <div className="soft-card w-full max-w-md p-7 text-center">
        <div className="mx-auto w-28">
          <Image
            alt="Loader de MyCoach"
            className="h-auto w-full"
            height={240}
            priority
            src={generatedVisuals.loader}
            width={240}
          />
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-slate-950">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
      </div>
    </div>
  );
}
