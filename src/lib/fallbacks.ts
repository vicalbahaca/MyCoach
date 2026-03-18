import type {
  AnalyzeIntakePayload,
  AttachmentDigest,
  Discipline,
  DynamicAnswers,
  DynamicQuestion,
  DynamicSection,
  ExercisePattern,
  GenerateRoutinePayload,
  IntakeAnalysis,
  IntakeProfile,
  ReviseRoutinePayload,
  RoutinePlan,
  SessionPlan,
} from "@/lib/types";

const ROTATION_LABELS = [
  "Rotación I",
  "Rotación II",
  "Rotación III",
  "Rotación IV",
];

function primaryDiscipline(profile: IntakeProfile): Discipline {
  if (profile.disciplines?.includes("hyrox")) return "hyrox";
  if (profile.disciplines?.includes("crossfit")) return "crossfit";
  if (profile.disciplines?.includes("strength")) return "strength";
  if (profile.disciplines?.includes("recomposition")) return "recomposition";
  return "bodybuilding";
}

function preferredDays(profile: IntakeProfile): 4 | 5 {
  return profile.daysPerWeek === "5" ? 5 : 4;
}

function choice(
  questionId: string,
  answers: DynamicAnswers,
  fallbackValue: string
): string {
  const value = answers[questionId];
  if (typeof value === "string" && value.trim()) return value;
  return fallbackValue;
}

function splitLabel(discipline: Discipline, days: 4 | 5) {
  if (discipline === "hyrox") {
    return days === 4
      ? "Fuerza híbrida 4 días + exposición específica"
      : "Híbrido 5 días con trabajo de carrera/ergos";
  }

  if (discipline === "crossfit") {
    return "Fuerza + skill + engine con control de fatiga";
  }

  return days === 4
    ? "Torso especializado 4 días"
    : "Pull / Push / Lower / Upper / Lower";
}

function makeRotations(
  reps: string,
  sets: number,
  baseRir: string,
  loadReference = "no disponible"
) {
  return [
    {
      label: ROTATION_LABELS[0],
      focus: "Base técnica",
      protocol: `${sets}x${reps} @${baseRir}. Busca un arranque limpio y deja margen real.`,
      loadReference,
    },
    {
      label: ROTATION_LABELS[1],
      focus: "Acumulación",
      protocol: `${sets}x${reps} @RIR 1. Sube 1-2 repeticiones o 2,5-5% si mantienes técnica.`,
      loadReference,
    },
    {
      label: ROTATION_LABELS[2],
      focus: "Pico productivo",
      protocol: `${sets}x${reps} @RIR 1-0 en la última serie estable. No fuerces repes sucias.`,
      loadReference,
    },
    {
      label: ROTATION_LABELS[3],
      focus: "Consolidación",
      protocol: `${sets}x${reps} @RIR 2. Baja fatiga acumulada y conserva rendimiento.`,
      loadReference,
    },
  ];
}

function exercise(
  id: string,
  name: string,
  pattern: ExercisePattern,
  category: string,
  reps: string,
  sets: number,
  notes: string,
  cue: string,
  whyThisExercise: string,
  alternatives: string[],
  overrides?: Partial<SessionPlan["exercises"][number]>
) {
  return {
    id,
    name,
    pattern,
    category,
    warmup: "1-2",
    rest: pattern === "squat" || pattern === "hinge" || pattern === "row" ? "2'-3'" : "1'30''-2'",
    technique: undefined,
    notes,
    sets,
    reps,
    rir: "RIR 2→0 según rotación",
    cue,
    whyThisExercise,
    alternatives,
    rotations: makeRotations(reps, sets, "RIR 2"),
    ...overrides,
  };
}

