type Props = {
  label: string;
  children: React.ReactNode;
};

export function InfoTooltip({ label, children }: Props) {
  return (
    <span className="group relative inline-flex items-center">
      <button
        aria-label={label}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-sky-200 bg-white/80 text-[11px] font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-white"
        type="button"
      >
        i
      </button>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-2xl border border-sky-100 bg-slate-950 px-4 py-3 text-left text-xs leading-5 text-slate-200 shadow-2xl group-hover:block">
        {children}
      </span>
    </span>
  );
}
