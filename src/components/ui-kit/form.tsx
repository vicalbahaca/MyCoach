import Link from "next/link";
import { useId, useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { ArrowLeft, ChevronDown, Info, Plus, Upload, X } from "lucide-react";

import { BrandMark } from "@/components/brand-mark";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type FormOption = {
  label: string;
  value: string;
  description?: string;
};

export function FormTopBar({
  closeHref = "/",
}: {
  closeHref?: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(194,198,216,0.38)] bg-[var(--form-bg)]/95 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 sm:px-8">
        <BrandMark className="text-2xl font-extrabold" />
        <Link
          aria-label="Cerrar formulario"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--form-outline-strong)] transition hover:bg-white hover:text-[var(--form-accent)]"
          href={closeHref}
        >
          <X className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}

export function FormProgress({
  step,
  totalSteps,
  title,
}: {
  step: number;
  totalSteps: number;
  title: string;
}) {
  return (
    <div className="mb-14 space-y-5">
      <div className="flex items-end justify-between gap-6">
        <span className="font-display text-xs font-bold uppercase tracking-[0.22em] text-[var(--form-outline-strong)] sm:text-sm">
          Paso {step} de {totalSteps}
        </span>
        <span className="font-display text-3xl font-black uppercase tracking-[-0.04em] text-[var(--form-ink)] sm:text-4xl">
          {title}
        </span>
      </div>
      <div className="overflow-hidden rounded-full border border-white/80 bg-[rgba(244,244,242,0.84)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
        <div
          className="h-2 rounded-full bg-[linear-gradient(90deg,#0050cc_0%,#2f7bff_100%)] shadow-[0_10px_24px_-12px_rgba(0,80,204,0.95)] transition-all duration-300"
          style={{ width: `${Math.max(8, (step / totalSteps) * 100)}%` }}
        />
      </div>
    </div>
  );
}

export function FormStepIntro({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="space-y-3">
      <div className="form-ui-muted-label">{eyebrow}</div>
      <h2 className="font-display text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-[var(--form-ink)]">
        {title}
      </h2>
      <p className="max-w-2xl text-sm leading-7 text-[var(--form-muted)]">{text}</p>
    </div>
  );
}

