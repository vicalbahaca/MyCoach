import type { ExercisePattern } from "@/lib/types";

export const generatedVisuals = {
  routineMachine: "/generated/routine-export-machine.svg",
  bodyScan: "/generated/body-scan-analysis.svg",
  mesocycleGraph: "/generated/mesocycle-progress.svg",
  phoneHero: "/generated/phone-hero-overview.svg",
  phoneOnboarding: "/generated/phone-onboarding.svg",
  phoneRoutine: "/generated/phone-routine.svg",
  loader: "/generated/loader-orbit.svg",
} as const;

export const photoLibrary = {
  bodybuilder: {
    id: "bodybuilder",
    src: "/photos/bodybuilder-workout.jpg",
    alt: "Atleta de fuerza entrenando en sala de musculación.",
  },
  crossfit: {
    id: "crossfit",
    src: "/photos/crossfit-ben-smith.jpg",
    alt: "Atleta de CrossFit compitiendo en exterior.",
  },
  gymWoman: {
    id: "gymWoman",
    src: "/photos/gym-athlete-woman.jpg",
    alt: "Atleta femenina entrenando con mancuernas en gimnasio.",
  },
  workoutRoom: {
    id: "workoutRoom",
    src: "/photos/workout-room.jpg",
    alt: "Sala de entrenamiento con zona de pesas y máquinas.",
  },
} as const;

export const landingPhotos = [
  photoLibrary.gymWoman,
  photoLibrary.bodybuilder,
  photoLibrary.crossfit,
  photoLibrary.workoutRoom,
] as const;

export const editorialMockups = [
  generatedVisuals.phoneHero,
  generatedVisuals.phoneOnboarding,
  generatedVisuals.phoneRoutine,
] as const;

const exerciseMediaByPattern: Partial<
  Record<
    ExercisePattern,
    {
      src: string;
      alt: string;
    }
  >
> = {
  "press-incline": {
    src: photoLibrary.gymWoman.src,
    alt: "Referencia visual de empuje estable en entorno de gimnasio.",
  },
  "press-horizontal": {
    src: photoLibrary.bodybuilder.src,
    alt: "Referencia visual de trabajo de torso en máquina o mancuernas.",
  },
  fly: {
    src: photoLibrary.gymWoman.src,
    alt: "Referencia visual de aislamiento de pectoral en gimnasio.",
  },
  row: {
    src: photoLibrary.bodybuilder.src,
    alt: "Referencia visual de tracción para espalda en sala de musculación.",
  },
  pulldown: {
    src: photoLibrary.bodybuilder.src,
    alt: "Referencia visual de trabajo de dorsal con patrón vertical.",
  },
  pullover: {
    src: photoLibrary.bodybuilder.src,
    alt: "Referencia visual de dorsal y control escapular en gimnasio.",
  },
  squat: {
    src: photoLibrary.workoutRoom.src,
    alt: "Entorno de entrenamiento orientado a trabajo pesado de pierna.",
  },
  hinge: {
    src: photoLibrary.crossfit.src,
    alt: "Referencia visual de potencia y cadena posterior en contexto híbrido.",
  },
  "leg-curl": {
    src: photoLibrary.workoutRoom.src,
    alt: "Referencia visual de trabajo de femoral en sala de entrenamiento.",
  },
  "leg-extension": {
    src: photoLibrary.workoutRoom.src,
    alt: "Referencia visual de trabajo de cuádriceps en máquina.",
  },
  calf: {
    src: photoLibrary.workoutRoom.src,
    alt: "Referencia visual de trabajo de gemelo en gimnasio.",
  },
  abs: {
    src: photoLibrary.crossfit.src,
    alt: "Referencia visual de trabajo global atlético e intensidad controlada.",
  },
  "raise-lateral": {
    src: photoLibrary.gymWoman.src,
    alt: "Referencia visual de trabajo específico de hombro lateral.",
  },
  "rear-delt": {
    src: photoLibrary.gymWoman.src,
    alt: "Referencia visual de trabajo de deltoide posterior.",
  },
  curl: {
    src: photoLibrary.bodybuilder.src,
    alt: "Referencia visual de trabajo de brazo en contexto de hipertrofia.",
  },
  triceps: {
    src: photoLibrary.bodybuilder.src,
    alt: "Referencia visual de trabajo de tríceps con enfoque técnico.",
  },
  carry: {
    src: photoLibrary.crossfit.src,
    alt: "Referencia visual de trabajo híbrido y atlético.",
  },
  erg: {
    src: photoLibrary.crossfit.src,
    alt: "Referencia visual de acondicionamiento y rendimiento híbrido.",
  },
  conditioning: {
    src: photoLibrary.crossfit.src,
    alt: "Referencia visual de preparación híbrida y acondicionamiento.",
  },
  skill: {
    src: photoLibrary.crossfit.src,
    alt: "Referencia visual de trabajo técnico en contexto atlético.",
  },
};

export function getExerciseVisual(pattern: ExercisePattern) {
  return exerciseMediaByPattern[pattern] || null;
}