function bodybuilding4Sessions(): SessionPlan[] {
  return [
    {
      id: "upper-a",
      dayLabel: "Día 1",
      name: "Upper A",
      focus: "Pecho clavicular, dorsal y hombro lateral",
      duration: "75-95 min",
      recoveryTip: "Respira 2-3 min en compuestos y no persigas el fallo en todas las series.",
      exercises: [
        exercise(
          "dominadas-neutras",
          "Dominadas neutras lastradas / asistidas",
          "pulldown",
          "Dorsal",
          "6-10",
          3,
          "Empieza con depresión escapular y deja que el codo viaje hacia el costado.",
          "Cierra costillas y no balancees el tronco.",
          "Mantiene amplitud dorsal y da un patrón pesado de tracción vertical estable.",
          ["Jalón neutro convergente", "Jalón unilateral en polea"]
        ),
        exercise(
          "press-inclinado-maquina",
          "Press inclinado en máquina convergente",
          "press-incline",
          "Pecho clavicular",
          "8-12",
          3,
          "Banco suave 20-30°, recorrido estable y hombro fijado atrás y abajo.",
          "Piensa en acercar bíceps al esternón, no en empujar con deltoide.",
          "Prioriza el haz clavicular con más estabilidad que barra o multipower.",
          ["Press inclinado en Hammer Strength", "Apertura baja-alta en polea"]
        ),
        exercise(
          "remo-apoyo",
          "Remo con pecho apoyado agarre medio",
          "row",
          "Espalda alta",
          "8-12",
          3,
          "Recorrido controlado con pausa corta en retracción escapular.",
          "No conviertas la serie en una bisagra lumbar.",
          "Añade densidad y minimiza el peaje de estabilidad.",
          ["Remo unilateral guiado", "Remo sentado con soporte de pecho"]
        ),
        exercise(
          "laterales-sentado",
          "Elevaciones laterales sentado apoyado",
          "raise-lateral",
          "Deltoide lateral",
          "12-20",
          3,
          "Sube en el plano escapular y frena el trapecio.",
          "Lleva el codo, no la mano.",
          "Da frecuencia alta al hombro sin fatiga sistémica.",
          ["Laterales en máquina", "Laterales en polea desde cadera"]
        ),
        exercise(
          "curl-ez",
          "Curl de bíceps con barra Z",
          "curl",
          "Bíceps",
          "8-12",
          3,
          "Sin impulso de cadera y con hombro quieto.",
          "Mantén el antebrazo debajo del codo.",
          "Aísla bien el bíceps y permite progresar fácil.",
          ["Curl predicador", "Curl en polea baja con barra recta"]
        ),
        exercise(
          "triceps-overhead",
          "Extensión de tríceps overhead en polea",
          "triceps",
          "Tríceps",
          "10-15",
          3,
          "Busca estiramiento largo de la cabeza larga y codo estable.",
          "Cierra caja torácica y evita arquear la espalda.",
          "Refuerza el tríceps largo, clave en brazos largos.",
          ["Fondos en máquina para tríceps", "Press francés en polea"]
        ),
      ],
    },
    {
      id: "lower-a",
      dayLabel: "Día 2",
      name: "Lower A",
      focus: "Cuádriceps productivo y femoral a mantenimiento",
      duration: "70-90 min",
      recoveryTip: "No conviertas la pierna en una sesión de castigo si el objetivo principal está en torso.",
      exercises: [
        exercise(
          "extensora",
          "Extensión de rodilla",
          "leg-extension",
          "Cuádriceps",
          "10-15",
          3,
          "Usa pausa en acortamiento y rango cómodo de rodilla.",
          "Aprieta arriba sin despegar la cadera.",
          "Calienta el patrón y mete estímulo local sin fatiga lumbar.",
          ["Sissy squat asistida", "Spanish squat"]
        ),
        exercise(
          "hack",
          "Hack squat",
          "squat",
          "Cuádriceps",
          "6-10",
          3,
          "Profundidad consistente, pies donde más cargue cuádriceps sin dolor.",
          "Baja controlado y acelera con todo el pie.",
          "Mantiene masa de cuádriceps con un básico estable y medible.",
          ["Prensa inclinada alta estabilidad", "Pendulum squat"]
        ),
        exercise(
          "prensa",
          "Prensa de piernas",
          "squat",
          "Cuádriceps / glúteo",
          "10-15",
          2,
          "Usa un rango útil y evita rebote al fondo.",
          "No bloquees la rodilla arriba.",
          "Añade trabajo útil sin tener que subir demasiado el coste sistémico.",
          ["Belt squat", "Sentadilla en multipower"]
        ),
        exercise(
          "curl-sentado",
          "Curl femoral sentado",
          "leg-curl",
          "Femoral",
          "10-15",
          2,
          "Aprovecha el estiramiento largo y pausa breve en el acortamiento.",
          "Clava la cadera en el asiento.",
          "Da mantenimiento específico a isquios con buena relación estímulo/fatiga.",
          ["Curl femoral tumbado", "Curl unilateral"]
        ),
        exercise(
          "abduccion",
          "Abducción de cadera en máquina",
          "other",
          "Glúteo medio",
          "12-20",
          2,
          "Controla el retorno y evita balanceos.",
          "Saca la rodilla, no gires el tronco.",
          "Suma trabajo local sin interferir en los días fuertes.",
          ["Abducción en polea", "Monster walks"]
        ),
        exercise(
          "calf",
          "Elevación de talones en máquina",
          "calf",
          "Gemelos",
          "8-15",
          3,
          "Pausa abajo y arriba para evitar rebote.",
          "Deja que el tobillo recorra todo el rango.",
          "Compensa uno de los grupos que más suele rezagarse.",
          ["Gemelo sentado", "Gemelo en prensa"]
        ),
      ],
    },
    {
      id: "torso-b",
      dayLabel: "Día 3",
      name: "Torso B",
      focus: "Brazo, hombro y segunda exposición de pecho/dorsal",
      duration: "75-95 min",
      recoveryTip: "Este día debe sentirse productivo, no eterno. Corta ruido antes que sumar series vacías.",
      exercises: [
        exercise(
          "chest-press",
          "Chest press convergente estable",
          "press-horizontal",
          "Pecho",
          "8-12",
          2,
          "Agarres independientes y recorrido natural.",
          "Mantén el pecho alto y el hombro encajado.",
          "Suma volumen de pecho sin depender de un plano que suele cargarte más.",
          ["Press horizontal en Hammer", "Press unilateral en máquina"]
        ),
        exercise(
          "pullover",
          "Pull-over en polea",
          "pullover",
          "Dorsal",
          "10-15",
          2,
          "Brazos semirrígidos y foco en extensión de hombro.",
          "Piensa en acercar axila al bolsillo.",
          "Da trabajo limpio al dorsal sin meter más fatiga de bíceps.",
          ["Pullover en máquina", "Jalón brazos rectos"]
        ),
        exercise(
          "remo-unilateral",
          "Remo unilateral guiado",
          "row",
          "Espalda media",
          "8-12",
          2,
          "Codo a 45-60° si quieres más densidad de espalda alta.",
          "Pausa un instante donde más manden romboides y trapecio medio.",
          "Refuerza densidad y corrige desequilibrios laterales.",
          ["Remo en banco inclinado", "Remo sentado independiente"]
        ),
        exercise(
          "laterales-polea",
          "Laterales en polea unilateral",
          "raise-lateral",
          "Deltoide lateral",
          "12-20",
          3,
          "Tensión continua con polea saliendo desde cadera o algo atrás.",
          "No conviertas la serie en una elevación frontal.",
          "Mantiene frecuencia alta donde más impacto visual suele aportar.",
          ["Laterales en máquina", "Laterales apoyado en banco"]
        ),
        exercise(
          "curl-predicador",
          "Curl predicador con mancuerna o máquina",
          "curl",
          "Bíceps",
          "8-12",
          3,
          "Recorrido completo y sin despegar el brazo del apoyo.",
          "Controla el estiramiento abajo.",
          "Añade estímulo al bíceps donde las palancas largas suelen agradecer estabilidad.",
          ["Curl Bayesian", "Curl en banco inclinado"]
        ),
        exercise(
          "fondos-maquina",
          "Fondos en máquina para tríceps",
          "triceps",
          "Tríceps",
          "8-12",
          3,
          "Busca extensión fuerte sin hundir el hombro.",
          "Codo cerca del cuerpo y pecho quieto.",
          "Aporta una segunda vía potente para tríceps más allá del overhead.",
          ["Extensión prona en polea", "Press cerrado en máquina"]
        ),
      ],
    },
    {
      id: "lower-b",
      dayLabel: "Día 4",
      name: "Lower B",
      focus: "Posterior, glúteo y recordatorio de dorsal",
      duration: "70-85 min",
      recoveryTip: "Si la cadera o el piramidal cargan, reduce la agresividad de las bisagras y gana limpieza.",
      exercises: [
        exercise(
          "dominadas-recordatorio",
          "Jalón neutro convergente",
          "pulldown",
          "Dorsal",
          "8-12",
          2,
          "Bloque corto para recordar dorsal sin robarle energía al resto de la semana.",
          "No eleves hombros al tirar.",
          "Mantiene el dorsal como grupo prioritario sin inflar sesiones de torso.",
          ["Dominadas asistidas", "Jalón unilateral"]
        ),
        exercise(
          "curl-unilateral",
          "Curl femoral unilateral",
          "leg-curl",
          "Femoral",
          "10-15",
          3,
          "Trabajo controlado y simétrico, sin despegar pelvis.",
          "Deja la excéntrica más lenta que la concéntrica.",
          "Mejora el trabajo local del isquio sin recurrir a bisagras pesadas.",
          ["Curl sentado", "Curl tumbado"]
        ),
        exercise(
          "bisagra-ligera",
          "Peso muerto rumano con mancuernas",
          "hinge",
          "Cadena posterior",
          "8-10",
          2,
          "Bisagra corta y limpia, buscando isquio y glúteo, no récords.",
          "Mantén barra o mancuernas pegadas al muslo.",
          "Introduce patrón de bisagra con menos castigo que una variante más agresiva.",
          ["Hip thrust", "Pull-through"]
        ),
        exercise(
          "prensa-secundaria",
          "Prensa de piernas pies medios",
          "squat",
          "Cuádriceps",
          "12-15",
          2,
          "Trabajo secundario, sin perseguir fallo técnico.",
          "Quiero repeticiones útiles, no heroicidad.",
          "Sostiene la pierna con un volumen moderado.",
          ["Hack squat ligera", "Belt squat"]
        ),
        exercise(
          "abs",
          "Crunch en máquina / cable",
          "abs",
          "Core",
          "10-20",
          2,
          "Flexión controlada, pelvis estable y pausa en la contracción.",
          "No tires del cuello.",
          "Mete core real y mejora control del tronco en compuestos.",
          ["Leg raises", "Crunch declinado"]
        ),
      ],
    },
  ];
}