export function FormSection({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <div className="form-ui-label">{label}</div>
        {description ? (
          <p className="max-w-2xl text-sm leading-7 text-[var(--form-muted)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function FormPillButton({
  active,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
}) {
  return (
    <button
      className={cx(
        "form-ui-pill min-h-[4.125rem] px-6 text-lg",
        active && "form-ui-pill-active",
        className
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export function FormChoiceCard({
  active,
  label,
  sublabel,
  onClick,
}: {
  active: boolean;
  label: string;
  sublabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      className={cx(
        "form-ui-panel px-5 py-5 text-left transition hover:-translate-y-0.5",
        active && "border-[rgba(0,80,204,0.4)] bg-[rgba(218,225,255,0.32)] text-[var(--form-accent)]"
      )}
      onClick={onClick}
      type="button"
    >
      <div
        className={cx(
          "font-display text-lg font-semibold text-[var(--form-ink)]",
          active && "text-[var(--form-accent)]"
        )}
      >
        {label}
      </div>
      {sublabel ? (
        <div className="mt-2 text-sm leading-6 text-[var(--form-muted)]">{sublabel}</div>
      ) : null}
    </button>
  );
}

export function FormChipButton({
  active,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
}) {
  return (
    <button
      className={cx(
        "form-ui-chip min-h-11 px-5 text-base",
        active && "form-ui-chip-active",
        className
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export function FormLineInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  onBlur,
  errorMessage,
  describedBy,
  invalid,
  required,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  errorMessage?: string;
  describedBy?: string;
  invalid?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="form-ui-label mb-2 block">{label}</span>
      <span
        className={cx(
          "form-ui-line-field block",
          invalid && "border-rose-500 focus-within:border-rose-500"
        )}
      >
        <input
          aria-describedby={describedBy}
          aria-invalid={invalid ? "true" : "false"}
          className={cx(
            "form-ui-line-input",
            invalid && "text-rose-700 placeholder:text-rose-300"
          )}
          id={id}
          inputMode={inputMode}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          type={type}
          value={value}
        />
      </span>
      {errorMessage ? (
        <p className="mt-3 text-sm leading-6 text-rose-600" id={describedBy} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </label>
  );
}

export function FormLineSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  onBlur,
  errorMessage,
  describedBy,
  invalid,
  required,
}: {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: FormOption[];
  placeholder: string;
  onBlur?: React.FocusEventHandler<HTMLSelectElement>;
  errorMessage?: string;
  describedBy?: string;
  invalid?: boolean;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="form-ui-label mb-2 block">{label}</span>
      <span
        className={cx(
          "form-ui-line-field relative block",
          invalid && "border-rose-500 focus-within:border-rose-500"
        )}
      >
        <select
          aria-describedby={describedBy}
          aria-invalid={invalid ? "true" : "false"}
          className={cx(
            "form-ui-line-input appearance-none cursor-pointer pr-10",
            invalid && "text-rose-700"
          )}
          id={id}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          required={required}
          value={value}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className={cx(
            "pointer-events-none absolute right-1 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--form-outline-strong)]",
            invalid && "text-rose-500"
          )}
        />
      </span>
      {errorMessage ? (
        <p className="mt-3 text-sm leading-6 text-rose-600" id={describedBy} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </label>
  );
}

export function FormTextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="form-ui-label mb-2 block">{label}</span>
      <span className="form-ui-line-field block">
        <textarea
          className="form-ui-line-input form-ui-line-textarea"
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={rows}
          value={value}
        />
      </span>
    </label>
  );
}

export function FormInfoNotice({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-ui-panel bg-[rgba(218,225,255,0.18)] px-5 py-5">
      <div className="form-ui-muted-label mb-2 text-[var(--form-accent)]">{title}</div>
      <div className="text-sm leading-7 text-[var(--form-muted)]">{children}</div>
    </div>
  );
}

export function FormLabelWithTooltip({
  label,
  tooltip,
  className,
}: {
  label: string;
  tooltip: string;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const tooltipId = useId();

  return (
    <div className={cx("flex min-h-6 items-center gap-3 pl-1", className)}>
      <div className="form-ui-label">{label}</div>
      <div className="relative">
        <button
          aria-describedby={isOpen ? tooltipId : undefined}
          aria-expanded={isOpen}
          aria-label={`Información sobre ${label.toLowerCase()}`}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--form-outline)] bg-white text-[var(--form-muted)] transition hover:border-[var(--form-accent)] hover:text-[var(--form-accent)]"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsOpen(false);
            }
          }}
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
        <div
          className={cx(
            "absolute left-0 top-full z-20 mt-3 w-[280px] rounded-[1.25rem] border border-slate-200 bg-white p-4 text-sm leading-6 text-[#424656] shadow-[0_20px_40px_-18px_rgba(26,28,27,0.22)]",
            isOpen ? "block" : "hidden"
          )}
          id={tooltipId}
          role="tooltip"
        >
          {tooltip}
        </div>
      </div>
    </div>
  );
}

export function FormUploadTile({
  title,
  subtitle,
  accept,
  onChange,
  onFilesDropped,
  files = [],
  onRemoveFile,
  formatHint,
  maxHint,
  className,
}: {
  title: string;
  subtitle?: string;
  accept: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onFilesDropped?: (files: File[]) => void;
  files?: File[];
  onRemoveFile?: (file: File) => void;
  formatHint?: string;
  maxHint?: string;
  className?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isDragValid, setIsDragValid] = useState<boolean | null>(null);
  const dragDepthRef = useRef(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function isAcceptedFile(file: File) {
    const acceptedTypes = accept
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    if (!acceptedTypes.length) return true;

    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    return acceptedTypes.some((acceptedType) => {
      if (acceptedType.startsWith(".")) {
        return fileName.endsWith(acceptedType);
      }

      if (acceptedType.endsWith("/*")) {
        return fileType.startsWith(acceptedType.replace("*", ""));
      }

      return fileType === acceptedType;
    });
  }

  function readDraggedFiles(event: DragEvent<HTMLDivElement>) {
    return Array.from(event.dataTransfer.items || [])
      .map((item) => item.getAsFile())
      .filter((file): file is File => Boolean(file));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);
    setIsDragValid(null);

    if (!onFilesDropped) return;

    const droppedFiles = Array.from(event.dataTransfer.files || []);
    if (!droppedFiles.length) return;
    onFilesDropped(droppedFiles);
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current += 1;
    const draggedFiles = readDraggedFiles(event);
    setIsDragValid(
      draggedFiles.length ? draggedFiles.every((file) => isAcceptedFile(file)) : null
    );
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragging(false);
      setIsDragValid(null);
    }
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    const draggedFiles = readDraggedFiles(event);
    const nextDragValid = draggedFiles.length
      ? draggedFiles.every((file) => isAcceptedFile(file))
      : null;
    event.dataTransfer.dropEffect = nextDragValid === false ? "none" : "copy";
    setIsDragValid(nextDragValid);
    setIsDragging(true);
  }

  function handleKeyboardOpen(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    inputRef.current?.click();
  }

  return (
    <div
      aria-label={title}
      className={cx(
        "form-ui-panel group relative flex cursor-pointer flex-col items-center justify-center gap-3 border-[1.5px] border-dashed border-[rgba(194,198,216,0.62)] px-6 py-10 text-center transition hover:border-[rgba(0,80,204,0.34)] hover:bg-[rgba(218,225,255,0.12)]",
        isDragging && "border-[rgba(0,80,204,0.4)] bg-[rgba(218,225,255,0.18)]",
        className
      )}
      onClick={() => inputRef.current?.click()}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onKeyDown={handleKeyboardOpen}
      role="button"
      tabIndex={0}
    >
      <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(218,225,255,0.5)] text-[var(--form-accent)]">
        <Upload className="h-5 w-5" />
      </span>
      <span className="font-display text-lg font-semibold text-[var(--form-ink)]">{title}</span>
      {subtitle ? (
        <span className="max-w-md text-sm leading-7 text-[var(--form-muted)]">{subtitle}</span>
      ) : null}
      {formatHint ? (
        <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--form-muted)]">
          {formatHint}
        </span>
      ) : null}
      {maxHint ? (
        <span
          className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--form-muted)]"
        >
          {maxHint}
        </span>
      ) : null}
      {isDragging ? (
        <span
          className={cx(
            "pointer-events-none absolute left-1/2 top-6 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em] shadow-[0_18px_40px_-24px_rgba(18,25,45,0.32)]",
            isDragValid === false
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-[#dae1ff] bg-white text-[var(--form-accent)]"
          )}
        >
          {isDragValid === false ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {isDragValid === false ? "Formato no admitido" : "Suelta para añadirlo"}
        </span>
      ) : null}
      {files.length ? (
        <span className="mt-3 flex w-full flex-wrap justify-center gap-3">
          {files.map((file) => (
            <span
              className="inline-flex items-center gap-2 rounded-full border border-[var(--form-outline)] bg-white px-4 py-2 text-sm font-semibold text-[var(--form-ink)]"
              key={`${file.name}-${file.lastModified}`}
            >
              <span className="max-w-[12rem] truncate">{file.name}</span>
              {onRemoveFile ? (
                <button
                  aria-label={`Eliminar ${file.name}`}
                  className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--form-muted)] transition hover:bg-[rgba(0,80,204,0.08)] hover:text-[var(--form-accent)]"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onRemoveFile(file);
                  }}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </span>
          ))}
        </span>
      ) : null}
      <input
        accept={accept}
        className="hidden"
        multiple
        ref={inputRef}
        onChange={(event) => {
          onChange(event);
          event.target.value = "";
        }}
        type="file"
      />
    </div>
  );
}

