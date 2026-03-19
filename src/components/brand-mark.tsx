type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className = "" }: BrandMarkProps) {
  const classes = [
    "font-display italic tracking-[-0.05em] text-[#1a1c1b]",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>MyCoach</span>;
}