function bodybuilding5Sessions(): SessionPlan[] {
  return [
    {
      id: "pull-a",
      dayLabel: "Día 1",
      name: "Pull A",
      focus: "Dorsal y bíceps",
      duration: "75-90 min",
      recoveryTip: "No acortes descansos en remos y jalones si quieres seguir progresando.",
      exercises: [
        exercise(
          "dominadas-a",
          "Dominadas neutras / jalón neutro",
          "pulldown",
          "Dorsal",
          "6-10",
          3,
          "Patrón pesado principal de amplitud.",
          "Codo a costado y pecho arriba.",
          "Marca el tono dorsal de la semana.",
          ["Jalón convergente", "Jalón unilateral"]
        ),
        exercise(
          "remo-apoyado-a",
          "Remo con apoyo de pecho",
          "row",
          "Espalda media",
          "8-12",
          3,
          "Recorrido completo y lumbar fuera de juego.",
          "Tira con el codo, no con la mano.",
          "Refuerza densidad sin peaje de estabilidad.",
          ["Remo unilateral guiado", "Seal row"]
        ),
        exercise(
          "pullover-a",
          "Pull-over en polea",
          "pullover",
          "Dorsal",
          "10-15",
          2,
          "Extensión de hombro limpia y continua.",
          "Piensa en cerrar la axila.",
          "Completa el estímulo al dorsal.",
          ["Pullover en máquina", "Jalón brazos rectos"]
        ),
        exercise(
          "curl-ez-a",
          "Curl barra Z",
          "curl",
          "Bíceps",
          "8-12",
          3,
          "Sin balanceo.",
          "Muñeca neutra.",
          "Base de progresión sencilla para bíceps.",
          ["Curl predicador", "Curl en polea"]
        ),
        exercise(
          "rear-delt-a",
          "Reverse pec deck",
          "rear-delt",
          "Deltoide posterior",
          "12-20",
          2,
          "Codo abre, escápula controla.",
          "No tironees con trapecio.",
          "Añade trabajo visual al torso superior.",
          ["Pájaros en banco", "Face pull"]
        ),
      ],
    },
    {
      id: "push-a",
      dayLabel: "Día 2",
      name: "Push A",
      focus: "Pecho clavicular, lateral y tríceps",
      duration: "75-90 min",
      recoveryTip: "Busca sentir el pectoral primero; si manda deltoide anterior, baja ego y gana estabilidad.",
      exercises: [
        exercise(
          "press-inclinado-a",
          "Press inclinado convergente",
          "press-incline",
          "Pecho clavicular",
          "8-12",
          3,
          "Trabajo base de pecho.",
          "Hombro atrás y abajo.",
          "Priorización real del pectoral superior.",
          ["Press Hammer inclinado", "Apertura baja-alta"]
        ),
        exercise(
          "aperturas-a",
          "Aperturas en polea baja-alta",
          "fly",
          "Pecho clavicular",
          "10-15",
          2,
          "Busca posición larga sin dolor de hombro.",
          "Abraza y no cierres trapecio.",
          "Aporta estímulo en estiramiento con poco coste sistémico.",
          ["Pec deck alta", "Press convergente ligero"]
        ),
        exercise(
          "laterales-a",
          "Laterales sentado apoyado",
          "raise-lateral",
          "Deltoide lateral",
          "12-20",
          3,
          "Recorrido limpio y controlado.",
          "Codo guía.",
          "Da la dosis visual que más te interesa mantener alta.",
          ["Laterales en máquina", "Laterales en polea"]
        ),
        exercise(
          "triceps-overhead-a",
          "Extensión overhead en polea",
          "triceps",
          "Tríceps",
          "10-15",
          3,
          "Cabeza larga como foco.",
          "Codo fijo.",
          "Engorda el brazo donde más falta suele hacer.",
          ["Fondos en máquina", "Press francés en polea"]
        ),
      ],
    },
    {
      id: "lower-a-5",
      dayLabel: "Día 3",
      name: "Lower",
      focus: "Cuádriceps productivo",
      duration: "70-85 min",
      recoveryTip: "La pierna debe sumar, no robarte recuperación del torso.",
      exercises: [
        exercise(
          "extensora-5",
          "Extensora",
          "leg-extension",
          "Cuádriceps",
          "10-15",
          3,
          "Calienta y activa.",
          "Pausa arriba.",
          "Mete trabajo local sin fatiga extra.",
          ["Spanish squat", "Sissy asistida"]
        ),
        exercise(
          "hack-5",
          "Hack squat",
          "squat",
          "Cuádriceps",
          "6-10",
          3,
          "Profundidad útil y limpia.",
          "Todo el pie fuerte.",
          "Sostiene la masa de pierna con un básico medible.",
          ["Pendulum", "Belt squat"]
        ),
        exercise(
          "prensa-5",
          "Prensa",
          "squat",
          "Cuádriceps / glúteo",
          "10-15",
          2,
          "Volumen secundario útil.",
          "Sin rebote.",
          "Completa el trabajo dominante de cuádriceps.",
          ["Hack ligera", "Sentadilla en multipower"]
        ),
        exercise(
          "curl-5",
          "Curl femoral",
          "leg-curl",
          "Femoral",
          "10-15",
          2,
          "Mantenimiento de isquio.",
          "Excéntrica más lenta.",
          "Equilibra el bloque.",
          ["Curl sentado", "Curl unilateral"]
        ),
      ],
    },
    {
      id: "upper-b-5",
      dayLabel: "Día 4",
      name: "Upper",
      focus: "Espalda alta, pecho estable y brazos",
      duration: "75-90 min",
      recoveryTip: "No metas ruido. Si un ejercicio no aporta, aquí se nota rápido.",
      exercises: [
        exercise(
          "chest-press-5",
          "Chest press convergente",
          "press-horizontal",
          "Pecho",
          "8-12",
          2,
          "Segunda exposición estable de pecho.",
          "Mismo recorrido cada semana.",
          "Sube volumen útil sin meter un plano que te suele cargar.",
          ["Press unilateral en máquina", "Fondos asistidos pecho"]
        ),
        exercise(
          "row-5",
          "Remo unilateral guiado",
          "row",
          "Espalda media",
          "8-12",
          2,
          "Control y simetría.",
          "Pausa en retracción.",
          "Trabaja densidad con buen soporte.",
          ["Remo en banco inclinado", "Seal row"]
        ),
        exercise(
          "lat-pulldown-5",
          "Jalón neutro",
          "pulldown",
          "Dorsal",
          "8-12",
          2,
          "Mantén el dorsal mandando.",
          "Escápula baja primero.",
          "Sostiene prioridad dorsal.",
          ["Dominadas asistidas", "Jalón unilateral"]
        ),
        exercise(
          "curl-5-b",
          "Curl predicador",
          "curl",
          "Bíceps",
          "8-12",
          3,
          "Sin despegar brazo.",
          "Control abajo.",
          "Segunda vía de brazo con más estabilidad.",
          ["Curl en polea", "Curl inclinado"]
        ),
        exercise(
          "triceps-5-b",
          "Fondos en máquina para tríceps",
          "triceps",
          "Tríceps",
          "8-12",
          3,
          "Extensión fuerte sin colapsar hombro.",
          "Codo pega cerca del torso.",
          "Completa la prioridad de tríceps.",
          ["Press cerrado en máquina", "Extensión prona"]
        ),
      ],
    },
    {
      id: "lower-b-5",
      dayLabel: "Día 5",
      name: "Lower B",
      focus: "Posterior y recordatorio de core",
      duration: "65-80 min",
      recoveryTip: "Elige la variante de bisagra que no te cobre peaje en cadera o zona lumbar.",
      exercises: [
        exercise(
          "rumanos-5",
          "Peso muerto rumano con mancuernas",
          "hinge",
          "Cadena posterior",
          "8-10",
          2,
          "Bisagra limpia y sin buscar heroicidad.",
          "Cadera atrás, costillas cerradas.",
          "Conserva patrón posterior con menos desgaste que otras variantes.",
          ["Hip thrust", "Pull-through"]
        ),
        exercise(
          "curl-unilateral-5",
          "Curl femoral unilateral",
          "leg-curl",
          "Femoral",
          "10-15",
          3,
          "Aísla simetría y rango útil.",
          "No despeques pelvis.",
          "Suma posterior sin castigo sistémico.",
          ["Curl sentado", "Curl tumbado"]
        ),
        exercise(
          "calf-5",
          "Gemelo en máquina",
          "calf",
          "Gemelos",
          "8-15",
          3,
          "Pausa abajo y arriba.",
          "Tobillo completo.",
          "Repara un grupo que suele quedarse atrás.",
          ["Gemelo sentado", "Gemelo en prensa"]
        ),
        exercise(
          "abs-5",
          "Crunch en máquina",
          "abs",
          "Core",
          "10-20",
          2,
          "Controla la pelvis.",
          "No tires del cuello.",
          "Da trabajo real al tronco.",
          ["Leg raises", "Cable crunch"]
        ),
      ],
    },
  ];
}

