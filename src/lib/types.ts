export type Discipline =
  | "bodybuilding"
  | "hyrox"
  | "crossfit"
  | "strength"
  | "powerlifting"
  | "weightlifting"
  | "running"
  | "hybrid-endurance"
  | "calisthenics"
  | "general-fitness"
  | "recomposition";

export type QuestionType =
  | "radio"
  | "checkbox"
  | "slider"
  | "text"
  | "textarea";

export type QuestionOption = {
  label: string;
  value: string;
  description?: string;
};

export type DynamicQuestion = {
  id: string;
  label: string;
  help: string;
  type: QuestionType;
  required?: boolean;
  placeholder?: string;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  step?: number;
};

export type DynamicSection = {
  id: string;
  title: string;
  description: string;
  questions: DynamicQuestion[];
};

export type IntakeProfile = {
  sex?: string;
  level?: string;
  yearsTraining?: string;
  weight?: string;
  height?: string;
  diet?: string;
  objective?: string;
  currentTraining?: string;
  currentContext?: string;
  currentRoutineText?: string;
  trainingGoal?: string;
  daysPerWeek?: string;
  sessionLength?: string;
  equipment?: string;
  disciplines?: string[];
  limitationNotes?: string;
};

export type AnalyzeIntakePayload = {
  profile: IntakeProfile;
};

export type GeminiUsage = {
  label: "intake-analyze" | "routine-generate" | "routine-revise";
  model: string;
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  cachedTokens: number;
  thoughtsTokens: number;
  toolUsePromptTokens: number;
  estimatedCostUsd: number | null;
  inputPricePerMillionUsd: number | null;
  outputPricePerMillionUsd: number | null;
};

export type UploadedAssetKind = "context" | "visual";

export type UploadedAsset = {
  kind: UploadedAssetKind;
  name: string;
  pathname: string;
  url: string;
  contentType: string;
  size: number;
};

export type AnalyzeIntakeRequest = {
  payload: AnalyzeIntakePayload;
  contextFiles?: UploadedAsset[];
  visualFiles?: UploadedAsset[];
};

export type IntakeAnalysis = {
  signalSummary: string[];
  visualSignals: string[];
  planningNotes: string[];
  cautionFlags: string[];
  recommendedSplit: string;
  seoAngle: string;
  personalizedSections: DynamicSection[];
  hiddenCoachNotes: string[];
};

export type DynamicAnswerValue = string | string[] | number;

export type DynamicAnswers = Record<string, DynamicAnswerValue | undefined>;

export type ExercisePattern =
  | "press-incline"
  | "press-horizontal"
  | "press-vertical"
  | "fly"
  | "row"
  | "pulldown"
  | "pullover"
  | "squat"
  | "hinge"
  | "leg-curl"
  | "leg-extension"
  | "calf"
  | "abs"
  | "raise-lateral"
  | "rear-delt"
  | "curl"
  | "triceps"
  | "carry"
  | "erg"
  | "conditioning"
  | "skill"
  | "other";

export type ExerciseRotation = {
  label: string;
  focus: string;
  protocol: string;
  loadReference: string;
};

export type ExercisePlan = {
  id: string;
  name: string;
  category: string;
  pattern: ExercisePattern;
  warmup: string;
  rest: string;
  technique?: string;
  notes: string;
  sets: number;
  reps: string;
  rir: string;
  cue: string;
  whyThisExercise: string;
  alternatives: string[];
  rotations: ExerciseRotation[];
};

export type SessionPlan = {
  id: string;
  dayLabel: string;
  name: string;
  focus: string;
  duration: string;
  recoveryTip: string;
  exercises: ExercisePlan[];
};

export type RoutineGlossary = {
  mesocycle: string;
  rir: string;
  stimulus: string;
};

export type RoutinePlan = {
  headline: string;
  subtitle: string;
  mesocycleLabel: string;
  split: string;
  objective: string;
  structureRationale: string[];
  athleteSnapshot: string[];
  priorityTargets: string[];
  glossary: RoutineGlossary;
  rotationLabels: string[];
  sessions: SessionPlan[];
  modificationHints: string[];
};

export type GenerateRoutinePayload = {
  profile: IntakeProfile;
  analysis: IntakeAnalysis;
  answers: DynamicAnswers;
};

export type ReviseRoutinePayload = GenerateRoutinePayload & {
  currentRoutine: RoutinePlan;
  changeRequest: string;
};

export type ProcessedAttachment = {
  name: string;
  kind: "context" | "visual";
  mimeType: string;
  size: number;
  extractedText?: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  note?: string;
};

export type AttachmentDigest = {
  contextFiles: ProcessedAttachment[];
  visualFiles: ProcessedAttachment[];
};
