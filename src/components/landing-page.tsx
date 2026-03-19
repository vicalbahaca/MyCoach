import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  Bolt,
  CalendarRange,
  ChevronRight,
  CircleUserRound,
  Dumbbell,
  Grid2x2,
  Image as ImageIcon,
  LineChart,
  TableProperties,
} from "lucide-react";

import { landingPhotos } from "@/lib/visual-assets";

const pillars = [
  {
    icon: Dumbbell,
    title: "Routine Specificity",
    text: "Entrenamientos adaptados a tu biomecánica, material disponible y objetivos específicos de rendimiento o competición.",
  },
  {
    icon: ImageIcon,
    title: "Physical Analysis",
    text: "Monitorización visual opcional y lectura técnica para decidir prioridades musculares, sesgos y reajustes del bloque.",
  },
  {
    icon: TableProperties,
    title: "Excel Export",
    text: "Exporta el mesociclo en un formato editable y profesional para seguir cargas, RIR, sesiones y progresión real.",
  },
] as const;

const steps = [
  {
    step: "01",
    title: "Context",
    text: "Analizamos tu punto de partida, historial, molestias y objetivo del bloque antes de pedir nada más.",
  },
  {
    step: "02",
    title: "Visual",
    text: "Vídeo o imágenes opcionales para detectar asimetrías, dominancias y posibles sesgos del planteamiento.",
  },
  {
    step: "03",
    title: "Custom Form",
    text: "Formulario corto y técnico con preguntas que sí cambian la estructura, el volumen y la selección de ejercicios.",
  },
  {
    step: "04",
    title: "Editable Routine",
    text: "Recibe tu mesociclo dinámico, revísalo, cambia ejercicios y expórtalo a Excel cuando lo necesites.",
  },
] as const;

const footerLinks = ["Privacidad", "Términos", "Cookies"] as const;

