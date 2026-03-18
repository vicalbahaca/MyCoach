import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  FileSpreadsheet,
  ScanEye,
  Sparkles,
} from "lucide-react";

import { generatedVisuals, landingPhotos } from "@/lib/visual-assets";

const pillars = [
  {
    icon: ScanEye,
    title: "Formulario que cambia según el caso",
    text: "MyCoach lee contexto, rutina actual y material visual opcional antes de decidir qué preguntas merece la pena hacer.",
  },
  {
    icon: Dumbbell,
    title: "Rutinas pensadas para culturismo, fuerza e híbrido",
    text: "Musculación, pesas, Hyrox y CrossFit dentro de una misma plataforma, pero con una lógica distinta para cada perfil.",
  },
  {
    icon: FileSpreadsheet,
    title: "Exportación a Excel con estructura real",
    text: "Mesociclos listos para editar, registrar cargas, modificar sesiones y seguir la progresión sin romper el bloque.",
  },
] as const;

const process = [
  {
    step: "01",
    title: "Contexto y rutina actual",
    text: "Texto libre o adjuntos para partir desde lo que el atleta ya hace, no desde una hoja en blanco genérica.",
  },
  {
    step: "02",
    title: "Visual opcional",
    text: "Vídeo o imágenes del físico para ajustar prioridades musculares, estabilidad, torso-pierna y sesgos del patrón.",
  },
  {
    step: "03",
    title: "Preguntas dinámicas",
    text: "La plataforma no repite el mismo onboarding a todo el mundo: adapta bloques, foco muscular y logística semanal.",
  },
  {
    step: "04",
    title: "Rutina editable y exportable",
    text: "Vista clara en tarjetas y tablas, modales de técnica, cambio de ejercicio y exportación al Excel del mesociclo.",
  },
] as const;

const proofPoints = [
  "Rutinas personalizadas para hipertrofia, preparación híbrida, recomposición y rendimiento específico.",
  "Registro técnico de ejercicios, prioridades musculares, RIR, rotaciones y cambios por sesión.",
  "Lectura visual opcional para decidir si conviene especializar torso, bajar frecuencia o reajustar patrones.",
] as const;

