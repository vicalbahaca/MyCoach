import Link from "next/link";

type BrandMarkProps = {
  className?: string;
  href?: string;
};

export function BrandMark({ className = "", href = "/" }: BrandMarkProps) {
  const classes = [
    "font-display italic tracking-[-0.05em] text-[#1a1c1b]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Link aria-label="Ir a la landing de MyCoach" className={classes} href={href}>
      MyCoach
    </Link>
  );
}