function hyroxSessions(days: 4 | 5): SessionPlan[] {
  const base = [
    {
      id: "hyrox-strength-upper",
      dayLabel: "Día 1",
      name: "Strength Upper",
      focus: "Empuje, tracción y estabilidad escapular",
      duration: "70-90 min",
      recoveryTip: "Rinde fuerte en los básicos y guarda motor para el bloque híbrido.",
      exercises: [
        exercise(
          "hyrox-press",
          "Press inclinado en máquina",
          "press-incline",
          "Empuje",
          "6-10",
          3,
          "Trabajo estable para mantener fuerza útil sin fatiga articular extra.",
          "Barra o agarres siempre en la misma trayectoria.",
          "Da base de fuerza para empujes y salidas fuertes.",
          ["Press plano en máquina", "Push-up lastrado"]
        ),
        exercise(
          "hyrox-row",
          "Remo con pecho apoyado",
          "row",
          "Tracción horizontal",
          "8-12",
          3,
          "Remo estable y potente.",
          "Lleva el codo hacia atrás sin tirar de lumbar.",
          "Refuerza la postura para ergos y carries.",
          ["Seal row", "Remo sentado"]
        ),
        exercise(
          "hyrox-lat",
          "Jalón neutro",
          "pulldown",
          "Tracción vertical",
          "8-12",
          2,
          "Mantén hombro estable.",
          "Codo al costado.",
          "Equilibra el volumen superior sin robar demasiada recuperación.",
          ["Dominadas asistidas", "Jalón unilateral"]
        ),
        exercise(
          "hyrox-lat-raise",
          "Laterales en polea",
          "raise-lateral",
          "Hombro",
          "12-18",
          2,
          "Frecuencia ligera y controlada.",
          "No encogerte.",
          "Mantiene hombro sano y visualmente fuerte.",
          ["Laterales sentado", "Laterales en máquina"]
        ),
      ],
    },
    {
      id: "hyrox-strength-lower",
      dayLabel: "Día 2",
      name: "Strength Lower",
      focus: "Pierna fuerte con transferencia",
      duration: "70-90 min",
      recoveryTip: "Piensa en producción de fuerza y tolerancia, no en agujetas eternas.",
      exercises: [
        exercise(
          "hyrox-hack",
          "Hack squat",
          "squat",
          "Cuádriceps",
          "5-8",
          3,
          "Trabajo denso pero medido.",
          "Todo el pie fuerte.",
          "Construye pierna utilizable para el bloque híbrido.",
          ["Belt squat", "Prensa"]
        ),
        exercise(
          "hyrox-rdl",
          "Peso muerto rumano",
          "hinge",
          "Cadena posterior",
          "6-8",
          3,
          "Bisagra fuerte y técnica.",
          "Mantén tensión en isquio, no en lumbar.",
          "Refuerza zancada, trineo y carries.",
          ["Hip thrust", "Trap bar RDL"]
        ),
        exercise(
          "hyrox-sled",
          "Empuje de trineo",
          "carry",
          "Hyrox específico",
          "20-30 m",
          4,
          "Bloques cortos y potentes.",
          "Torso inclinado, brace y pasos constantes.",
          "Transfiere directo al evento y a la producción de fuerza horizontal.",
          ["Arrastre de trineo", "Farmer carry pesado"]
        ),
        exercise(
          "hyrox-core",
          "Carry unilateral",
          "carry",
          "Core / grip",
          "20-30 m",
          3,
          "Camina sin inclinarte.",
          "Costillas abajo.",
          "Mejora control del tronco y grip específico.",
          ["Farmer carry", "Suitcase carry"]
        ),
      ],
    },
    {
      id: "hyrox-hybrid",
      dayLabel: "Día 3",
      name: "Hybrid Day",
      focus: "Ergos, carrera y fuerza residual",
      duration: "55-75 min",
      recoveryTip: "La intensidad tiene que ser sostenible. No conviertas esto en una masacre semanal.",
      exercises: [
        exercise(
          "hyrox-ski",
          "Ski erg intervalado",
          "erg",
          "Engine",
          "6 x 250 m",
          1,
          "Ritmo de calidad con recuperación medible.",
          "Cierra dorsal y usa cadera.",
          "Da especificidad de Hyrox con control de carga.",
          ["Row erg", "Assault bike"]
        ),
        exercise(
          "hyrox-run",
          "Carrera tempo / intervalos",
          "conditioning",
          "Running",
          "20-30 min",
          1,
          "Bloque aeróbico o de tempo según nivel.",
          "Busca eficiencia, no solo sufrir.",
          "La carrera decide mucho del rendimiento híbrido.",
          ["Air runner", "Cinta inclinada"]
        ),
        exercise(
          "hyrox-burpee",
          "Burpee broad jumps",
          "conditioning",
          "Hyrox específico",
          "4 x 10-14",
          1,
          "Mantén técnica repetible y transición limpia.",
          "No dispares pulsaciones al techo desde el primer bloque.",
          "Da exposición real al patrón más incómodo de carrera.",
          ["Burpees estándar", "Box step-over rápido"]
        ),
      ],
    },
    {
      id: "hyrox-builder",
      dayLabel: "Día 4",
      name: "Support Builder",
      focus: "Brazo, core y tejidos que sostienen el bloque",
      duration: "50-65 min",
      recoveryTip: "Este día recupera y construye a la vez. Si llegas frito, baja el tono.",
      exercises: [
        exercise(
          "hyrox-pull",
          "Jalón unilateral",
          "pulldown",
          "Dorsal",
          "10-15",
          2,
          "Control del hombro y recorrido útil.",
          "Sin tirones.",
          "Equilibra mucho volumen de empuje/carry.",
          ["Pullover", "Jalón neutro"]
        ),
        exercise(
          "hyrox-biceps",
          "Curl en polea",
          "curl",
          "Bíceps",
          "10-15",
          2,
          "Brazo limpio y constante.",
          "No balancees.",
          "Refuerzo de codo y brazo sin demasiado coste.",
          ["Curl Z", "Curl martillo"]
        ),
        exercise(
          "hyrox-triceps",
          "Extensión en cuerda",
          "triceps",
          "Tríceps",
          "10-15",
          2,
          "Codo quieto y hombro abajo.",
          "Separa cuerda sin perder control.",
          "Ayuda a sostener empujes y estabilidad de codo.",
          ["Overhead rope extension", "Fondos máquina"]
        ),
        exercise(
          "hyrox-abs",
          "Cable crunch",
          "abs",
          "Core",
          "12-20",
          2,
          "Flexiona de verdad el tronco.",
          "Exhala en la contracción.",
          "El core tiene que aguantar carrera, carries y ergos.",
          ["Dead bug cargado", "Leg raises"]
        ),
      ],
    },
  ];

  if (days === 5) {
    base.splice(3, 0, {
      id: "hyrox-race-sim",
      dayLabel: "Día 4",
      name: "Race Simulation",
      focus: "Bloque combinado de carrera + estaciones",
      duration: "45-65 min",
      recoveryTip: "Compite contra tu pacing, no contra el ego de una sesión aislada.",
      exercises: [
        exercise(
          "hyrox-sim",
          "Circuito HYROX fraccionado",
          "conditioning",
          "Específico",
          "4-6 bloques",
          1,
          "Combina 500-1000 m de carrera con una estación técnica.",
          "Aprende a estabilizar la respiración después de cada bloque.",
          "Acerca el plan al formato competitivo sin romper la semana.",
          ["AMRAP de ergs + carries", "Simulación parcial de carrera"]
        ),
      ],
    });
    base[4] = { ...base[4], dayLabel: "Día 5" };
  }

  return base;
}

