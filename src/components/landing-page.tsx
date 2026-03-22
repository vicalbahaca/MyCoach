"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Dumbbell,
  Image as ImageIcon,
  TableProperties,
} from "lucide-react";

import { BrandMark } from "@/components/brand-mark";
import { landingPhotos } from "@/lib/visual-assets";

const pillars = [
  {
    icon: Dumbbell,
    title: "Análisis físico",
    text: "Analizamos tu físico mediante imágenes o vídeo para detectar asimetrías, dominancias y prioridades reales antes de diseñar el bloque.",
  },
  {
    icon: ImageIcon,
    title: "Rutina personalizada",
    text: "Construimos la rutina en función de tu historial, objetivo, sensaciones, material disponible y contexto actual.",
  },
  {
    icon: TableProperties,
    title: "Exporta tu progreso",
    text: "Descarga la rutina en Excel para registrar cargas, repeticiones, RIR y la evolución completa de tu mesociclo.",
  },
] as const;

const steps = [
  {
    step: "01",
    title: "Contexto",
    text: "Analizamos tu rutina actual, tu punto de partida, tu objetivo y todo lo que condiciona la planificación.",
  },
  {
    step: "02",
    title: "Análisis físico",
    text: "Revisamos tu físico mediante vídeo o imágenes para detectar asimetrías, dominancias y posibles sesgos físicos.",
  },
  {
    step: "03",
    title: "Formulario personalizado",
    text: "Formulario corto y poco técnico con preguntas que cambiarán la estructura, el volumen y la selección de ejercicios.",
  },
  {
    step: "04",
    title: "Rutina editable",
    text: "Recibe tu rutina personalizada en un Excel editable desde el que podrás seguir tu progreso.",
  },
] as const;

const footerLinks = [
  { label: "Privacidad", href: "/privacidad" },
  { label: "Términos", href: "/terminos" },
  { label: "Cookies", href: "/cookies" },
] as const;

