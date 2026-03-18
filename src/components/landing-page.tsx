import Link from "next/link";
import { ArrowRight, ChartSpline, Dumbbell, FileSpreadsheet, ScanEye, Sparkles } from "lucide-react";

import {
  ExcelMeshIllustration,
  HeroRoutineMachine,
  ProcessScanner,
} from "@/components/illustrations";

const features = [
  {
    icon: Dumbbell,
    title: "Rutinas específicas por disciplina",
    description:
      "Musculación, pesas, Hyrox y CrossFit bajo el mismo flujo, sin convertir cada caso en un formulario eterno.",
  },
  {
    icon: ScanEye,
    title: "Análisis visual opcional",
    description:
      "Sube vídeo o imágenes del físico para ajustar prioridades musculares, estabilidad y enfoque del bloque.",
  },
  {
    icon: FileSpreadsheet,
    title: "Excel editable al instante",
    description:
      "Exporta el mesociclo en una estructura editable para seguir cargas, repeticiones, RIR y cambios por sesión.",
  },
];

const processSteps = [
  {
    step: "Paso 1",
    title: "Contexto y rutina actual",
    text: "Texto libre o adjuntos para entender desde dónde parte el atleta. Todo opcional.",
  },
  {
    step: "Paso 2",
    title: "Visual opcional",
    text: "Vídeo corto o imágenes del físico para afinar la lectura técnica antes del formulario dinámico.",
  },
  {
    step: "Paso 3",
    title: "Formulario personalizado",
    text: "Gemini adapta las preguntas según el caso para no pedir lo mismo a todos.",
  },
  {
    step: "Paso 4",
    title: "Generación y ajustes",
    text: "Rutina clara en tablas, tooltips, cambios de ejercicio y exportación lista a Excel.",
  },
];

export function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_32%),radial-gradient(circle_at_80%_10%,_rgba(59,130,246,0.14),_transparent_28%),linear-gradient(180deg,_#f5fbff_0%,_#ffffff_42%,_#f8fbff_100%)]" />
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pb-20 pt-6 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between py-4">
            <Link className="font-display text-2xl font-semibold tracking-tight text-slate-950" href="/">
              MyCoach
            </Link>
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-white"
              href="/plan"
            >
              Empezar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </header>

          <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-700 shadow-sm">
                <Sparkles className="h-4 w-4" />
                Planificador técnico para atletas
              </div>

              <div className="space-y-5">
                <h1 className="font-display text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                  Crea mesociclos que se pueden ejecutar, revisar y exportar.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                  MyCoach es una plataforma para crear rutinas personalizadas de musculación, pesas, Hyrox y CrossFit con análisis de contexto, lectura visual opcional y exportación directa a Excel editable.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                  href="/plan"
                >
                  Iniciar proceso
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 px-6 py-4 text-sm font-semibold text-slate-700 transition hover:border-sky-200 hover:bg-white"
                  href="#como-funciona"
                >
                  Ver cómo funciona
                </a>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_25px_80px_-50px_rgba(14,116,144,0.45)] backdrop-blur">
                  <div className="text-3xl font-semibold text-slate-950">5</div>
                  <div className="mt-1 text-sm text-slate-500">pasos máximos para llegar a la rutina</div>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_25px_80px_-50px_rgba(14,116,144,0.45)] backdrop-blur">
                  <div className="text-3xl font-semibold text-slate-950">Excel</div>
                  <div className="mt-1 text-sm text-slate-500">editable con rotaciones y registro real</div>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white/80 p-4 shadow-[0_25px_80px_-50px_rgba(14,116,144,0.45)] backdrop-blur">
                  <div className="text-3xl font-semibold text-slate-950">IA</div>
                  <div className="mt-1 text-sm text-slate-500">para personalizar preguntas y rutina final</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-10 top-8 h-28 w-28 rounded-full bg-sky-200/50 blur-3xl" />
              <div className="absolute -right-8 bottom-8 h-36 w-36 rounded-full bg-blue-200/50 blur-3xl" />
              <div className="relative rounded-[2rem] border border-white/70 bg-white/70 p-6 shadow-[0_40px_120px_-50px_rgba(14,116,144,0.55)] backdrop-blur">
                <HeroRoutineMachine className="mx-auto" />
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                      <ChartSpline className="h-4 w-4" />
                      Rutina instantánea
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      Generación estructurada con lógica de progresión, foco muscular y control de fatiga.
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white/80 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <FileSpreadsheet className="h-4 w-4" />
                      Seguimiento
                    </div>
                    <p className="text-sm leading-6 text-slate-600">
                      Rotaciones, cambios de ejercicio y exportación a un formato tipo hoja de control.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_25px_90px_-60px_rgba(14,116,144,0.45)]"
                key={feature.title}
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-950">
                  {feature.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section
        className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8"
        id="como-funciona"
      >
        <div className="space-y-6">
          <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
            Flujo de producto
          </div>
          <h2 className="font-display text-4xl font-semibold tracking-tight text-slate-950">
            Un onboarding corto, visual y con preguntas que sí cambian el plan.
          </h2>
          <p className="max-w-xl text-base leading-8 text-slate-600">
            El usuario entra por una landing limpia, arranca un proceso tipo Typeform por bloques y solo ve un formulario personalizado después de que MyCoach haya entendido su contexto, su rutina actual y, si quiere, su físico.
          </p>
          <ProcessScanner />
        </div>

        <div className="grid gap-4">
          {processSteps.map((step) => (
            <article
              className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_-60px_rgba(14,116,144,0.42)]"
              key={step.step}
            >
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                {step.step}
              </div>
              <h3 className="font-display text-2xl font-semibold text-slate-950">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_-60px_rgba(14,116,144,0.45)]">
          <ExcelMeshIllustration />
        </div>
        <div className="space-y-5">
          <div className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
            SEO y conversión
          </div>
          <h2 className="font-display text-4xl font-semibold tracking-tight text-slate-950">
            Rutinas personalizadas, instantáneas y listas para seguir progresando.
          </h2>
          <p className="text-base leading-8 text-slate-600">
            La página explica justo lo que busca el usuario: creación de rutinas personalizadas, lectura del físico, registro de parámetros musculares y exportación editable a Excel para controlar la progresión del mesociclo.
          </p>
          <ul className="grid gap-3 text-sm leading-7 text-slate-600">
            <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              Rutinas de hipertrofia, pérdida de grasa, preparación para competición o mejora del rendimiento híbrido.
            </li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              Registro de cambios físicos, observaciones por sesión y espacio para editar ejercicios, cargas y RIR.
            </li>
            <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              Interfaz clara con tablas, tooltips, modales de ejercicio y cambios rápidos sin depender solo de un chat.
            </li>
          </ul>
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-800"
            href="/plan"
          >
            Abrir el constructor
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