function crossfitSessions(): SessionPlan[] {
  return [
    {
      id: "cf-strength",
      dayLabel: "Día 1",
      name: "Strength + Skill",
      focus: "Sentadilla, tirón y habilidad",
      duration: "75-90 min",
      recoveryTip: "No quemes el WOD antes de llegar a él.",
      exercises: [
        exercise(
          "cf-squat",
          "Front squat",
          "squat",
          "Pierna / core",
          "4-6",
          4,
          "Bloque de fuerza limpio.",
          "Torso alto y brace constante.",
          "Da base útil para posiciones de receiving y volumen de pierna.",
          ["Back squat", "Hack squat"]
        ),
        exercise(
          "cf-row",
          "Remo con apoyo",
          "row",
          "Espalda",
          "8-12",
          3,
          "Trabajo de soporte para hombros y tracción.",
          "No robes con lumbar.",
          "Refuerza estabilidad para gimnásticos y halterofilia.",
          ["Pull-up estricto", "Seal row"]
        ),
        exercise(
          "cf-skill",
          "Bloque técnico de gimnasia",
          "skill",
          "Skill",
          "12-20 min",
          1,
          "Ring dips, kipping o handstand según nivel.",
          "Solo calidad técnica.",
          "El skill necesita frescura, no fatiga ciega.",
          ["Strict pull-ups", "Pike HSPU"]
        ),
        exercise(
          "cf-metcon",
          "Metcon corto",
          "conditioning",
          "Engine",
          "8-12 min",
          1,
          "Controla pacing y técnica.",
          "Arranca a un ritmo sostenible.",
          "Añade condición sin reventar la semana.",
          ["EMOM", "For time corto"]
        ),
      ],
    },
    {
      id: "cf-oly",
      dayLabel: "Día 2",
      name: "Oly + Upper",
      focus: "Potencia y soporte de torso",
      duration: "70-85 min",
      recoveryTip: "La técnica de halterofilia manda; si se cae, cortas antes.",
      exercises: [
        exercise(
          "cf-oly-main",
          "Power clean / power snatch técnico",
          "skill",
          "Power",
          "6-10 singles",
          1,
          "Técnica, velocidad y posiciones.",
          "Nunca persigas fatiga por encima de calidad.",
          "Aporta especificidad sin convertir la sesión en caos.",
          ["High pull", "Hang power clean"]
        ),
        exercise(
          "cf-press",
          "Press estricto o inclinado estable",
          "press-vertical",
          "Empuje",
          "6-10",
          3,
          "Refuerza hombro y press por encima de la cabeza.",
          "Glúteo y abdomen activos.",
          "Sostiene overhead y volumen de torso.",
          ["Landmine press", "Machine shoulder press"]
        ),
        exercise(
          "cf-pull",
          "Jalón / dominada estricta",
          "pulldown",
          "Tracción",
          "6-10",
          3,
          "Trabajo base de tracción vertical.",
          "No acortes rango.",
          "Equilibra el press y protege hombro.",
          ["Ring row", "Jalón neutro"]
        ),
        exercise(
          "cf-metcon-2",
          "WOD controlado",
          "conditioning",
          "Engine",
          "10-16 min",
          1,
          "Moderado-alto, pero medible.",
          "Pacing antes que heroísmo.",
          "Da exposición real al formato CrossFit.",
          ["Chipper corto", "Intervals"]
        ),
      ],
    },
    {
      id: "cf-lower",
      dayLabel: "Día 3",
      name: "Lower + Engine",
      focus: "Bisagra, unilateral y capacidad",
      duration: "70-85 min",
      recoveryTip: "La bisagra debe construir, no regalarte una lumbar inútil para el resto de la semana.",
      exercises: [
        exercise(
          "cf-rdl",
          "Peso muerto rumano",
          "hinge",
          "Posterior",
          "6-8",
          3,
          "Tensión en isquio y glúteo.",
          "Bisagra pura.",
          "Sostiene potencia y resiliencia posterior.",
          ["Trap bar deadlift", "Hip thrust"]
        ),
        exercise(
          "cf-split-squat",
          "Split squat búlgaro",
          "squat",
          "Pierna unilateral",
          "8-12",
          2,
          "Controla pelvis y rodilla.",
          "Baja donde puedas mandar en la rodilla delantera.",
          "Aporta estabilidad y trabajo útil en una sola pierna.",
          ["Step-up", "Lunge caminando"]
        ),
        exercise(
          "cf-core",
          "Farmer carry",
          "carry",
          "Core / grip",
          "20-30 m",
          3,
          "Camina compacto.",
          "No te inclines.",
          "Sirve para grip, tronco y patrón atlético.",
          ["Suitcase carry", "Yoke carry"]
        ),
        exercise(
          "cf-engine",
          "Intervals en remo / assault",
          "erg",
          "Engine",
          "8-12 min",
          1,
          "Trabajo de motor repetible.",
          "La técnica del erg manda.",
          "Acumula engine sin impacto articular extra.",
          ["Ski erg", "Carrera"]
        ),
      ],
    },
    {
      id: "cf-builder",
      dayLabel: "Día 4",
      name: "Builder Day",
      focus: "Tejidos, hombro y brazo",
      duration: "50-65 min",
      recoveryTip: "Este día cuida el cuerpo que sostiene el resto del bloque.",
      exercises: [
        exercise(
          "cf-lat-raise",
          "Laterales en polea",
          "raise-lateral",
          "Hombro",
          "12-20",
          2,
          "Trabajo estructural limpio.",
          "Sin trapecio.",
          "Protege hombro y mejora balance del torso.",
          ["Laterales sentado", "Y-raise"]
        ),
        exercise(
          "cf-triceps",
          "Extensión overhead",
          "triceps",
          "Tríceps",
          "10-15",
          2,
          "Cabeza larga y control.",
          "Codo quieto.",
          "Ayuda al overhead y a la salud de codo.",
          ["Fondos máquina", "Cuerda prona"]
        ),
        exercise(
          "cf-biceps",
          "Curl en polea",
          "curl",
          "Bíceps",
          "10-15",
          2,
          "Brazo limpio.",
          "Sin cadera.",
          "Refuerzo de codo y tracción.",
          ["Curl EZ", "Curl martillo"]
        ),
        exercise(
          "cf-mobility",
          "Bloque de movilidad guiada",
          "other",
          "Calidad de movimiento",
          "10-15 min",
          1,
          "Movilidad torácica, cadera y tobillo según limitación.",
          "Sin prisa.",
          "Permite sostener skill y volumen con menos peaje articular.",
          ["Foam rolling + respiración", "Mobility flow"]
        ),
      ],
    },
  ];
}

