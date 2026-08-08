import { cn } from "@cj/ui";

const TONES = [
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "bg-sky-500/15 text-sky-700 dark:text-sky-400",
  "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "bg-violet-500/15 text-violet-700 dark:text-violet-400",
  "bg-rose-500/15 text-rose-700 dark:text-rose-400",
  "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
];

export function initials(name?: string | null): string {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function InitialsAvatar({
  name,
  tone = 0,
  className,
}: {
  name?: string | null;
  tone?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
        TONES[tone % TONES.length],
        className
      )}
    >
      {initials(name)}
    </span>
  );
}