function ScrollReveal({
  children,
  className = "",
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;

    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setIsVisible(true);
        observer.disconnect();
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`landing-reveal ${isVisible ? "landing-reveal-visible" : ""} ${className}`.trim()}
      onFocusCapture={() => setIsVisible(true)}
      ref={ref}
      style={{ ...style, transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function LandingPage() {
  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/30 bg-[#f9f9f7]/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1440px] items-center px-6 py-4">
          <BrandMark className="text-2xl font-extrabold" />
        </div>
      </nav>

      <main className="overflow-x-hidden bg-[#f9f9f7] pb-32 pt-24 text-[#1a1c1b] lg:pb-0">
        <section className="relative mx-auto max-w-[1440px] px-6 py-16" id="inicio">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <ScrollReveal className="z-10 min-w-0 lg:col-span-7 lg:pr-4">
              <h1 className="mb-8 w-full max-w-[11ch] break-words font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.05em] text-[#1b1b1b] md:text-7xl lg:text-8xl">
                Entrena como la <span className="italic text-[#0050cc]">élite</span> con
                rutinas personalizadas
              </h1>

              <p className="mb-8 max-w-2xl text-lg leading-relaxed text-[#424656]">
                Diseña tu rutina personalizada para hipertrofia, fuerza, CrossFit o
                Hyrox con análisis físico, contexto real y exportación a Excel para
                seguir tu progreso.
              </p>

              <div className="flex flex-col items-start gap-4 sm:flex-row">
                <Link
                  className="rounded-2xl bg-[#1b1b1b] px-8 py-4 font-display text-lg font-bold text-white transition-transform active:scale-95"
                  href="/plan"
                >
                  Iniciar proceso
                </Link>
              </div>
            </ScrollReveal>

            <ScrollReveal className="relative mt-12 min-w-0 lg:col-span-5 lg:mt-0 lg:pl-2" delay={80}>
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
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="bg-[#f2f3f1] px-6 py-24">
          <div className="mx-auto max-w-[1440px]">
            <ScrollReveal className="mb-16">
              <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.28em] text-[#0050cc]">
                Metodología Élite
              </p>
              <h2 className="font-display text-4xl font-bold tracking-[-0.04em] text-[#1a1c1b] md:text-5xl">
                Tres pilares para construir tu rutina.
              </h2>
            </ScrollReveal>

            <div className="grid gap-8 md:grid-cols-3 lg:gap-12">
              {pillars.map((pillar, index) => {
                const Icon = pillar.icon;

                return (
                  <ScrollReveal
                    className={`flex flex-col justify-between rounded-[2rem] bg-white p-10 shadow-[0_20px_40px_-10px_rgba(26,28,27,0.06)] ${
                      index === 1 ? "md:translate-y-8" : ""
                    }`}
                    delay={index * 70}
                    key={pillar.title}
                  >
                    <div>
                      <Icon className="mb-6 h-10 w-10 text-[#0050cc]" />
                      <h3 className="mb-4 font-display text-2xl font-bold">{pillar.title}</h3>
                      <p className="leading-relaxed text-[#424656]">{pillar.text}</p>
                    </div>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] overflow-hidden px-6 py-24" id="programa">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <ScrollReveal className="order-2 lg:order-1">
              <div className="relative aspect-square w-full overflow-hidden rounded-[2rem] bg-[#e8e8e6]">
                <Image
                  alt={landingPhotos[2].alt}
                  className="h-full w-full object-cover grayscale"
                  height={914}
                  src={landingPhotos[2].src}
                  width={762}
                />
              </div>
            </ScrollReveal>

            <ScrollReveal className="order-1 lg:order-2" delay={60}>
              <h2 className="mb-8 font-display text-5xl font-extrabold tracking-[-0.05em] md:text-6xl">
                El contexto lo es todo.
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-[#424656]">
                No creemos en plantillas genéricas. Nuestra lógica de contexto personal
                analiza tu físico, tu historial, tus sensaciones, la fatiga acumulada y
                el equipo disponible para construir la mejor rutina posible para ti.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="border-y border-slate-200/40 bg-white px-6 py-24" id="elite">
          <div className="mx-auto max-w-[1440px]">
            <ScrollReveal>
              <h2 className="mb-16 text-center font-display text-4xl font-extrabold">
                Tu camino a la élite.
              </h2>
              <p className="-mt-10 mb-16 text-center text-lg text-[#424656]">
                Genera tu rutina personalizada en sencillos pasos.
              </p>
            </ScrollReveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <ScrollReveal
                  className="rounded-r-xl border-l-4 bg-[#f4f4f2] p-8"
                  delay={index * 65}
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
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-6 py-24">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <ScrollReveal>
              <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.28em] text-[#0050cc]">
                La disciplina es clave
              </p>
              <h2 className="mb-8 font-display text-5xl font-bold leading-tight tracking-[-0.05em]">
                Consigue un mesociclo personalizado que evoluciona contigo.
              </h2>
              <p className="max-w-3xl text-lg leading-relaxed text-[#424656]">
                Con MyCoach consigues un mesociclo, entendido como una rutina de varias
                semanas con progresión real, objetivos claros y una estructura pensada
                para que notes mejoras significativas bloque a bloque.
              </p>
            </ScrollReveal>

            <ScrollReveal
              className="rounded-[2.5rem] border border-slate-200/40 bg-white p-10 shadow-[0_24px_50px_-18px_rgba(26,28,27,0.08)]"
              delay={70}
            >
              <div className="mb-10">
                <h3 className="max-w-xs font-display text-4xl font-black leading-[0.92] tracking-[-0.05em] text-[#1a1c1b]">
                  Evolución inteligente de ciclo
                </h3>
              </div>

              <p className="max-w-md text-lg leading-relaxed text-[#5a6171]">
                Cuando terminas el mesociclo, vuelves a realizar el proceso añadiendo tu
                nuevo contexto y feedback. Así generamos una nueva rutina adaptada a tu
                evolución diaria.
              </p>

              <div className="mt-12 border-t border-slate-200/70 pt-8">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {landingPhotos.slice(0, 3).map((photo) => (
                      <div
                        className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-[#dfe6f7]"
                        key={photo.src}
                      >
                        <Image
                          alt={photo.alt}
                          className="h-full w-full object-cover"
                          height={80}
                          src={photo.src}
                          width={80}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-lg font-black tracking-[-0.03em] text-[#1a1c1b]">
                      +2.4K atletas
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7c8393]">
                      Comunidad elite
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-6 py-24">
          <div className="grid items-end gap-8 lg:grid-cols-3">
            <ScrollReveal className="lg:col-span-3">
              <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.28em] text-[#0050cc]">
                Optimización avanzada
              </p>
              <h2 className="mb-8 font-display text-5xl font-bold leading-tight tracking-[-0.05em]">
                Optimizado para <span className="text-[#0050cc]">hipertrofia</span> de
                máximo nivel y <span className="text-[#0050cc]">rendimiento</span> híbrido
                en disciplinas como <span className="text-[#0050cc]">CrossFit</span>,
                <span className="text-[#0050cc]"> Hyrox</span> o
                <span className="text-[#0050cc]"> powerlifting</span>.
              </h2>
              <p className="max-w-4xl text-lg leading-relaxed text-[#424656]">
                La plataforma utiliza una lógica de periodización avanzada para asegurar
                que la fatiga no comprometa tus ganancias de hipertrofia mientras escalas
                en rendimiento cardiovascular.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="mx-auto max-w-[1440px] px-6 pb-24">
          <ScrollReveal className="relative overflow-hidden rounded-[3rem] bg-white p-12 text-center shadow-[0_20px_40px_-10px_rgba(26,28,27,0.06)] lg:p-24">
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
          </ScrollReveal>
        </section>
      </main>

      <footer className="bg-[#f4f4f2] px-6 py-12">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-8 md:flex-row">
          <BrandMark className="text-xl font-black" />
          <div className="flex gap-8 text-sm text-[#424656]">
            {footerLinks.map((item) => (
              <Link
                className="transition-colors hover:text-[#0050cc]"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <p className="text-xs uppercase tracking-[0.24em] text-[#424656]/60">
            © 2026 MyCoach Elite. All Rights Reserved.
          </p>
        </div>
      </footer>

    </>
  );
}
