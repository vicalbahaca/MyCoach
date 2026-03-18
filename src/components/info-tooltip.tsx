type Props = {
  label: string;
  children: React.ReactNode;
};

export function InfoTooltip({ label, children }: Props) {
  return (
    <span className="group relative inline-flex items-center">
      <button
        aria-label={label}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-bold text-slate-700 shadow-sm transition hover:border-[rgba(66,108,255,0.28)] focus-visible:border-[rgba(66,108,255,0.34)] focus-visible:outline-none"
        type="button"
      >
        i
      </button>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-[20px] border border-slate-200 bg-slate-950 px-4 py-3 text-left text-xs leading-5 text-slate-100 shadow-2xl group-hover:block group-focus-within:block">
        {children}
      </span>
    </span>
  );
}
