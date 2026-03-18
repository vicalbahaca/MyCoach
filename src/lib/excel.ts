import * as XLSX from "xlsx";

import type { RoutinePlan } from "@/lib/types";

const COLUMN_WIDTHS = [
  { wch: 4 },
  { wch: 34 },
  { wch: 14 },
  { wch: 16 },
  { wch: 14 },
  { wch: 48 },
  { wch: 4 },
  { wch: 10 },
  { wch: 12 },
  { wch: 16 },
  { wch: 42 },
  { wch: 4 },
  { wch: 22 },
  { wch: 22 },
  { wch: 22 },
  { wch: 22 },
  { wch: 22 },
  { wch: 22 },
];

function buildSummarySheet(routine: RoutinePlan) {
  const rows = [
    ["MyCoach", routine.headline],
    ["Subtítulo", routine.subtitle],
    ["Mesociclo", routine.mesocycleLabel],
    ["Split", routine.split],
    ["Objetivo", routine.objective],
    [],
    ["Resumen atleta"],
    ...routine.athleteSnapshot.map((item) => ["", item]),
    [],
    ["Prioridades"],
    ...routine.priorityTargets.map((item) => ["", item]),
    [],
    ["Racional del bloque"],
    ...routine.structureRationale.map((item) => ["", item]),
    [],
    ["Glosario"],
    ["Mesociclo", routine.glossary.mesocycle],
    ["RIR", routine.glossary.rir],
    ["Estímulo", routine.glossary.stimulus],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = [{ wch: 18 }, { wch: 120 }];
  return sheet;
}

function buildMesocycleSheet(routine: RoutinePlan) {
  const rows: (string | number | null)[][] = [];
  const merges: XLSX.Range[] = [];

  rows.push([
    null,
    `${routine.mesocycleLabel} · ${routine.split}`,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ]);
  merges.push({ s: { r: 0, c: 1 }, e: { r: 0, c: 10 } });

  routine.sessions.forEach((session) => {
    const startRow = rows.length;
    rows.push([
      null,
      null,
      session.dayLabel,
      null,
      null,
      null,
      null,
      "PROTOCOLO",
      null,
      null,
      null,
      null,
      "CONTROL / ROTACIONES",
      null,
      null,
      null,
      null,
      null,
    ]);
    rows.push([
      null,
      null,
      `${session.name} · ${session.focus}`,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      null,
      routine.rotationLabels[0] || "Rotación I",
      routine.rotationLabels[1] || "Rotación II",
      routine.rotationLabels[2] || "Rotación III",
      routine.rotationLabels[3] || "Rotación IV",
      "Rotación V",
      "Rotación VI",
    ]);
    rows.push([
      null,
      "Ejercicios",
      "Series de aproximación",
      "Tiempo de descanso",
      "Técnica",
      "Observaciones",
      null,
      "Series",
      "Rango Reps",
      "Rir / Rpe",
      "Detalle de protocolo",
      null,
      "Peso usado, reps y rir real",
      "Peso usado, reps y rir real",
      "Peso usado, reps y rir real",
      "Peso usado, reps y rir real",
      "Peso usado, reps y rir real",
      "Peso usado, reps y rir real",
    ]);

    session.exercises.forEach((exercise) => {
      const [rotation1, rotation2, rotation3, rotation4] = exercise.rotations;
      rows.push([
        null,
        exercise.name,
        exercise.warmup,
        exercise.rest,
        exercise.technique || "",
        exercise.notes,
        null,
        exercise.sets,
        exercise.reps,
        exercise.rir,
        rotation1?.protocol || `${exercise.sets}x${exercise.reps}`,
        null,
        rotation1?.loadReference || "no disponible",
        rotation2?.loadReference || "no disponible",
        rotation3?.loadReference || "no disponible",
        rotation4?.loadReference || "no disponible",
        "",
        "",
      ]);
    });

    rows.push([]);

    merges.push({ s: { r: startRow, c: 2 }, e: { r: startRow, c: 5 } });
    merges.push({ s: { r: startRow, c: 7 }, e: { r: startRow, c: 10 } });
    merges.push({ s: { r: startRow, c: 12 }, e: { r: startRow, c: 17 } });
    merges.push({ s: { r: startRow + 1, c: 2 }, e: { r: startRow + 1, c: 5 } });
  });

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = COLUMN_WIDTHS;
  sheet["!merges"] = merges;
  return sheet;
}

function buildExerciseSheet(routine: RoutinePlan) {
  const rows: (string | number)[][] = [
    ["Sesión", "Ejercicio", "Por qué está aquí", "Cue principal", "Alternativas"],
  ];

  routine.sessions.forEach((session) => {
    session.exercises.forEach((exercise) => {
      rows.push([
        session.name,
        exercise.name,
        exercise.whyThisExercise,
        exercise.cue,
        exercise.alternatives.join(" | "),
      ]);
    });
  });

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = [
    { wch: 18 },
    { wch: 34 },
    { wch: 48 },
    { wch: 32 },
    { wch: 40 },
  ];
  return sheet;
}

export function createRoutineWorkbook(routine: RoutinePlan) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, buildSummarySheet(routine), "Resumen");
  XLSX.utils.book_append_sheet(workbook, buildMesocycleSheet(routine), "Mesociclo");
  XLSX.utils.book_append_sheet(workbook, buildExerciseSheet(routine), "Ejercicios");
  return workbook;
}

export function exportRoutineWorkbook(routine: RoutinePlan) {
  const workbook = createRoutineWorkbook(routine);
  const safeName = routine.mesocycleLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  XLSX.writeFile(workbook, `${safeName || "mycoach-mesociclo"}.xlsx`);
}
