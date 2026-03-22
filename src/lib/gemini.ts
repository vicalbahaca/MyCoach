import { GoogleGenAI } from "@google/genai";

import { createFallbackAnalysis, createFallbackRoutine, reviseFallbackRoutine } from "@/lib/fallbacks";
import {
  attachmentsDigestText,
  attachmentsToGeminiParts,
} from "@/lib/file-intelligence";
import type {
  AnalyzeIntakePayload,
  AttachmentDigest,
  DynamicAnswers,
  ExercisePlan,
  GeminiUsage,
  GenerateRoutinePayload,
  IntakeAnalysis,
  IntakeProfile,
  ReviseRoutinePayload,
  RoutinePlan,
  SessionPlan,
} from "@/lib/types";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ANALYZE_MODEL = process.env.GEMINI_ANALYZE_MODEL || DEFAULT_MODEL;

function positiveIntFromEnv(value: string | undefined, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const ANALYZE_MAX_OUTPUT_TOKENS = positiveIntFromEnv(
  process.env.GEMINI_ANALYZE_MAX_OUTPUT_TOKENS,
  1800
);
const ANALYZE_TIMEOUT_MS = positiveIntFromEnv(
  process.env.GEMINI_ANALYZE_TIMEOUT_MS,
  15000
);

const INPUT_PRICE_PER_1M = Number.parseFloat(
  process.env.GEMINI_INPUT_PRICE_PER_1M_USD ?? ""
);
const OUTPUT_PRICE_PER_1M = Number.parseFloat(
  process.env.GEMINI_OUTPUT_PRICE_PER_1M_USD ?? ""
);

type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

const analysisSchema = {
  type: "object",
  required: [
    "signalSummary",
    "visualSignals",
    "planningNotes",
    "cautionFlags",
    "recommendedSplit",
    "seoAngle",
    "personalizedSections",
    "hiddenCoachNotes",
  ],
  properties: {
    signalSummary: { type: "array", items: { type: "string" } },
    visualSignals: { type: "array", items: { type: "string" } },
    planningNotes: { type: "array", items: { type: "string" } },
    cautionFlags: { type: "array", items: { type: "string" } },
    recommendedSplit: { type: "string" },
    seoAngle: { type: "string" },
    hiddenCoachNotes: { type: "array", items: { type: "string" } },
    personalizedSections: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "title", "description", "questions"],
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          questions: {
            type: "array",
            items: {
              type: "object",
              required: ["id", "label", "help", "type"],
              properties: {
                id: { type: "string" },
                label: { type: "string" },
                help: { type: "string" },
                required: { type: "boolean" },
                type: {
                  type: "string",
                  enum: ["radio", "checkbox", "slider", "text", "textarea"],
                },
                placeholder: { type: "string" },
                min: { type: "number" },
                max: { type: "number" },
                step: { type: "number" },
                options: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["label", "value"],
                    properties: {
                      label: { type: "string" },
                      value: { type: "string" },
                      description: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

const routineSchema = {
  type: "object",
  required: [
    "headline",
    "subtitle",
    "mesocycleLabel",
    "split",
    "objective",
    "structureRationale",
    "athleteSnapshot",
    "priorityTargets",
    "glossary",
    "rotationLabels",
    "sessions",
    "modificationHints",
  ],
  properties: {
    headline: { type: "string" },
    subtitle: { type: "string" },
    mesocycleLabel: { type: "string" },
    split: { type: "string" },
    objective: { type: "string" },
    structureRationale: { type: "array", items: { type: "string" } },
    athleteSnapshot: { type: "array", items: { type: "string" } },
    priorityTargets: { type: "array", items: { type: "string" } },
    modificationHints: { type: "array", items: { type: "string" } },
    rotationLabels: { type: "array", items: { type: "string" } },
    glossary: {
      type: "object",
      required: ["mesocycle", "rir", "stimulus"],
      properties: {
        mesocycle: { type: "string" },
        rir: { type: "string" },
        stimulus: { type: "string" },
      },
    },
    sessions: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "dayLabel", "name", "focus", "duration", "recoveryTip", "exercises"],
        properties: {
          id: { type: "string" },
          dayLabel: { type: "string" },
          name: { type: "string" },
          focus: { type: "string" },
          duration: { type: "string" },
          recoveryTip: { type: "string" },
          exercises: {
            type: "array",
            items: {
              type: "object",
              required: [
                "id",
                "name",
                "category",
                "pattern",
                "warmup",
                "rest",
                "notes",
                "sets",
                "reps",
                "rir",
                "cue",
                "whyThisExercise",
                "alternatives",
                "rotations",
              ],
              properties: {
                id: { type: "string" },
                name: { type: "string" },
                category: { type: "string" },
                pattern: { type: "string" },
                warmup: { type: "string" },
                rest: { type: "string" },
                technique: { type: "string" },
                notes: { type: "string" },
                sets: { type: "number" },
                reps: { type: "string" },
                rir: { type: "string" },
                cue: { type: "string" },
                whyThisExercise: { type: "string" },
                alternatives: { type: "array", items: { type: "string" } },
                rotations: {
                  type: "array",
                  items: {
                    type: "object",
                    required: ["label", "focus", "protocol", "loadReference"],
                    properties: {
                      label: { type: "string" },
                      focus: { type: "string" },
                      protocol: { type: "string" },
                      loadReference: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} as const;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function asPromptProfile(profile: IntakeProfile) {
  return JSON.stringify(profile);
}

function asPromptAnswers(answers: DynamicAnswers) {
  return JSON.stringify(answers);
}

function describeGeminiParts(parts: GeminiPart[]) {
  return parts.map((part, index) => {
    if ("text" in part) {
      return {
        index,
        type: "text",
        preview: part.text.slice(0, 800),
      };
    }

    return {
      index,
      type: "inlineData",
      mimeType: part.inlineData.mimeType,
      approxBytes: Math.round((part.inlineData.data.length * 3) / 4),
    };
  });
}

function hasFiniteNumber(value: number) {
  return Number.isFinite(value) && value >= 0;
}

function normalizeTokenCount(value: unknown) {
  if (typeof value !== "number") return 0;
  return hasFiniteNumber(value) ? value : 0;
}

function estimateGeminiCostUsd(promptTokens: number, responseTokens: number) {
  const hasInputPrice = hasFiniteNumber(INPUT_PRICE_PER_1M);
  const hasOutputPrice = hasFiniteNumber(OUTPUT_PRICE_PER_1M);
  if (!hasInputPrice || !hasOutputPrice) return null;

  const inputCost = (promptTokens / 1_000_000) * INPUT_PRICE_PER_1M;
  const outputCost = (responseTokens / 1_000_000) * OUTPUT_PRICE_PER_1M;
  return Number((inputCost + outputCost).toFixed(8));
}

function extractUsage(
  response: unknown,
  label: GeminiUsage["label"],
  model: string
): GeminiUsage | null {
  if (!response || typeof response !== "object") return null;
  const usageRaw =
    "usageMetadata" in response &&
    response.usageMetadata &&
    typeof response.usageMetadata === "object"
      ? response.usageMetadata
      : null;

  if (!usageRaw) return null;

  const usage = usageRaw as Record<string, unknown>;
  const promptTokens = normalizeTokenCount(usage.promptTokenCount);
  const responseTokens = normalizeTokenCount(
    usage.responseTokenCount ?? usage.candidatesTokenCount
  );
  const totalTokens = normalizeTokenCount(usage.totalTokenCount);
  const cachedTokens = normalizeTokenCount(usage.cachedContentTokenCount);
  const thoughtsTokens = normalizeTokenCount(usage.thoughtsTokenCount);
  const toolUsePromptTokens = normalizeTokenCount(usage.toolUsePromptTokenCount);

  return {
    label,
    model,
    promptTokens,
    responseTokens,
    totalTokens,
    cachedTokens,
    thoughtsTokens,
    toolUsePromptTokens,
    estimatedCostUsd: estimateGeminiCostUsd(promptTokens, responseTokens),
    inputPricePerMillionUsd: hasFiniteNumber(INPUT_PRICE_PER_1M) ? INPUT_PRICE_PER_1M : null,
    outputPricePerMillionUsd: hasFiniteNumber(OUTPUT_PRICE_PER_1M)
      ? OUTPUT_PRICE_PER_1M
      : null,
  };
}

type GeminiCallOptions = {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  timeoutMs?: number;
};

async function callGeminiJson<T>(
  systemInstruction: string,
  parts: GeminiPart[],
  schema: unknown,
  label: "intake-analyze" | "routine-generate" | "routine-revise",
  options: GeminiCallOptions = {}
): Promise<{ data: T; usage: GeminiUsage | null }> {
  const client = getClient();

  if (!client) {
    throw new Error("Gemini API key missing");
  }

  const startedAt = Date.now();
  const requestId = `${label}-${startedAt}`;
  const model = options.model || DEFAULT_MODEL;
  const temperature = options.temperature ?? 0.4;

  console.log("[Gemini] request:start", {
    requestId,
    label,
    model,
    systemInstructionPreview: systemInstruction.slice(0, 180),
    parts: describeGeminiParts(parts),
    schemaType: typeof schema,
    maxOutputTokens: options.maxOutputTokens ?? null,
    timeoutMs: options.timeoutMs ?? null,
  });

  const requestPromise = client.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts,
      },
    ],
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: schema as never,
      temperature,
      ...(options.maxOutputTokens ? { maxOutputTokens: options.maxOutputTokens } : {}),
    },
  });

  const response = (await (options.timeoutMs
    ? Promise.race([
        requestPromise,
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`Gemini timeout after ${options.timeoutMs}ms`));
          }, options.timeoutMs);
        }),
      ])
    : requestPromise)) as Awaited<typeof requestPromise>;

  console.log("[Gemini] request:response", {
    requestId,
    label,
    durationMs: Date.now() - startedAt,
  });

  const usage = extractUsage(response, label, model);
  if (usage) {
    console.log("[Gemini] request:usage", {
      requestId,
      usage,
    });
  } else {
    console.log("[Gemini] request:usage", {
      requestId,
      usage: null,
    });
  }

  const raw = response.text?.trim();

  if (!raw) {
    throw new Error("Gemini returned an empty response");
  }

  console.log("[Gemini] request:raw", {
    requestId,
    label,
    rawLength: raw.length,
    rawPreview: raw.slice(0, 800),
  });

  const parsed = JSON.parse(raw) as T;

  console.log("[Gemini] request:parsed", {
    requestId,
    label,
    totalDurationMs: Date.now() - startedAt,
  });

  return { data: parsed, usage };
}

function analysisPrompt(payload: AnalyzeIntakePayload, attachments: AttachmentDigest) {
  const referenceSections = createFallbackAnalysis(payload, attachments).personalizedSections;
  const compactReferenceCatalog = referenceSections.map((section) => ({
    id: section.id,
    title: section.title,
    description: section.description,
    questions: section.questions.slice(0, 6).map((question) => ({
      id: question.id,
      label: question.label,
      type: question.type,
      required: Boolean(question.required),
      options:
        question.options?.slice(0, 8).map((option) => ({
          label: option.label,
          value: option.value,
        })) || undefined,
    })),
  }));
  const compactAttachmentsDigest = (attachmentsDigestText(attachments) || "Sin archivos adjuntos.")
    .replace(/\s+/g, " ")
    .slice(0, 2600);

  return [
    "Objetivo: generar un formulario dinámico, breve y accionable para personalizar la rutina.",
    "No inventes señales visuales ambiguas. Usa solo lo que sea claro.",
    "Devuelve 3-5 secciones con 3-5 preguntas por sección.",
    "Prioriza radio/checkbox/slider y usa text/textarea solo cuando cambie decisiones del plan.",
    "required=true solo en preguntas críticas; el resto opcional.",
    "Regla sliders: min=1, max=5, step=1. Incluye en help qué significa 1 y qué significa 5.",
    "Compatibilidad de disciplina: musculación, pesas, Hyrox y CrossFit.",
    "El frontend muestra páginas bajo encabezado fijo FORMULARIO; mantén secciones limpias y claras.",
    "Perfil:",
    asPromptProfile(payload.profile),
    "Resumen de adjuntos:",
    compactAttachmentsDigest,
    "Catálogo de referencia (resumido):",
    JSON.stringify(compactReferenceCatalog),
    "Devuelve SOLO JSON válido con el esquema pedido.",
  ].join("\n\n");
}

function generationPrompt(payload: GenerateRoutinePayload) {
  return [
    "Actúa como un preparador técnico experto en hipertrofia, biomecánica y planificación de rendimiento.",
    "Devuelve una estructura de rutina usable en producto, no un ensayo.",
    "Necesito un mesociclo editable con 4 rotaciones.",
    "Cada sesión debe tener entre 4 y 7 ejercicios.",
    "Cada ejercicio debe incluir: sets, reps, RIR, descanso, una nota técnica, un cue corto, por qué está ahí y 2-3 alternativas.",
    "Las rotaciones deben describir cómo cambia el protocolo en Rotación I-IV y mantener la misma estructura base.",
    "Si faltan datos, no inventes cargas: usa 'no disponible'.",
    "No hagas una rutina absurda por querer cubrir todo; prioriza calidad del estímulo y adherencia.",
    "Perfil:",
    asPromptProfile(payload.profile),
    "Análisis previo:",
    JSON.stringify(payload.analysis, null, 2),
    "Respuestas del formulario personalizado:",
    asPromptAnswers(payload.answers),
    "Devuelve SOLO JSON válido.",
  ].join("\n\n");
}

function revisionPrompt(payload: ReviseRoutinePayload) {
  return [
    "Revisa y modifica la rutina actual de MyCoach.",
    "Cambia solo lo necesario para cumplir la petición del atleta.",
    "Mantén la misma calidad técnica y la misma estructura JSON.",
    "Si la petición implica cambiar split o prioridades, rehace la selección para que siga teniendo sentido como bloque real.",
    "Perfil:",
    asPromptProfile(payload.profile),
    "Análisis previo:",
    JSON.stringify(payload.analysis, null, 2),
    "Respuestas del formulario:",
    asPromptAnswers(payload.answers),
    "Rutina actual:",
    JSON.stringify(payload.currentRoutine, null, 2),
    `Petición de cambio: ${payload.changeRequest}`,
    "Devuelve SOLO JSON válido.",
  ].join("\n\n");
}

function safeId(value: string, index: number) {
  const normalized = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return normalized || `item-${index + 1}`;
}

function normalizeExercise(exercise: ExercisePlan, exerciseIndex: number): ExercisePlan {
  return {
    ...exercise,
    id: exercise.id || safeId(exercise.name, exerciseIndex),
    pattern: exercise.pattern || "other",
    warmup: exercise.warmup || "1-2",
    rest: exercise.rest || "1'30''-2'",
    notes: exercise.notes || "Sin nota específica.",
    cue: exercise.cue || "Controla la técnica durante todo el rango.",
    whyThisExercise:
      exercise.whyThisExercise || "Elegido por su relación entre estímulo, estabilidad y progresión.",
    alternatives:
      exercise.alternatives && exercise.alternatives.length > 0
        ? exercise.alternatives
        : ["Alternativa no disponible"],
    rotations:
      exercise.rotations && exercise.rotations.length > 0
        ? exercise.rotations.slice(0, 4)
        : [
            {
              label: "Rotación I",
              focus: "Base técnica",
              protocol: `${exercise.sets || 3}x${exercise.reps || "8-12"} @RIR 2`,
              loadReference: "no disponible",
            },
          ],
  };
}

function normalizeSessions(sessions: SessionPlan[]) {
  return sessions.map((session, sessionIndex) => ({
    ...session,
    id: session.id || safeId(session.name, sessionIndex),
    dayLabel: session.dayLabel || `Día ${sessionIndex + 1}`,
    name: session.name || `Sesión ${sessionIndex + 1}`,
    focus: session.focus || "Bloque principal",
    duration: session.duration || "60-90 min",
    recoveryTip:
      session.recoveryTip || "Mantén la calidad del estímulo y no fuerces repeticiones sucias.",
    exercises: (session.exercises || []).map(normalizeExercise),
  }));
}

function hydrateRoutine(routine: RoutinePlan): RoutinePlan {
  return {
    ...routine,
    headline: routine.headline || "Rutina MyCoach",
    subtitle: routine.subtitle || "Plan editable generado por MyCoach.",
    mesocycleLabel: routine.mesocycleLabel || "Mesociclo MyCoach",
    split: routine.split || "Split no especificado",
    objective: routine.objective || "Objetivo no especificado",
    structureRationale:
      routine.structureRationale?.length > 0
        ? routine.structureRationale
        : ["Estructura generada para priorizar adherencia y progresión."],
    athleteSnapshot:
      routine.athleteSnapshot?.length > 0
        ? routine.athleteSnapshot
        : ["Sin resumen automático disponible."],
    priorityTargets:
      routine.priorityTargets?.length > 0
        ? routine.priorityTargets
        : ["Prioridad no especificada"],
    modificationHints:
      routine.modificationHints?.length > 0
        ? routine.modificationHints
        : ["Pide cambios concretos para regenerar el bloque."],
    rotationLabels:
      routine.rotationLabels?.length === 4
        ? routine.rotationLabels
        : ["Rotación I", "Rotación II", "Rotación III", "Rotación IV"],
    glossary: {
      mesocycle:
        routine.glossary?.mesocycle ||
        "Bloque de varias semanas con una lógica de progresión concreta.",
      rir:
        routine.glossary?.rir || "Repeticiones en recámara antes del fallo técnico.",
      stimulus:
        routine.glossary?.stimulus ||
        "Trabajo útil que suma adaptación sin inflar fatiga innecesaria.",
    },
    sessions: normalizeSessions(routine.sessions || []),
  };
}

export async function generateIntakeAnalysis(
  payload: AnalyzeIntakePayload,
  attachments: AttachmentDigest
): Promise<{ analysis: IntakeAnalysis; usage: GeminiUsage | null }> {
  try {
    const response = await callGeminiJson<IntakeAnalysis>(
      "Eres el motor de onboarding de MyCoach. Generas formularios cortos, precisos y accionables para entrenadores y atletas. No inventas observaciones si faltan datos.",
      [
        { text: analysisPrompt(payload, attachments) },
        ...attachmentsToGeminiParts(attachments),
      ],
      analysisSchema,
      "intake-analyze",
      {
        model: ANALYZE_MODEL,
        temperature: 0.2,
        maxOutputTokens: ANALYZE_MAX_OUTPUT_TOKENS,
        timeoutMs: ANALYZE_TIMEOUT_MS,
      }
    );
    return { analysis: response.data, usage: response.usage };
  } catch (error) {
    console.error("[Gemini] intake-analyze:fallback", {
      reason: error instanceof Error ? error.message : "Unknown error",
    });
    return { analysis: createFallbackAnalysis(payload, attachments), usage: null };
  }
}

export async function generateRoutine(
  payload: GenerateRoutinePayload
): Promise<{ routine: RoutinePlan; usage: GeminiUsage | null }> {
  try {
    const response = await callGeminiJson<RoutinePlan>(
      "Eres el motor de programación de MyCoach. Diseñas bloques limpios, útiles y con criterio biomecánico. Priorizas lo que más retorno da para el objetivo indicado.",
      [{ text: generationPrompt(payload) }],
      routineSchema,
      "routine-generate"
    );

    return {
      routine: hydrateRoutine(response.data),
      usage: response.usage,
    };
  } catch {
    return { routine: createFallbackRoutine(payload), usage: null };
  }
}

export async function reviseRoutine(
  payload: ReviseRoutinePayload
): Promise<{ routine: RoutinePlan; usage: GeminiUsage | null }> {
  try {
    const response = await callGeminiJson<RoutinePlan>(
      "Eres el motor de revisión de MyCoach. Modificas rutinas con criterio técnico, manteniendo coherencia entre selección de ejercicios, volumen y recuperación.",
      [{ text: revisionPrompt(payload) }],
      routineSchema,
      "routine-revise"
    );

    return {
      routine: hydrateRoutine(response.data),
      usage: response.usage,
    };
  } catch {
    return { routine: reviseFallbackRoutine(payload), usage: null };
  }
}