function disciplineSessions(profile: IntakeProfile): SessionPlan[] {
  const discipline = primaryDiscipline(profile);
  const days = preferredDays(profile);
  if (discipline === "hyrox") return hyroxSessions(days);
  if (discipline === "crossfit") return crossfitSessions();
  return days === 5 ? bodybuilding5Sessions() : bodybuilding4Sessions();
}

function seoAngle(profile: IntakeProfile) {
  const discipline = primaryDiscipline(profile);

  if (discipline === "hyrox") {
    return "Planificación híbrida con rutinas específicas de fuerza, carrera y exportación editable a Excel.";
  }

  if (discipline === "crossfit") {
    return "Programación personalizada de fuerza, skill y conditioning con seguimiento semanal editable.";
  }

  return "Rutinas personalizadas de musculación, pesas y recomposición con mesociclos editables y seguimiento de progresión.";
}

function defaultDynamicSections(profile: IntakeProfile): DynamicSection[] {
  const discipline = primaryDiscipline(profile);

  const common: DynamicQuestion[] = [
    {
      id: "priority_focus",
      label: "¿Qué bloque quieres que se vea realmente mejor al final del mesociclo?",
      help: "Esto decide qué grupos salen antes, cuáles reciben más estabilidad y dónde se gasta el volumen útil.",
      type: "radio",
      options: [
        { label: "Pecho y torso frontal", value: "chest" },
        { label: "Dorsal y amplitud", value: "dorsal" },
        { label: "Brazos y hombro", value: "arms" },
        { label: "Pierna completa", value: "legs" },
      ],
    },
    {
      id: "fatigue_tolerance",
      label: "¿Cuánto castigo semanal toleras sin que baje tu rendimiento o adherencia?",
      help: "Valor 1: muy poca tolerancia. Valor 5: puedes apretar bastante sin que se derrumbe la semana.",
      type: "slider",
      min: 1,
      max: 5,
      step: 1,
    },
    {
      id: "preferred_stability",
      label: "¿Qué prefieres para progresar mejor ahora mismo?",
      help: "La selección condiciona la calidad del estímulo, sobre todo si vienes cansado o con molestias.",
      type: "checkbox",
      options: [
        { label: "Máquinas convergentes", value: "machines" },
        { label: "Poleas", value: "cables" },
        { label: "Peso libre", value: "freeweights" },
        { label: "Guiados y apoyos de pecho", value: "supported" },
      ],
    },
    {
      id: "limitation_prompt",
      label: "¿Hay una molestia o ejercicio que quieras vigilar desde el minuto uno?",
      help: "Déjalo en una frase. Si no hay nada, salta este campo.",
      type: "textarea",
      placeholder: "Ej: hombro en empuje horizontal, ciática en bisagras, mala conexión en pecho...",
    },
  ];

  const recoverySection: DynamicSection = {
    id: "recovery",
    title: "Recuperación útil",
    description: "Cuanto mejor entendamos tu semana real, mejor saldrá el reparto del estímulo.",
    questions: [
      {
        id: "session_energy",
        label: "¿Con qué energía real llegas a entrenar la mayoría de días?",
        help: "No la energía ideal: la real.",
        type: "radio",
        options: [
          { label: "Muy alta", value: "high" },
          { label: "Estable", value: "steady" },
          { label: "Irregular", value: "mixed" },
          { label: "Justa", value: "low" },
        ],
      },
      {
        id: "session_cap",
        label: "¿Qué duración máxima quieres que respete el plan casi siempre?",
        help: "Esto evita meter sesiones perfectas sobre el papel pero malas en adherencia.",
        type: "radio",
        options: [
          { label: "45-60 min", value: "45-60" },
          { label: "60-75 min", value: "60-75" },
          { label: "75-90 min", value: "75-90" },
          { label: "90+ min", value: "90+" },
        ],
      },
      {
        id: "progress_style",
        label: "¿Cómo quieres progresar este bloque?",
        help: "La progresión principal del plan.",
        type: "radio",
        options: [
          { label: "Más repeticiones antes que carga", value: "reps-first" },
          { label: "Carga y repeticiones equilibradas", value: "balanced" },
          { label: "Más agresivo con la carga", value: "load-first" },
        ],
      },
    ],
  };

  if (discipline === "hyrox") {
    return [
      {
        id: "hyrox-priority",
        title: "Prioridad híbrida",
        description: "Definimos dónde debe ir la energía: motor, fuerza o ritmo competitivo.",
        questions: [
          {
            id: "hyrox_focus",
            label: "¿Qué quieres mejorar primero?",
            help: "Elige el cuello de botella real.",
            type: "radio",
            options: [
              { label: "Carrera y pacing", value: "running" },
              { label: "Ergos", value: "ergs" },
              { label: "Fuerza general", value: "strength" },
              { label: "Simulación Hyrox", value: "specificity" },
            ],
          },
          ...common.slice(1),
        ],
      },
      recoverySection,
    ];
  }

  if (discipline === "crossfit") {
    return [
      {
        id: "crossfit-priority",
        title: "Bloque CrossFit",
        description: "Ajustamos cuánto peso tiene fuerza, skill y motor en este ciclo.",
        questions: [
          {
            id: "crossfit_focus",
            label: "¿Dónde quieres subir más en este bloque?",
            help: "Elige una prioridad clara.",
            type: "radio",
            options: [
              { label: "Fuerza", value: "strength" },
              { label: "Gimnásticos / skill", value: "skill" },
              { label: "Metcons y motor", value: "engine" },
              { label: "Equilibrado", value: "balanced" },
            ],
          },
          ...common.slice(1),
        ],
      },
      recoverySection,
    ];
  }

  return [
    {
      id: "physique-priority",
      title: "Prioridad muscular",
      description: "Aquí concentramos el volumen que realmente mueve el físico.",
      questions: common,
    },
    {
      id: "stimulus-style",
      title: "Cómo quieres que pegue el bloque",
      description: "Pocas preguntas, pero las que de verdad cambian el mesociclo.",
      questions: [
        {
          id: "failure_usage",
          label: "¿Dónde te sienta mejor acercarte más al fallo?",
          help: "Puedes marcar más de una.",
          type: "checkbox",
          options: [
            { label: "Aislados estables", value: "isolations" },
            { label: "Máquinas de pecho/espalda", value: "machines" },
            { label: "Laterales y brazos", value: "arms-delts" },
            { label: "Prefiero dejar margen casi siempre", value: "conservative" },
          ],
        },
        {
          id: "technique_priority",
          label: "¿Qué necesitas que el plan cuide más?",
          help: "Esto decide orden, estabilidad y densidad de cada sesión.",
          type: "radio",
          options: [
            { label: "Más conexión con el músculo", value: "connection" },
            { label: "Más estabilidad", value: "stability" },
            { label: "Más progresión medible", value: "progression" },
            { label: "Más variedad útil", value: "variety" },
          ],
        },
      ],
    },
    recoverySection,
  ];
}

