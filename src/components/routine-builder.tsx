"use client";

import { upload } from "@vercel/blob/client";
import Image from "next/image";
import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  type ChangeEvent,
  type FocusEvent,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BrainCircuit,
  Bolt,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  FileText,
  ImageUp,
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
  FormLabelWithTooltip,
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
import { createBlobPathname } from "@/lib/blob-upload";
import { exportRoutineWorkbook } from "@/lib/excel";
import type {
  AnalyzeIntakeRequest,
  DynamicAnswerValue,
  DynamicAnswers,
  DynamicQuestion,
  DynamicSection,
  ExercisePlan,
  GeminiUsage,
  IntakeAnalysis,
  IntakeProfile,
  RoutinePlan,
  UploadedAsset,
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

const BASE_PROGRESS_STEPS = 5;
const AGENT_MESSAGE_LIMIT = 10;
const MEGABYTE = 1024 * 1024;

const UPLOAD_RULES = {
  context: {
    acceptedExtensions: [".pdf", ".xls", ".xlsx", ".csv", ".txt", ".doc"],
    formatsLabel: "PDF, XLS, XLSX, CSV, TXT, DOC",
    maxBytes: 10 * MEGABYTE,
    maxSizeLabel: "10 MB",
    maxFiles: 5,
    modalTitle: "Documento no admitido",
  },
  visual: {
    acceptedExtensions: [".jpg", ".jpeg", ".png", ".heic", ".mp4", ".mov", ".avi"],
    formatsLabel: "JPG, JPEG, PNG, HEIC, MP4, MOV, AVI",
    maxBytes: 15 * MEGABYTE,
    maxSizeLabel: "15 MB en total",
    maxFiles: 10,
    modalTitle: "Archivo visual no admitido",
  },
} as const;

type AgentMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
};

type UploadType = keyof typeof UPLOAD_RULES;

type UploadErrorState = {
  title: string;
  summary: string;
  rules: string;
} | null;

type StepOneField =
  | "sex"
  | "height"
  | "weight"
  | "yearsTraining"
  | "diet"
  | "objective"
  | "disciplines";

const STEP_ONE_FIELDS: StepOneField[] = [
  "sex",
  "height",
  "weight",
  "yearsTraining",
  "diet",
  "objective",
  "disciplines",
];

const STEP_ONE_FIELD_IDS: Record<StepOneField, string> = {
  sex: "step-one-sex-group",
  height: "step-one-height",
  weight: "step-one-weight",
  yearsTraining: "step-one-years-training",
  diet: "step-one-diet",
  objective: "step-one-objective",
  disciplines: "step-one-disciplines-group",
};

