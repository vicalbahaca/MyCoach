import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

type LegalSection = {
  title: string;
  paragraphs: string[];
};

export function LegalPage({
  eyebrow,
  title,
  intro,
  updatedAt,
  sections,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
}) {
  return (
    <main className="min-h-screen bg-[#f9f9f7] text-[#1a1c1b]">
      <header className="border-b border-slate-200/50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-5">
          <BrandMark className="text-2xl font-extrabold" />
          <Link
            className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-[#424656] transition-colors hover:border-[#0050cc]/30 hover:text-[#0050cc]"
            href="/"
          >
            Volver a la landing
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="lg:sticky lg:top-10 lg:self-start">
            <p className="mb-4 text-sm font-extrabold uppercase tracking-[0.28em] text-[#0050cc]">
              {eyebrow}
            </p>
            <h1 className="font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.05em] text-[#1b1b1b] md:text-6xl">
              {title}
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-[#424656]">{intro}</p>
            <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-[#727687]">
              Última actualización: {updatedAt}
            </p>
          </aside>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <article
                className="rounded-[2rem] border border-slate-200/60 bg-white p-8 shadow-[0_20px_40px_-10px_rgba(26,28,27,0.06)]"
                key={section.title}
              >
                <div className="mb-5 flex items-center gap-4">
                  <span className="font-display text-3xl font-black tracking-[-0.05em] text-[#0050cc]/35">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2 className="font-display text-2xl font-bold tracking-[-0.03em] text-[#1b1b1b]">
                    {section.title}
                  </h2>
                </div>
                <div className="space-y-4 text-[15px] leading-8 text-[#424656]">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