export function createFallbackAnalysis(
  payload: AnalyzeIntakePayload,
  attachments: AttachmentDigest
): IntakeAnalysis {
  const profile = payload.profile;
  const discipline = primaryDiscipline(profile);
  const days = preferredDays(profile);

  const contextNames = attachments.contextFiles.map((file) => file.name).join(", ");
  const visualNames = attachments.visualFiles.map((file) => file.name).join(", ");

  const signalSummary = [
    profile.objective
      ? `Objetivo principal detectado: ${profile.objective}.`
      : "No hay objetivo cerrado, así que el formulario empuja a concretar prioridades reales.",
    profile.currentRoutineText
      ? "Hay contexto de rutina actual, útil para personalizar la progresión y el punto de partida."
      : "No hay rutina escrita completa, así que conviene simplificar el cuestionario y priorizar adherencia.",
    contextNames
      ? `Se han adjuntado archivos de contexto: ${contextNames}.`
      : "No hay archivos de contexto, así que el bloque debe depender más del relato y de las elecciones del atleta.",
  ];

  const visualSignals =
    attachments.visualFiles.length > 0
      ? [
          `Se han recibido recursos visuales (${visualNames}). El formulario refuerza preguntas de balance muscular, estabilidad y zonas a priorizar.`,
        ]
      : [
          "No hay recursos visuales. El formulario mantiene un enfoque prudente y se apoya más en sensaciones, progresión y limitaciones.",
        ];

  return {
    signalSummary,
    visualSignals,
    planningNotes: [
      `Disciplina principal: ${discipline}.`,
      `Reparto recomendado por defecto: ${splitLabel(discipline, days)}.`,
      "Mantener la mayor parte de respuestas en formatos rápidos para no convertir el onboarding en un muro.",
    ],
    cautionFlags: [
      "Todos los campos siguen siendo opcionales y el flujo debe poder avanzar aunque no haya adjuntos.",
      "Si Gemini no está configurado, el motor usa una heurística conservadora y no inventa datos visuales.",
    ],
    recommendedSplit: splitLabel(discipline, days),
    seoAngle: seoAngle(profile),
    personalizedSections: defaultDynamicSections(profile),
    hiddenCoachNotes: [
      "Concentra el cuestionario en prioridades musculares, tolerancia al volumen y estabilidad.",
      "No conviertas el paso dinámico en una anamnesis infinita.",
    ],
  };
}

