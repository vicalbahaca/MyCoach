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
  GenerateRoutinePayload,
  IntakeAnalysis,
  IntakeProfile,
  ReviseRoutinePayload,
  RoutinePlan,
  SessionPlan,
} from "@/lib/types";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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
  return JSON.stringify(profile, null, 2);
}

function asPromptAnswers(answers: DynamicAnswers) {
  return JSON.stringify(answers, null, 2);
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

async function callGeminiJson<T>(
  systemInstruction: string,
  parts: GeminiPart[],
  schema: unknown
): Promise<T> {
  const client = getClient();

  if (!client) {
    throw new Error("Gemini API key missing");
  }

  console.log("[Gemini] Outgoing request", {
    model: DEFAULT_MODEL,
    systemInstruction,
    parts: describeGeminiParts(parts),
    schema,
  });

  const response = await client.models.generateContent({
    model: DEFAULT_MODEL,
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
      temperature: 0.4,
    },
  });

  const raw = response.text?.trim();

  if (!raw) {
    throw new Error("Gemini returned an empty response");
  }

  console.log("[Gemini] Raw response", raw);

  return JSON.parse(raw) as T;
}

function analysisPrompt(payload: AnalyzeIntakePayload, attachments: AttachmentDigest) {
  return [
    "Analiza el onboarding de MyCoach para preparar un formulario dinámico, corto y accionable.",
    "No redactes motivacional. No inventes señales visuales si no son claras.",
    "Quiero máximo 3 secciones y entre 3 y 5 preguntas por sección.",
    "Prioriza radios, checkboxes y sliders. Usa solo 1-2 campos abiertos si aportan valor real.",
    "Todos los campos deben seguir siendo opcionales.",
    "La plataforma sirve para musculación, pesas, Hyrox y CrossFit.",
    "Contexto del atleta y onboarding base:",
    asPromptProfile(payload.profile),
    "Resumen de archivos adjuntos:",
    attachmentsDigestText(attachments) || "Sin archivos adjuntos.",
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
): Promise<IntakeAnalysis> {
  try {
    return await callGeminiJson<IntakeAnalysis>(
      "Eres el motor de onboarding de MyCoach. Generas formularios cortos, precisos y accionables para entrenadores y atletas. No inventas observaciones si faltan datos.",
      [
        { text: analysisPrompt(payload, attachments) },
        ...attachmentsToGeminiParts(attachments),
      ],
      analysisSchema
    );
  } catch {
    return createFallbackAnalysis(payload, attachments);
  }
}

export async function generateRoutine(
  payload: GenerateRoutinePayload
): Promise<RoutinePlan> {
  try {
    const routine = await callGeminiJson<RoutinePlan>(
      "Eres el motor de programación de MyCoach. Diseñas bloques limpios, útiles y con criterio biomecánico. Priorizas lo que más retorno da para el objetivo indicado.",
      [{ text: generationPrompt(payload) }],
      routineSchema
    );

    return hydrateRoutine(routine);
  } catch {
    return createFallbackRoutine(payload);
  }
}

export async function reviseRoutine(
  payload: ReviseRoutinePayload
): Promise<RoutinePlan> {
  try {
    const routine = await callGeminiJson<RoutinePlan>(
      "Eres el motor de revisión de MyCoach. Modificas rutinas con criterio técnico, manteniendo coherencia entre selección de ejercicios, volumen y recuperación.",
      [{ text: revisionPrompt(payload) }],
      routineSchema
    );

    return hydrateRoutine(routine);
  } catch {
    return reviseFallbackRoutine(payload);
  }
}