const STEP_ONE_ERROR_IDS: Record<StepOneField, string> = {
  sex: "step-one-sex-error",
  height: "step-one-height-error",
  weight: "step-one-weight-error",
  yearsTraining: "step-one-years-training-error",
  diet: "step-one-diet-error",
  objective: "step-one-objective-error",
  disciplines: "step-one-disciplines-error",
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

function getStepOneErrors(profile: IntakeProfile): Partial<Record<StepOneField, string>> {
  return {
    sex: profile.sex ? undefined : "Es obligatorio seleccionar un género.",
    height: profile.height?.trim() ? undefined : "Es obligatorio indicar la altura.",
    weight: profile.weight?.trim() ? undefined : "Es obligatorio indicar el peso.",
    yearsTraining:
      profile.yearsTraining?.trim() ? undefined : "Es obligatorio indicar los años entrenando.",
    diet: profile.diet?.trim() ? undefined : "Es obligatorio seleccionar una dieta.",
    objective:
      profile.objective?.trim() ? undefined : "Es obligatorio seleccionar un objetivo principal.",
    disciplines:
      profile.disciplines?.length
        ? undefined
        : "Es obligatorio seleccionar al menos una opción.",
  };
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
  const [uploadError, setUploadError] = useState<UploadErrorState>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExercisePlan | null>(null);
  const [swapTarget, setSwapTarget] = useState<{ sessionId: string; exerciseId: string } | null>(
    null
  );
  const [selectedSwapAlternative, setSelectedSwapAlternative] = useState("");
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
  const [stepOneTouched, setStepOneTouched] = useState<Record<StepOneField, boolean>>({
    sex: false,
    height: false,
    weight: false,
    yearsTraining: false,
    diet: false,
    objective: false,
    disciplines: false,
  });
  const [showStepOneSummary, setShowStepOneSummary] = useState(false);
  const [formPageIndex, setFormPageIndex] = useState(0);
  const [areSignalsExpanded, setAreSignalsExpanded] = useState(true);
  const stepOneSummaryRef = useRef<HTMLDivElement | null>(null);

  const scrollToActiveStep = useEffectEvent(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const stepOneErrors = getStepOneErrors(profile);
  const hasStepOneErrors = STEP_ONE_FIELDS.some((field) => Boolean(stepOneErrors[field]));

  useEffect(() => {
    scrollToActiveStep();
  }, [step, routine]);

  useEffect(() => {
    if (!(step === 1 && showStepOneSummary && hasStepOneErrors)) return;

    const frame = window.requestAnimationFrame(() => {
      stepOneSummaryRef.current?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [hasStepOneErrors, showStepOneSummary, step]);

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

  function getFileExtension(fileName: string) {
    const parts = fileName.toLowerCase().match(/\.[^.]+$/);
    return parts ? parts[0] : "";
  }

  function mergeUniqueFiles(current: File[], nextFiles: File[]) {
    const seen = new Set(
      current.map((file) => `${file.name}-${file.lastModified}-${file.size}`)
    );

    const merged = [...current];
    let didAddFile = false;
    nextFiles.forEach((file) => {
      const key = `${file.name}-${file.lastModified}-${file.size}`;
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(file);
      didAddFile = true;
    });

    return didAddFile ? merged : current;
  }

  function validateFiles(type: UploadType, currentFiles: File[], nextFiles: File[]) {
    const rule = UPLOAD_RULES[type];
    const isAcceptedExtension = (fileName: string) =>
      rule.acceptedExtensions.some((extension) => extension === getFileExtension(fileName));
    const invalidFormatFiles = nextFiles.filter(
      (file) => !isAcceptedExtension(file.name)
    );
    const validFiles = nextFiles.filter(
      (file) => isAcceptedExtension(file.name)
    );
    const mergedFiles = mergeUniqueFiles(currentFiles, validFiles);
    const totalBytes = mergedFiles.reduce((sum, file) => sum + file.size, 0);

    if (invalidFormatFiles.length) {
      const invalidNames = invalidFormatFiles.map((file) => file.name).join(", ");

      return {
        files: totalBytes <= rule.maxBytes ? mergedFiles : currentFiles,
        error: {
          title: rule.modalTitle,
          summary: `No se han admitido los siguientes archivos: ${invalidNames}.`,
          rules: `Solo se admiten los siguientes formatos: ${rule.formatsLabel}. El peso máximo admitido es de ${rule.maxSizeLabel}.`,
        },
      };
    }

    if (totalBytes > rule.maxBytes) {
      return {
        files: currentFiles,
        error: {
          title: "Se ha superado el límite de peso",
          summary: "Los archivos seleccionados superan el máximo permitido para este bloque.",
          rules: `Solo se admiten los siguientes formatos: ${rule.formatsLabel}. El peso máximo admitido es de ${rule.maxSizeLabel}.`,
        },
      };
    }

    return { files: mergedFiles, error: null };
  }

  function addFiles(type: UploadType, nextFiles: File[]) {
    if (!nextFiles.length) return;

    const currentFiles = type === "context" ? contextFiles : visualFiles;
    const result = validateFiles(type, currentFiles, nextFiles);

    if (result.error) {
      setUploadError(result.error);
    }

    if (result.files === currentFiles) {
      return;
    }

    invalidateAnalysis();

    if (type === "context") {
      setContextFiles(result.files.slice(0, UPLOAD_RULES.context.maxFiles));
      return;
    }

    setVisualFiles(result.files.slice(0, UPLOAD_RULES.visual.maxFiles));
  }

  function updateFiles(type: UploadType, event: ChangeEvent<HTMLInputElement>) {
    addFiles(type, Array.from(event.target.files || []));
  }

  function removeFile(type: UploadType, target: File) {
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
    return !hasStepOneErrors;
  }

  function markStepOneTouched(field: StepOneField) {
    setStepOneTouched((current) =>
      current[field] ? current : { ...current, [field]: true }
    );
  }

  function markAllStepOneFieldsTouched() {
    setStepOneTouched({
      sex: true,
      height: true,
      weight: true,
      yearsTraining: true,
      diet: true,
      objective: true,
      disciplines: true,
    });
  }

  function shouldShowStepOneError(field: StepOneField) {
    return Boolean(stepOneErrors[field] && (stepOneTouched[field] || showStepOneSummary));
  }

  function focusStepOneField(field: StepOneField) {
    const element = document.getElementById(STEP_ONE_FIELD_IDS[field]);
    if (!element) return;

    element.focus();
    element.scrollIntoView({ block: "center", behavior: "smooth" });
  }

  function handleGroupBlur(field: StepOneField) {
    return (event: FocusEvent<HTMLDivElement>) => {
      if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
      markStepOneTouched(field);
    };
  }

  async function personalizeForm() {
    setIsAnalyzing(true);
    setErrorMessage("");
    const traceId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? `intake-${crypto.randomUUID()}`
        : `intake-${Date.now()}`;
    const attemptStartedAt = Date.now();
    let analyzeHeartbeatInterval: ReturnType<typeof setInterval> | null = null;
    let analyzeTimeout: ReturnType<typeof setTimeout> | null = null;
    let analyzeAbortController: AbortController | null = null;

    try {
      console.info("[intake/personalize] phase:start", { traceId });

      const uploadBatch = async (
        kind: UploadedAsset["kind"],
        files: File[]
      ): Promise<UploadedAsset[]> => {
        const uploadedAssets: UploadedAsset[] = [];

        for (const file of files) {
          const pathname = createBlobPathname(kind, file.name);
          console.info("[intake/upload] start", {
            kind,
            name: file.name,
            size: file.size,
            type: file.type,
            pathname,
          });

          const result = await upload(pathname, file, {
            access: "private",
            handleUploadUrl: "/api/blob/upload",
            clientPayload: JSON.stringify({
              kind,
              originalName: file.name,
            }),
            headers: {
              "x-trace-id": traceId,
            },
            multipart: file.size >= 5 * MEGABYTE,
          });

          console.info("[intake/upload] done", {
            kind,
            pathname: result.pathname,
            size: file.size,
            contentType: result.contentType,
          });

          uploadedAssets.push({
            kind,
            name: file.name,
            pathname: result.pathname,
            url: result.url,
            contentType: result.contentType || file.type || "application/octet-stream",
            size: file.size,
          });
        }

        console.info("[intake/personalize] phase:upload-batch-complete", {
          traceId,
          kind,
          uploadedCount: uploadedAssets.length,
        });

        return uploadedAssets;
      };

      const contextFilesToUpload = contextFiles.slice(0, 5);
      const visualFilesToUpload = visualFiles.slice(0, 10);
      if (contextFiles.length > contextFilesToUpload.length) {
        console.warn("[intake/upload] context-files-truncated", {
          provided: contextFiles.length,
          uploaded: contextFilesToUpload.length,
        });
      }
      if (visualFiles.length > visualFilesToUpload.length) {
        console.warn("[intake/upload] visual-files-truncated", {
          provided: visualFiles.length,
          uploaded: visualFilesToUpload.length,
        });
      }

      const contextUploadedAssets = await uploadBatch("context", contextFilesToUpload);
      const visualUploadedAssets = await uploadBatch("visual", visualFilesToUpload);
      const requestBody: AnalyzeIntakeRequest = {
        payload: { profile },
        contextFiles: contextUploadedAssets,
        visualFiles: visualUploadedAssets,
      };
      const requestBodySize = JSON.stringify(requestBody).length;
      console.info("[intake/analyze] request-ready", {
        traceId,
        contextRefs: contextUploadedAssets.length,
        visualRefs: visualUploadedAssets.length,
        bodyBytes: requestBodySize,
      });

      analyzeAbortController = new AbortController();
      const analyzeStartedAt = Date.now();
      analyzeHeartbeatInterval = setInterval(() => {
        console.info("[intake/analyze] waiting", {
          traceId,
          elapsedMs: Date.now() - analyzeStartedAt,
        });
      }, 15000);
      analyzeTimeout = setTimeout(() => {
        console.error("[intake/analyze] timeout", {
          traceId,
          timeoutMs: 300000,
        });
        analyzeAbortController?.abort();
      }, 300000);

      const response = await fetch("/api/intake/analyze", {
        method: "POST",
        signal: analyzeAbortController.signal,
        headers: {
          "Content-Type": "application/json",
          "x-trace-id": traceId,
        },
        body: JSON.stringify(requestBody),
      });

      if (analyzeHeartbeatInterval) clearInterval(analyzeHeartbeatInterval);
      if (analyzeTimeout) clearTimeout(analyzeTimeout);

      const rawResponse = await response.text();
      let parsedResponse:
        | { analysis?: IntakeAnalysis; usage?: GeminiUsage | null; error?: string }
        | null = null;
      try {
        parsedResponse = rawResponse
          ? (JSON.parse(rawResponse) as {
              analysis?: IntakeAnalysis;
              usage?: GeminiUsage | null;
              error?: string;
            })
          : null;
      } catch {
        parsedResponse = null;
      }

      console.info("[intake/analyze] response", {
        traceId,
        status: response.status,
        ok: response.ok,
        error: parsedResponse?.error ?? null,
        elapsedMs: Date.now() - analyzeStartedAt,
      });

      if (parsedResponse?.usage) {
        console.info("[intake/analyze] token-usage", {
          traceId,
          usage: parsedResponse.usage,
        });
      }

      if (!response.ok) {
        throw new Error(
          parsedResponse?.error || "No se pudo preparar el formulario personalizado."
        );
      }

      if (!parsedResponse?.analysis) {
        throw new Error("La respuesta del análisis no tiene contenido válido.");
      }

      setAnalysis(parsedResponse.analysis);
      setFormPageIndex(0);
      console.info("[intake/personalize] phase:success", {
        traceId,
        totalElapsedMs: Date.now() - attemptStartedAt,
      });
      moveTo(4);
    } catch (error) {
      if (analyzeHeartbeatInterval) clearInterval(analyzeHeartbeatInterval);
      if (analyzeTimeout) clearTimeout(analyzeTimeout);
      console.error("[intake/personalize] failed", error);
      const isAbortError = error instanceof DOMException && error.name === "AbortError";
      const fallbackMessage = isAbortError
        ? "La personalización ha superado el tiempo máximo de espera. Revisa logs y vuelve a intentarlo."
        : "No se pudo personalizar el formulario. Vuelve a intentarlo.";
      setErrorMessage(
        isAbortError
          ? fallbackMessage
          : error instanceof Error
            ? error.message || fallbackMessage
            : fallbackMessage
      );
    } finally {
      if (analyzeHeartbeatInterval) clearInterval(analyzeHeartbeatInterval);
      if (analyzeTimeout) clearTimeout(analyzeTimeout);
      console.info("[intake/personalize] phase:end", {
        traceId,
        totalElapsedMs: Date.now() - attemptStartedAt,
      });
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

      const data = (await response.json()) as { routine: RoutinePlan; usage?: GeminiUsage | null };
      setRoutine(data.routine);
      if (data.usage) {
        console.info("[routine/generate] token-usage", { usage: data.usage });
      }
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
        usage?: GeminiUsage | null;
        assistantMessage: string;
        requiresClarification?: boolean;
      };

      if (data.routine) {
        setRoutine(data.routine);
      }
      if (data.usage) {
        console.info("[routine/revise] token-usage", { usage: data.usage });
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
  const personalizedCards = analysis
    ? analysis.personalizedSections.flatMap((section) => chunkQuestions(section))
    : [];
  const formPageCount = Math.max(1, personalizedCards.length || (step === 4 ? 1 : 0));
  const progressTotalSteps = BASE_PROGRESS_STEPS + formPageCount;
  const progressStep =
    step === 1
      ? 1
      : step === 2
        ? 2
        : step === 3
          ? 3
          : step === 4
            ? 4 + formPageIndex
            : step === 5
              ? 4 + formPageCount
              : 5 + formPageCount;
  const progressTitle = step === 4 ? "FORMULARIO" : currentMeta.title;
  const activeDynamicSection =
    analysis && personalizedCards.length
      ? personalizedCards[Math.min(formPageIndex, personalizedCards.length - 1)]
      : null;
  const isLastFormPage = formPageIndex >= formPageCount - 1;
  const signalGroups = analysis
    ? [
        { title: "Valor de contexto", items: analysis.signalSummary },
        { title: "Señales visuales", items: analysis.visualSignals },
        { title: "Notas de planificación", items: analysis.planningNotes },
        { title: "Alertas y cautelas", items: analysis.cautionFlags },
      ].filter((group) => group.items.length > 0)
    : [];
  const visibleDisciplines = getVisibleSportDisciplines(visibleDisciplineValues);
  const nextDisciplineBatch = getNextSportDisciplineBatch(
    profile.disciplines || [],
    visibleDisciplineValues,
    SPORT_DISCIPLINE_BATCH_SIZE
  );
  const canLoadMoreDisciplines = nextDisciplineBatch.length > 0;

  useEffect(() => {
    if (step !== 4) return;
    setFormPageIndex((current) => Math.min(current, Math.max(0, formPageCount - 1)));
  }, [formPageCount, step]);

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

        {uploadError ? (
          <ModalShell onClose={() => setUploadError(null)} title={uploadError.title}>
            <div className="w-full space-y-5">
              <p className="text-base leading-8 text-slate-700">{uploadError.summary}</p>
              <p className="text-base leading-8 text-slate-700">{uploadError.rules}</p>
              <div className="flex justify-center">
                <button
                  className="inline-flex items-center justify-center rounded-full bg-[#1b1b1b] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#2a2a2a]"
                  onClick={() => setUploadError(null)}
                  type="button"
                >
                  Entendido
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
            step={progressStep}
            title={progressTitle}
            totalSteps={progressTotalSteps}
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
                <section className="space-y-5">
                  <div className="space-y-2">
                    <div className="form-ui-label" id="step-one-sex-label">
                      Género
                    </div>
                  </div>
                  <div
                    aria-describedby={
                      shouldShowStepOneError("sex") ? STEP_ONE_ERROR_IDS.sex : undefined
                    }
                    aria-invalid={shouldShowStepOneError("sex") ? "true" : "false"}
                    aria-labelledby="step-one-sex-label"
                    aria-required="true"
                    className={`grid gap-3 rounded-[1.5rem] border p-1 sm:grid-cols-3 ${
                      shouldShowStepOneError("sex")
                        ? "border-rose-500/70"
                        : "border-transparent"
                    }`}
                    id={STEP_ONE_FIELD_IDS.sex}
                    onBlur={handleGroupBlur("sex")}
                    role="radiogroup"
                    tabIndex={-1}
                  >
                    {SEX_OPTIONS.map((option) => (
                      <FormPillButton
                        active={profile.sex === option}
                        aria-checked={profile.sex === option}
                        id={option === SEX_OPTIONS[0] ? "step-one-sex-option" : undefined}
                        key={option}
                        onClick={() => {
                          markStepOneTouched("sex");
                          updateProfile("sex", option);
                        }}
                        role="radio"
                      >
                        {option}
                      </FormPillButton>
                    ))}
                  </div>
                  {shouldShowStepOneError("sex") ? (
                    <p
                      className="text-sm leading-6 text-rose-600"
                      id={STEP_ONE_ERROR_IDS.sex}
                      role="alert"
                    >
                      {stepOneErrors.sex}
                    </p>
                  ) : null}
                </section>

                <div className="grid gap-8 md:grid-cols-3">
                  <FormLineInput
                    describedBy={
                      shouldShowStepOneError("height") ? STEP_ONE_ERROR_IDS.height : undefined
                    }
                    errorMessage={shouldShowStepOneError("height") ? stepOneErrors.height : undefined}
                    id={STEP_ONE_FIELD_IDS.height}
                    inputMode="numeric"
                    invalid={shouldShowStepOneError("height")}
                    label="Altura (cm)"
                    onBlur={() => markStepOneTouched("height")}
                    onChange={(value) => updateProfile("height", value)}
                    placeholder="180"
                    required
                    value={profile.height || ""}
                  />
                  <FormLineInput
                    describedBy={
                      shouldShowStepOneError("weight") ? STEP_ONE_ERROR_IDS.weight : undefined
                    }
                    errorMessage={shouldShowStepOneError("weight") ? stepOneErrors.weight : undefined}
                    id={STEP_ONE_FIELD_IDS.weight}
                    inputMode="decimal"
                    invalid={shouldShowStepOneError("weight")}
                    label="Peso (kg)"
                    onBlur={() => markStepOneTouched("weight")}
                    onChange={(value) => updateProfile("weight", value)}
                    placeholder="75"
                    required
                    value={profile.weight || ""}
                  />
                  <FormLineInput
                    describedBy={
                      shouldShowStepOneError("yearsTraining")
                        ? STEP_ONE_ERROR_IDS.yearsTraining
                        : undefined
                    }
                    errorMessage={
                      shouldShowStepOneError("yearsTraining")
                        ? stepOneErrors.yearsTraining
                        : undefined
                    }
                    id={STEP_ONE_FIELD_IDS.yearsTraining}
                    inputMode="numeric"
                    invalid={shouldShowStepOneError("yearsTraining")}
                    label="Años entrenando"
                    onBlur={() => markStepOneTouched("yearsTraining")}
                    onChange={(value) => updateProfile("yearsTraining", value)}
                    placeholder="2"
                    required
                    value={profile.yearsTraining || ""}
                  />
                </div>

                <div className="space-y-8">
                  <FormLineSelect
                    describedBy={
                      shouldShowStepOneError("diet") ? STEP_ONE_ERROR_IDS.diet : undefined
                    }
                    errorMessage={shouldShowStepOneError("diet") ? stepOneErrors.diet : undefined}
                    id={STEP_ONE_FIELD_IDS.diet}
                    invalid={shouldShowStepOneError("diet")}
                    label="Dieta"
                    onBlur={() => markStepOneTouched("diet")}
                    onChange={(value) => updateProfile("diet", value)}
                    options={DIET_OPTIONS}
                    placeholder="Selecciona tu preferencia"
                    required
                    value={profile.diet || ""}
                  />
                  <FormLineSelect
                    describedBy={
                      shouldShowStepOneError("objective") ? STEP_ONE_ERROR_IDS.objective : undefined
                    }
                    errorMessage={
                      shouldShowStepOneError("objective") ? stepOneErrors.objective : undefined
                    }
                    id={STEP_ONE_FIELD_IDS.objective}
                    invalid={shouldShowStepOneError("objective")}
                    label="Objetivo principal"
                    onBlur={() => markStepOneTouched("objective")}
                    onChange={(value) => updateProfile("objective", value)}
                    options={OBJECTIVE_OPTIONS}
                    placeholder="¿Qué quieres lograr?"
                    required
                    value={profile.objective || ""}
                  />
                </div>

                <FormSection label="Disciplinas deportivas (Selecciona al menos una opción)">
                  <input
                    aria-describedby={
                      shouldShowStepOneError("disciplines")
                        ? STEP_ONE_ERROR_IDS.disciplines
                        : undefined
                    }
                    aria-invalid={shouldShowStepOneError("disciplines") ? "true" : "false"}
                    aria-required="true"
                    className="sr-only"
                    id="step-one-disciplines-input"
                    readOnly
                    tabIndex={-1}
                    value={(profile.disciplines || []).join(",")}
                  />
                  <div
                    className={`rounded-[1.5rem] border p-1 ${
                      shouldShowStepOneError("disciplines")
                        ? "border-rose-500/70"
                        : "border-transparent"
                    }`}
                    id={STEP_ONE_FIELD_IDS.disciplines}
                    onBlur={handleGroupBlur("disciplines")}
                    tabIndex={-1}
                  >
                    <div className="flex flex-wrap gap-3">
                    {visibleDisciplines.map((option) => {
                      const selected = profile.disciplines?.includes(option.value) || false;
                      return (
                        <FormChipButton
                          active={selected}
                          aria-pressed={selected}
                          key={option.value}
                          onClick={() => {
                            markStepOneTouched("disciplines");
                            toggleDiscipline(option.value);
                          }}
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
                  </div>
                  {shouldShowStepOneError("disciplines") ? (
                    <p
                      className="text-sm leading-6 text-rose-600"
                      id={STEP_ONE_ERROR_IDS.disciplines}
                      role="alert"
                    >
                      {stepOneErrors.disciplines}
                    </p>
                  ) : null}
                </FormSection>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="relative left-1/2 w-screen max-w-[72rem] -translate-x-1/2 px-6 sm:px-8">
                <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-stretch">
                  <section className="grid min-h-[395px] grid-rows-[auto_1fr] gap-4">
                    <div className="flex min-h-6 items-center pl-1">
                      <label className="form-ui-label">Descripción del entrenamiento (Opcional)</label>
                    </div>
                    <div className="flex-1 overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_40px_-10px_rgba(26,28,27,0.06)] ring-1 ring-transparent transition-all focus-within:ring-2 focus-within:ring-[rgba(0,80,204,0.12)]">
                      <textarea
                        className="h-full min-h-[347px] w-full resize-none border-0 bg-transparent px-6 py-6 text-[15px] font-medium leading-7 text-[var(--form-ink)] outline-none placeholder:font-normal placeholder:text-[rgba(114,118,135,0.55)]"
                        onChange={(event) => updateTrainingDescription(event.target.value)}
                        placeholder="Pega aquí tu rutina actual o describe cómo entrenas hoy (ej: 4 días de fuerza, foco en tren inferior...)"
                        value={profile.currentRoutineText || profile.currentTraining || ""}
                      />
                    </div>
                  </section>

                  <section className="grid min-h-[395px] grid-rows-[auto_1fr] gap-4">
                    <FormLabelWithTooltip
                      label="Documentos adjuntos"
                      tooltip="Lo más útil es subir la rutina que hayas seguido durante las últimas semanas, o el último documento real con el que hayas entrenado. Así entendemos mejor volumen, frecuencia y estructura."
                    />
                    <FormUploadTile
                      accept=".pdf,.xls,.xlsx,.csv,.txt,.doc"
                      className="h-full min-h-[347px]"
                      files={contextFiles}
                      formatHint="Formatos admitidos: PDF, XLS, XLSX, CSV, TXT, DOC"
                      maxHint="Peso máximo admitido: 10 MB"
                      onChange={(event) => updateFiles("context", event)}
                      onFilesDropped={(files) => addFiles("context", files)}
                      onRemoveFile={(file) => removeFile("context", file)}
                      title="Sube tu rutina actual"
                    />
                  </section>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="relative left-1/2 w-screen max-w-[72rem] -translate-x-1/2 px-6 sm:px-8">
                <div className="mx-auto max-w-6xl">
                  <article className="form-ui-panel grid gap-8 px-8 py-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] lg:grid-cols-2 lg:items-stretch lg:gap-12">
                    <div className="flex min-h-[395px] flex-col justify-start space-y-6">
                      <div className="space-y-5">
                        <div className="inline-flex items-center gap-3 rounded-full border border-[rgba(194,198,216,0.66)] bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--form-accent)] shadow-[0_12px_28px_-22px_rgba(26,28,27,0.28)]">
                          <span className="inline-flex h-7 w-7 items-center justify-center">
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
                          El contenido que subas ayudará a que la personalización del
                          formulario y de la rutina sea más completa, con un análisis
                          detallado del físico para detectar asimetrías,
                          descompensaciones y señales relevantes del punto de partida.
                        </p>
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

                    <section className="grid min-h-[395px] grid-rows-[auto_1fr] gap-4">
                      <label className="form-ui-label block pl-1">Archivos para el análisis</label>
                      <FormUploadTile
                        accept=".jpg,.jpeg,.png,.heic,.mp4,.mov,.avi"
                        className="h-full min-h-[347px]"
                        files={visualFiles}
                        formatHint="Formatos admitidos: JPG, JPEG, PNG, HEIC, MP4, MOV, AVI"
                        maxHint="Peso máximo total: 15 MB"
                        onChange={(event) => updateFiles("visual", event)}
                        onFilesDropped={(files) => addFiles("visual", files)}
                        onRemoveFile={(file) => removeFile("visual", file)}
                        title="Sube fotos o vídeo de tu físico"
                      />
                    </section>
                  </article>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="space-y-10">
                <FormStepIntro
                  eyebrow="Preguntas dinámicas"
                  text="Revisa primero las señales detectadas y completa el formulario por páginas. El diseño y los componentes siguen la misma lógica visual de los pasos anteriores."
                  title="FORMULARIO"
                />

                {analysis ? (
                  <>
                    {signalGroups.length ? (
                      <section className="space-y-4">
                        <button
                          aria-controls="signals-details"
                          aria-expanded={areSignalsExpanded}
                          className="flex w-full items-center justify-between rounded-[1.5rem] border border-[var(--form-outline)] bg-white px-5 py-4 text-left transition hover:border-[rgba(0,80,204,0.36)]"
                          onClick={() => setAreSignalsExpanded((current) => !current)}
                          type="button"
                        >
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--form-outline-strong)]">
                              Señales detectadas
                            </p>
                            <p className="mt-1 text-sm leading-7 text-[var(--form-muted)]">
                              Bloque colapsable con contexto, señales visuales, notas y alertas.
                            </p>
                          </div>
                          {areSignalsExpanded ? (
                            <ChevronUp className="h-5 w-5 text-[var(--form-outline-strong)]" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-[var(--form-outline-strong)]" />
                          )}
                        </button>

                        <div
                          className={areSignalsExpanded ? "block" : "hidden"}
                          id="signals-details"
                        >
                          <div className="space-y-6 rounded-[1.5rem] border border-[var(--form-outline)] bg-white px-5 py-5">
                            {signalGroups.map((group) => (
                              <section className="space-y-3" key={group.title}>
                                <h3 className="form-ui-label text-[var(--form-accent)]">
                                  {group.title}
                                </h3>
                                <ul className="space-y-2 text-sm leading-7 text-[var(--form-muted)]">
                                  {group.items.map((item) => (
                                    <li className="flex items-start gap-2" key={item}>
                                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--form-accent)]" />
                                      <span>{item}</span>
                                    </li>
                                  ))}
                                </ul>
                              </section>
                            ))}
                          </div>
                        </div>
                      </section>
                    ) : null}

                    <div className="h-px w-full bg-[rgba(194,198,216,0.72)]" />

                    {activeDynamicSection ? (
                      <DynamicSectionPage
                        answers={answers}
                        onAnswer={updateAnswer}
                        pageIndex={formPageIndex}
                        section={activeDynamicSection}
                        totalPages={formPageCount}
                      />
                    ) : (
                      <LoaderBlock />
                    )}
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

          {step === 1 && showStepOneSummary && hasStepOneErrors ? (
            <div
              className="sr-only"
              ref={stepOneSummaryRef}
              role="alert"
              tabIndex={-1}
            >
              <p>Revisa los campos obligatorios antes de continuar:</p>
              <ul>
                {STEP_ONE_FIELDS.filter((field) => stepOneErrors[field]).map((field) => (
                  <li key={field}>
                    <a
                      href={`#${STEP_ONE_FIELD_IDS[field]}`}
                      onClick={(event) => {
                        event.preventDefault();
                        focusStepOneField(field);
                      }}
                    >
                      {stepOneErrors[field]}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <FormFooter
            backLabel={step > 1 ? "Paso anterior" : undefined}
            nextDisabled={isAnalyzing || isGenerating}
            nextIcon={
              isAnalyzing || isGenerating ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : undefined
            }
            nextLabel={getNextLabel(step, isAnalyzing, isGenerating, isLastFormPage)}
            onBack={
              step > 1
                ? () => {
                    if (step === 4 && formPageIndex > 0) {
                      setFormPageIndex((current) => Math.max(0, current - 1));
                      return;
                    }

                    if (step === 5) {
                      setFormPageIndex(Math.max(0, formPageCount - 1));
                      moveTo(4);
                      return;
                    }

                    moveTo(Math.max(1, step - 1));
                  }
                : undefined
            }
            onNext={() => {
              if (step === 1) {
                if (!isStepOneComplete()) {
                  markAllStepOneFieldsTouched();
                  setShowStepOneSummary(true);
                  return;
                }

                setShowStepOneSummary(false);
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
                if (!isLastFormPage) {
                  setFormPageIndex((current) => Math.min(current + 1, formPageCount - 1));
                  return;
                }
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

      {uploadError ? (
        <ModalShell onClose={() => setUploadError(null)} title={uploadError.title}>
          <div className="w-full space-y-5">
            <p className="text-base leading-8 text-slate-700">{uploadError.summary}</p>
            <p className="text-base leading-8 text-slate-700">{uploadError.rules}</p>
            <div className="flex justify-center">
              <button
                className="inline-flex items-center justify-center rounded-full bg-[#1b1b1b] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#2a2a2a]"
                onClick={() => setUploadError(null)}
                type="button"
              >
                Entendido
              </button>
            </div>
          </div>
        </ModalShell>
      ) : null}
    </main>
  );
}

function getNextLabel(
  step: number,
  isAnalyzing: boolean,
  isGenerating: boolean,
  isLastFormPage: boolean
) {
  if (step === 3) {
    return isAnalyzing ? "Personalizando..." : "Personalizar formulario";
  }

  if (step === 4) {
    return isLastFormPage ? "Continuar" : "Siguiente sección";
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

function DynamicSectionPage({
  section,
  answers,
  onAnswer,
  pageIndex,
  totalPages,
}: {
  section: DynamicSection;
  answers: DynamicAnswers;
  onAnswer: (questionId: string, value: DynamicAnswerValue) => void;
  pageIndex: number;
  totalPages: number;
}) {
  return (
    <section className="space-y-7">
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--form-outline-strong)]">
          Página {pageIndex + 1} de {totalPages}
        </div>
        <h3 className="font-display text-3xl font-black tracking-[-0.04em] text-[var(--form-ink)]">
          {section.title}
        </h3>
        <p className="text-sm leading-7 text-[var(--form-muted)]">{section.description}</p>
      </div>

      <div className="space-y-10">
        {section.questions.map((question, questionIndex) => (
          <div className="space-y-5" key={question.id}>
            <QuestionField
              answer={answers[question.id]}
              onAnswer={onAnswer}
              question={question}
            />
            {questionIndex < section.questions.length - 1 ? (
              <div className="h-px w-full bg-[rgba(194,198,216,0.62)]" />
            ) : null}
          </div>
        ))}
      </div>
    </section>
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
  const sliderBounds = (input: DynamicQuestion) => {
    if (input.options && input.options.length >= 2) {
      return {
        minLabel: input.options[0].label,
        maxLabel: input.options[input.options.length - 1].label,
      };
    }

    const normalizedLabel = input.label.toLowerCase();
    if (normalizedLabel.includes("fatiga") || normalizedLabel.includes("toler")) {
      return { minLabel: "Baja tolerancia", maxLabel: "Alta tolerancia" };
    }
    if (normalizedLabel.includes("energ")) {
      return { minLabel: "Energía baja", maxLabel: "Energía alta" };
    }
    if (normalizedLabel.includes("prior")) {
      return { minLabel: "Prioridad baja", maxLabel: "Prioridad alta" };
    }

    return { minLabel: "Nivel bajo", maxLabel: "Nivel alto" };
  };

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
    const currentValue =
      typeof answer === "number" && Number.isFinite(answer)
        ? Math.max(1, Math.min(5, Math.round(answer)))
        : 3;
    const levelSteps = [1, 2, 3, 4, 5];
    const { minLabel, maxLabel } = sliderBounds(question);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="form-ui-label">{question.label}</div>
            <p className="mt-2 text-sm leading-7 text-[var(--form-muted)]">{question.help}</p>
          </div>
          <span className="rounded-full border border-[var(--form-outline)] bg-white px-3 py-1 text-xs font-bold text-[var(--form-accent)]">
            Nivel {currentValue}
          </span>
        </div>

        <input
          aria-valuemax={5}
          aria-valuemin={1}
          aria-valuenow={currentValue}
          className="slider-accent h-2 w-full appearance-none rounded-full bg-[rgba(66,108,255,0.16)]"
          max={5}
          min={1}
          onChange={(event) => onAnswer(question.id, Number(event.target.value))}
          step={1}
          type="range"
          value={currentValue}
        />

        <div className="flex items-center justify-between px-1">
          {levelSteps.map((stepValue) => (
            <button
              aria-label={`Seleccionar nivel ${stepValue}`}
              className="group flex flex-col items-center gap-2"
              key={stepValue}
              onClick={() => onAnswer(question.id, stepValue)}
              type="button"
            >
              <span
                className={`h-2.5 w-2.5 rounded-full border transition ${
                  currentValue >= stepValue
                    ? "border-[var(--form-accent)] bg-[var(--form-accent)]"
                    : "border-[var(--form-outline)] bg-white group-hover:border-[var(--form-accent)]"
                }`}
              />
              <span
                className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                  currentValue === stepValue
                    ? "text-[var(--form-accent)]"
                    : "text-[var(--form-outline-strong)]"
                }`}
              >
                {stepValue}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--form-outline-strong)]">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
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
        <div className="flex flex-wrap gap-3">
          {question.options?.map((option) => {
            const selected = answer === option.value;

            return (
              <FormPillButton
                active={selected}
                key={option.value}
                onClick={() => onAnswer(question.id, option.value)}
              >
                {option.label}
              </FormPillButton>
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
            <BrandMark className="text-sm font-black text-[#1a1c1b]" />
            <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight text-slate-950">
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