function routineHeadline(profile: IntakeProfile) {
  const discipline = primaryDiscipline(profile);

  if (discipline === "hyrox") return "Bloque híbrido listo para ejecutar";
  if (discipline === "crossfit") return "Plan de fuerza, skill y engine";
  return "Mesociclo listo para exportar y editar";
}

function athleteSnapshot(
  profile: IntakeProfile,
  analysis: IntakeAnalysis,
  answers: DynamicAnswers
) {
  return [
    profile.level ? `Nivel declarado: ${profile.level}.` : "Nivel no declarado: enfoque escalable.",
    profile.objective
      ? `Objetivo: ${profile.objective}.`
      : "Objetivo pendiente de concretar: el plan usa una base productiva y editable.",
    `Split sugerido: ${analysis.recommendedSplit}.`,
    `Prioridad detectada: ${choice("priority_focus", answers, "dorsal / torso")}.`,
  ];
}

export function createFallbackRoutine({
  profile,
  analysis,
  answers,
}: GenerateRoutinePayload): RoutinePlan {
  const discipline = primaryDiscipline(profile);
  const sessions = disciplineSessions(profile);

  return {
    headline: routineHeadline(profile),
    subtitle:
      discipline === "bodybuilding"
        ? "Rutina personalizada con foco en estímulo útil, estabilidad y progresión exportable a Excel."
        : "Estructura generada para mantener claridad, progresión y edición rápida en cada sesión.",
    mesocycleLabel: `MyCoach ${preferredDays(profile)} días`,
    split: splitLabel(discipline, preferredDays(profile)),
    objective:
      profile.objective ||
      "Crear un bloque claro, editable y con progresión real desde el punto de partida actual.",
    structureRationale: [
      "El reparto de días se ha comprimido para preservar adherencia y calidad del estímulo.",
      "Las rotaciones I-IV suben densidad, intensifican el bloque y consolidan antes del siguiente cambio.",
      "Las selecciones priorizan ejercicios más estables cuando el retorno es mejor que el coste de fatiga.",
    ],
    athleteSnapshot: athleteSnapshot(profile, analysis, answers),
    priorityTargets: [
      choice("priority_focus", answers, "dorsal y torso"),
      choice("technique_priority", answers, "progresión medible"),
      choice("session_cap", answers, profile.sessionLength || "60-75 min"),
    ],
    glossary: {
      mesocycle:
        "Un mesociclo es un bloque de varias semanas con una lógica de progresión concreta, no solo una suma de entrenos.",
      rir: "RIR indica cuántas repeticiones dejas en recámara antes del fallo técnico.",
      stimulus:
        "El estímulo útil es el trabajo que suma hipertrofia, fuerza o rendimiento sin inflar fatiga innecesaria.",
    },
    rotationLabels: ROTATION_LABELS,
    sessions,
    modificationHints: [
      "Pide cambios concretos: más pecho, menos bisagra, sesiones más cortas o más especificidad Hyrox/CrossFit.",
      "Si cambias material disponible, vuelve a regenerar para sustituir máquinas o patrones.",
    ],
  };
}

export function reviseFallbackRoutine(
  payload: ReviseRoutinePayload
): RoutinePlan {
  const nextProfile = { ...payload.profile };
  const prompt = payload.changeRequest.toLowerCase();

  if (prompt.includes("5 día") || prompt.includes("5 dias")) nextProfile.daysPerWeek = "5";
  if (prompt.includes("4 día") || prompt.includes("4 dias")) nextProfile.daysPerWeek = "4";
  if (prompt.includes("hyrox")) nextProfile.disciplines = ["hyrox"];
  if (prompt.includes("crossfit")) nextProfile.disciplines = ["crossfit"];
  if (prompt.includes("brazo")) payload.answers.priority_focus = "arms";
  if (prompt.includes("hombro")) payload.answers.priority_focus = "arms";
  if (prompt.includes("pecho")) payload.answers.priority_focus = "chest";
  if (prompt.includes("dorsal") || prompt.includes("espalda")) payload.answers.priority_focus = "dorsal";

  const routine = createFallbackRoutine({
    profile: nextProfile,
    analysis: payload.analysis,
    answers: payload.answers,
  });

  return {
    ...routine,
    subtitle: `${routine.subtitle} Ajuste aplicado: ${payload.changeRequest.trim()}.`,
  };
}
