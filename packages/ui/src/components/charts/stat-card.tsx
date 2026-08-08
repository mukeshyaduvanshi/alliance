import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "../../lib/utils";
import { Card, CardContent } from "../ui/card";

type StatTone = "green" | "blue" | "amber" | "violet" | "rose" | "cyan";

const TONE_CHIP: Record<StatTone, string> = {
  green: "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  blue: "from-sky-500/15 to-sky-500/5 text-sky-600 dark:text-sky-400",
  amber: "from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400",
  violet: "from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400",
  rose: "from-rose-500/15 to-rose-500/5 text-rose-600 dark:text-rose-400",
  cyan: "from-cyan-500/15 to-cyan-500/5 text-cyan-600 dark:text-cyan-400",
};

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: StatTone;
  className?: string;
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "green",
  className,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        "gap-2 py-4 transition-shadow duration-200 hover:shadow-md",
        className
      )}
    >
      <CardContent className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        </div>
        {Icon && (
          <div
            className={cn(
              "bg-gradient-to-br flex size-12 items-center justify-center rounded-xl shadow-sm",
              TONE_CHIP[tone]
            )}
          >
            <Icon className="size-6" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