export function FormFilePills({ files }: { files: File[] }) {
  if (!files.length) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {files.map((file) => (
        <span
          className="form-ui-chip min-h-10 px-4 text-sm"
          key={`${file.name}-${file.lastModified}`}
        >
          {file.name}
        </span>
      ))}
    </div>
  );
}

export function FormQuestionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="form-ui-panel px-5 py-5 sm:px-6 sm:py-6">
      <div className="mb-5">
        <div className="form-ui-label text-[var(--form-accent)]">{title}</div>
        {description ? (
          <p className="mt-2 text-sm leading-7 text-[var(--form-muted)]">{description}</p>
        ) : null}
      </div>
      <div className="space-y-5">{children}</div>
    </article>
  );
}

export function FormFooter({
  backLabel,
  nextLabel,
  onBack,
  onNext,
  nextDisabled,
  nextIcon,
}: {
  backLabel?: string;
  nextLabel: string;
  onBack?: () => void;
  onNext: () => void;
  nextDisabled?: boolean;
  nextIcon?: React.ReactNode;
}) {
  return (
    <div className="mt-20 flex justify-center">
      <div className="flex w-full max-w-md items-center gap-3">
        {onBack ? (
          <button
            aria-label={backLabel || "Paso anterior"}
            className="inline-flex min-h-[4.5rem] w-[4.5rem] flex-none items-center justify-center rounded-full border border-[#1c1c1c] bg-transparent px-0 text-[#1c1c1c] transition hover:-translate-y-0.5 hover:bg-[rgba(28,28,28,0.04)]"
            onClick={onBack}
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : null}
        <button
          className="form-ui-cta min-h-[4.5rem] flex-1 px-10"
          disabled={nextDisabled}
          onClick={onNext}
          type="button"
        >
          {nextIcon}
          {nextLabel}
        </button>
      </div>
    </div>
  );
}