export function LandingPage() {
  return (
    <main className="page-haze overflow-hidden pb-16">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between py-6">
          <Link
            className="font-display text-2xl font-semibold tracking-tight text-slate-950"
            href="/"
          >
            MyCoach
          </Link>
          <div className="flex items-center gap-3">
            <a
              className="hidden rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-white sm:inline-flex"
              href="#proceso"
            >
              Cómo funciona
            </a>
            <Link className="black-button px-5 py-3 text-sm" href="/plan">
              Empezar
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </header>

        <section className="grid gap-10 pt-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center lg:pt-12">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-700 shadow-[var(--shadow-soft)]">
              <Sparkles className="h-4 w-4 text-[var(--primary)]" />
              Planificación premium para atletas y coaches
            </div>

            <div className="space-y-5">
              <h1 className="font-display text-5xl font-semibold tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-7xl">
                Crea mesociclos visuales, técnicos y exportables sin encerrar todo en un chat.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                MyCoach es una plataforma para crear rutinas personalizadas de musculación,
                pesas, Hyrox y CrossFit con análisis de contexto, lectura visual opcional
                del físico y exportación inmediata a Excel editable.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className="black-button px-6 py-4 text-sm" href="/plan">
                Iniciar el proceso
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                className="ghost-button px-6 py-4 text-sm"
                href="#seo"
              >
                Ver el flujo completo
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard label="Paso a rutina" value="5 bloques" />
              <StatCard label="Exportación" value="Excel real" />
              <StatCard label="Salida final" value="Tabla + modales" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-8 h-44 w-44 rounded-full bg-[rgba(66,108,255,0.15)] blur-3xl" />
            <div className="absolute bottom-0 right-8 h-56 w-56 rounded-full bg-[rgba(162,191,255,0.22)] blur-3xl" />
            <div className="relative grid gap-5 lg:grid-cols-[minmax(0,0.76fr)_minmax(0,0.24fr)]">
              <article className="editorial-card overflow-hidden p-4 md:p-5">
                <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-[#f8f7f2]">
                  <Image
                    alt="Mockup premium del dashboard de MyCoach"
                    className="h-auto w-full"
                    height={980}
                    priority
                    src={generatedVisuals.phoneHero}
                    width={520}
                  />
                </div>
              </article>

              <div className="grid gap-5">
                <article className="editorial-card p-4">
                  <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-[#f9fafc]">
                    <Image
                      alt="Máquina visual que convierte contexto en rutina editable"
                      className="h-auto w-full"
                      height={720}
                      src={generatedVisuals.routineMachine}
                      width={720}
                    />
                  </div>
                </article>
                <article className="editorial-card p-4">
                  <div className="space-y-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
                      Panel editorial
                    </div>
                    <p className="font-display text-2xl font-semibold tracking-tight text-slate-950">
                      Menos ruido, más decisiones útiles.
                    </p>
                    <p className="text-sm leading-7 text-slate-600">
                      Cada paso recoge justo lo necesario para generar un bloque con
                      contexto real y salida editable.
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 py-16 lg:grid-cols-3">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <article className="editorial-card hover-lift p-7" key={pillar.title}>
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-950">
                  {pillar.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{pillar.text}</p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-8 py-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
          <div className="space-y-5">
            <div className="inline-flex rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-600">
              Look & feel
            </div>
            <h2 className="font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Interfaz de app premium con lectura técnica, no estética SaaS estándar.
            </h2>
            <p className="max-w-xl text-base leading-8 text-slate-600">
              El sistema visual mezcla shells móviles, tarjetas limpias y ritmo editorial
              para que el producto se sienta más cerca de una app de alto ticket que de
              un formulario largo con botones genéricos.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-[minmax(0,0.64fr)_minmax(0,0.36fr)]">
            <article className="editorial-card overflow-hidden p-4">
              <div className="relative overflow-hidden rounded-[28px]">
                <Image
                  alt={landingPhotos[0].alt}
                  className="h-[480px] w-full object-cover"
                  height={1201}
                  src={landingPhotos[0].src}
                  width={1800}
                />
                <div className="absolute inset-x-4 bottom-4 rounded-[28px] border border-white/50 bg-white/86 p-4 backdrop-blur">
                  <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--primary)]">
                    Análisis opcional
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Sube vídeo o imágenes del físico para personalizar el formulario y el
                    foco del mesociclo antes de generar la rutina.
                  </p>
                </div>
              </div>
            </article>

            <div className="grid gap-5">
              <article className="editorial-card overflow-hidden p-4">
                <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-[#f9fafc]">
                  <Image
                    alt="Mockup de onboarding mobile-first de MyCoach"
                    className="h-auto w-full"
                    height={980}
                    src={generatedVisuals.phoneOnboarding}
                    width={520}
                  />
                </div>
              </article>
              <article className="editorial-card overflow-hidden p-4">
                <div className="overflow-hidden rounded-[26px]">
                  <Image
                    alt={landingPhotos[3].alt}
                    className="h-[216px] w-full object-cover"
                    height={1800}
                    src={landingPhotos[3].src}
                    width={1171}
                  />
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          className="grid gap-8 py-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
          id="proceso"
        >
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-600">
              Flujo MyCoach
            </div>
            <h2 className="font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Un proceso corto, visual y orientado a mesociclos que sí se pueden seguir.
            </h2>
            <p className="max-w-xl text-base leading-8 text-slate-600">
              La landing atrae por SEO y claridad. El onboarding entra por móvil, el
              formulario se adapta al caso y la salida final se enseña como un workspace
              editable, no como un simple bloque de texto.
            </p>

            <div className="editorial-card overflow-hidden p-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,0.54fr)_minmax(0,0.46fr)]">
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#f9fafc]">
                  <Image
                    alt="Ilustración de escaneo corporal y personalización visual"
                    className="h-auto w-full"
                    height={900}
                    src={generatedVisuals.bodyScan}
                    width={760}
                  />
                </div>
                <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#f9fafc]">
                  <Image
                    alt={landingPhotos[1].alt}
                    className="h-full w-full object-cover"
                    height={1333}
                    src={landingPhotos[1].src}
                    width={1800}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {process.map((item) => (
              <article className="editorial-card hover-lift p-6" key={item.step}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--primary)]">
                    Paso {item.step}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
                <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] lg:items-center" id="seo">
          <div className="editorial-card overflow-hidden p-5">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.52fr)_minmax(0,0.48fr)]">
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#f9fafc]">
                <Image
                  alt="Gráfico editorial de progresión del mesociclo"
                  className="h-auto w-full"
                  height={760}
                  src={generatedVisuals.mesocycleGraph}
                  width={1200}
                />
              </div>
              <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-[#f9fafc]">
                <Image
                  alt="Mockup del resultado final del mesociclo dentro de MyCoach"
                  className="h-auto w-full"
                  height={980}
                  src={generatedVisuals.phoneRoutine}
                  width={520}
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-600">
              SEO y conversión
            </div>
            <h2 className="font-display text-4xl font-semibold tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Rutinas personalizadas instantáneas con registro técnico y salida editable.
            </h2>
            <p className="text-base leading-8 text-slate-600">
              La página trabaja las búsquedas importantes: rutinas personalizadas,
              mesociclos, musculación, Hyrox, CrossFit, lectura visual del físico y
              exportación a Excel. El mensaje es claro para SEO y útil para conversión.
            </p>

            <div className="grid gap-3">
              {proofPoints.map((point) => (
                <div
                  className="flex items-start gap-3 rounded-[24px] border border-slate-200 bg-white/88 px-4 py-4"
                  key={point}
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--primary)]" />
                  <p className="text-sm leading-7 text-slate-700">{point}</p>
                </div>
              ))}
            </div>

            <Link className="black-button px-6 py-4 text-sm" href="/plan">
              Abrir el constructor
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="editorial-card p-5">
      <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-semibold tracking-tight text-slate-950">
        {value}
      </div>
    </div>
  );
}