export function LandingPage() {
  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/30 bg-[#f9f9f7]/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-4">
          <div className="font-display text-2xl font-extrabold tracking-[-0.05em] text-[#1b1b1b]">
            MyCoach
          </div>

          <div className="hidden items-center space-x-8 md:flex">
            <a
              className="border-b-2 border-[#0050cc] py-1 text-sm font-bold tracking-tight text-[#0050cc]"
              href="#inicio"
            >
              Inicio
            </a>
            <a
              className="py-1 text-sm font-medium tracking-tight text-[#1b1b1b]/60 transition-all hover:text-[#0050cc]"
              href="#programa"
            >
              Programa
            </a>
            <a
              className="py-1 text-sm font-medium tracking-tight text-[#1b1b1b]/60 transition-all hover:text-[#0050cc]"
              href="#elite"
            >
              Élite
            </a>
          </div>

          <div className="flex items-center gap-4 text-slate-500">
            <Bell className="h-5 w-5 cursor-pointer" />
            <CircleUserRound className="h-6 w-6 cursor-pointer" />
          </div>
        </div>
      </nav>

      <main className="overflow-x-hidden bg-[#f9f9f7] pb-32 pt-24 text-[#1a1c1b] lg:pb-0">
        <section className="relative mx-auto max-w-[1440px] px-6 py-12 lg:py-24" id="inicio">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="z-10 lg:col-span-6">
              <h1 className="mb-8 font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.05em] text-[#1b1b1b] md:text-7xl lg:text-8xl">
                Entrena como la <span className="italic text-[#0050cc]">élite</span> con
                mesociclos de alto rendimiento
              </h1>

              <div className="flex flex-col items-start gap-4 sm:flex-row">
                <Link
                  className="rounded-2xl bg-[#1b1b1b] px-8 py-4 font-display text-lg font-bold text-white transition-transform active:scale-95"
                  href="/plan"
                >
                  Iniciar proceso
                </Link>

                <div className="flex items-center gap-3 rounded-2xl bg-[#f1f3f8] px-4 py-3">
                  <Bolt className="h-5 w-5 fill-[#0050cc] text-[#0050cc]" />
                  <span className="text-sm font-medium">Resultados pro garantizados</span>
                </div>
              </div>
            </div>

            <div className="relative mt-12 lg:col-span-6 lg:mt-0">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-[#eceeea] shadow-[0_20px_40px_-10px_rgba(26,28,27,0.06)]">
                <Image
                  alt={landingPhotos[1].alt}
                  className="h-full w-full object-cover grayscale brightness-90"
                  height={1333}
                  priority
                  src={landingPhotos[1].src}
                  width={1800}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1c1b]/18 via-transparent to-transparent" />

                <div className="absolute -right-3 top-10 w-[54%] rounded-[2rem] border border-white/80 bg-[#f9f9f7]/92 p-5 shadow-[0_20px_40px_-10px_rgba(26,28,27,0.12)] backdrop-blur md:-right-8 md:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-[#0050cc]">
                        Rutina lista
                      </p>
                      <h3 className="mt-2 font-display text-2xl font-bold tracking-[-0.04em] text-[#1b1b1b]">
                        Bloque superior
                      </h3>
                    </div>
                    <div className="rounded-full bg-[#eef3ff] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#003fa4]">
                      Excel editable
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: "sesiones", value: "4" },
                      { label: "focos", value: "3" },
                      { label: "ajustes", value: "RIR" },
                    ].map((item) => (
                      <div className="rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4" key={item.label}>
                        <div className="font-display text-3xl font-extrabold tracking-[-0.05em] text-[#1b1b1b]">
                          {item.value}
                        </div>
                        <div className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      Ultima accion
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      Rutina exportada y lista para editar segun material, molestias o feedback.
                    </p>
                  </div>
                </div>

                <div className="absolute -left-6 bottom-10 hidden w-[48%] rounded-[2rem] border border-white/80 bg-white/94 p-5 shadow-[0_20px_40px_-10px_rgba(26,28,27,0.12)] backdrop-blur md:block">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[1.25rem] bg-[#eef3ff] text-[#0050cc]">
                      <LineChart className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
                        Diagnostico
                      </p>
                      <h3 className="font-display text-xl font-bold tracking-[-0.04em] text-[#1b1b1b]">
                        Lectura del caso
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-full bg-[#f2f3f6] px-4 py-3 text-sm font-semibold text-slate-700">
                      Pecho clavicular y dorsales como prioridad.
                    </div>
                    <div className="rounded-full bg-[#f2f3f6] px-4 py-3 text-sm font-semibold text-slate-700">
                      Frecuencia 4 y control de fatiga como base.
                    </div>
                    <div className="rounded-full bg-[#eef3ff] px-4 py-3 text-sm font-semibold text-[#003fa4]">
                      Cambios de ejercicio y exportacion sin rehacer el bloque.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f2f3f1] px-6 py-24">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-16">
              <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.28em] text-[#0050cc]">
                Metodología Élite
              </p>
              <h2 className="font-display text-4xl font-bold tracking-[-0.04em] text-[#1a1c1b] md:text-5xl">
                Tres pilares de rendimiento absoluto.
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3 lg:gap-12">
              {pillars.map((pillar, index) => {
                const Icon = pillar.icon;

                return (
                  <div
                    className={`flex flex-col justify-between rounded-[2rem] bg-white p-10 shadow-[0_20px_40px_-10px_rgba(26,28,27,0.06)] ${
                      index === 1 ? "md:translate-y-8" : ""
                    }`}
                    key={pillar.title}
                  >
                    <div>
                      <Icon className="mb-6 h-10 w-10 text-[#0050cc]" />
                      <h3 className="mb-4 font-display text-2xl font-bold">{pillar.title}</h3>
                      <p className="leading-relaxed text-[#424656]">{pillar.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] overflow-hidden px-6 py-24" id="programa">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="order-2 relative lg:order-1">
              <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] bg-[#e8e8e6]">
                <Image
                  alt={landingPhotos[2].alt}
                  className="h-full w-full object-cover grayscale"
                  height={914}
                  src={landingPhotos[2].src}
                  width={762}
                />
              </div>

              <div className="absolute -bottom-12 -right-6 hidden w-80 overflow-hidden rounded-[1.5rem] border-8 border-[#eeeeec] shadow-[0_20px_40px_-10px_rgba(26,28,27,0.06)] md:block md:-right-12">
                <div className="bg-white p-6">
                  <div className="mb-6 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#dae1ff]">
                      <CircleUserRound className="h-6 w-6 text-[#0050cc]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#424656]">
                        Contexto
                      </p>
                      <p className="font-display font-bold">Perfil atleta pro</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-2 w-full rounded-full bg-[#e8e8e6]" />
                    <div className="h-2 w-3/4 rounded-full bg-[#e8e8e6]" />
                    <div className="flex gap-2">
                      <div className="h-8 w-16 rounded-full bg-[#0050cc]" />
                      <div className="h-8 w-24 rounded-full bg-[#e8e8e6]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <h2 className="mb-8 font-display text-5xl font-extrabold tracking-[-0.05em] md:text-6xl">
                El contexto lo es todo.
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-[#424656]">
                No creemos en plantillas genéricas. Nuestra lógica de contexto personal
                analiza tu historial, el equipo disponible y la fatiga acumulada para
                recalibrar tu mesociclo en tiempo real.
              </p>
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <span className="rounded-full bg-[#dae1ff] p-2 text-[#0050cc]">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                  <span className="font-medium text-[#1a1c1b]">
                    Adaptación biomecánica individualizada.
                  </span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="rounded-full bg-[#dae1ff] p-2 text-[#0050cc]">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                  <span className="font-medium text-[#1a1c1b]">
                    Gestión de carga basada en datos reales.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200/40 bg-white px-6 py-24" id="elite">
          <div className="mx-auto max-w-[1440px]">
            <h2 className="mb-16 text-center font-display text-4xl font-extrabold">
              Tu camino a la élite.
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div
                  className="rounded-r-xl border-l-4 bg-[#f4f4f2] p-8"
                  key={step.step}
                  style={{
                    borderLeftColor: index === 0 ? "#0050cc" : "rgba(0, 80, 204, 0.4)",
                  }}
                >
                  <p
                    className="mb-4 font-display text-3xl font-black"
                    style={{ color: index === 0 ? "#0050cc" : "rgba(0, 80, 204, 0.4)" }}
                  >
                    {step.step}
                  </p>
                  <h4 className="mb-2 text-xl font-bold">{step.title}</h4>
                  <p className="text-sm text-[#424656]">{step.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-6 py-24">
          <div className="grid items-end gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-8 font-display text-5xl font-bold leading-tight tracking-[-0.05em]">
                Optimizado para <span className="text-[#0050cc]">hipertrofia</span> de
                máximo nivel y <span className="text-[#0050cc]">rendimiento</span> híbrido
                en disciplinas como <span className="text-[#0050cc]">Hyrox</span>.
              </h2>
              <div className="flex flex-wrap gap-3">
                {["Strength", "Endurance", "Recovery"].map((tag) => (
                  <span
                    className="rounded-full bg-[#dae1ff] px-6 py-2 text-xs font-bold uppercase tracking-[0.24em] text-[#003fa4]"
                    key={tag}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200/30 bg-[#f4f4f2] p-8">
              <p className="text-sm leading-relaxed text-[#424656]">
                La plataforma utiliza una lógica de periodización avanzada para asegurar
                que la fatiga no comprometa tus ganancias en hipertrofia mientras escalas
                el rendimiento cardiovascular y la calidad del bloque.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-6 pb-24">
          <div className="relative overflow-hidden rounded-[3rem] bg-white p-12 text-center shadow-[0_20px_40px_-10px_rgba(26,28,27,0.06)] lg:p-24">
            <div className="pointer-events-none absolute inset-0 opacity-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0050cc,transparent)]" />
            </div>
            <h2 className="relative z-10 mb-12 font-display text-5xl font-extrabold tracking-[-0.05em] md:text-7xl">
              ¿Listo para el siguiente nivel?
            </h2>
            <div className="relative z-10 flex flex-col items-center gap-6">
              <Link
                className="rounded-full bg-[#1b1b1b] px-12 py-6 font-display text-2xl font-bold text-white transition-transform hover:scale-105 active:scale-95"
                href="/plan"
              >
                Iniciar proceso
              </Link>
              <p className="font-medium text-[#424656]">
                Únete a la comunidad de atletas MyCoach.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#f4f4f2] px-6 py-12">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-8 md:flex-row">
          <div className="font-display text-xl font-black italic text-[#1a1c1b]">MyCoach</div>
          <div className="flex gap-8 text-sm text-[#424656]">
            {footerLinks.map((item) => (
              <a className="transition-colors hover:text-[#0050cc]" href="#" key={item}>
                {item}
              </a>
            ))}
          </div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#424656]/60">
            © 2024 MyCoach Elite. All Rights Reserved.
          </p>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-[3rem] border-t border-[#c2c6d8]/15 bg-white/80 px-6 pb-8 pt-4 shadow-[0_-20px_40px_-10px_rgba(26,28,27,0.06)] backdrop-blur-md lg:hidden">
        <MobileNavItem active icon={<Grid2x2 className="h-5 w-5" />} label="Feed" />
        <MobileNavItem icon={<CalendarRange className="h-5 w-5" />} label="Plan" />
        <MobileNavItem icon={<Bolt className="h-5 w-5" />} label="Train" />
        <MobileNavItem icon={<LineChart className="h-5 w-5" />} label="Metrics" />
        <MobileNavItem icon={<CircleUserRound className="h-5 w-5" />} label="Profile" />
      </nav>
    </>
  );
}

function MobileNavItem({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        active ? "scale-110 text-[#0050cc]" : "text-[#1b1b1b]/40"
      }`}
    >
      {icon}
      <span className="mt-1 font-display text-[10px] font-semibold uppercase tracking-[0.24em]">
        {label}
      </span>
    </div>
  );
}
