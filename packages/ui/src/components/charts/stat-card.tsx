import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "../../lib/utils";
import { Card, CardContent } from "../ui/card";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, hint, icon: Icon, className }: StatCardProps) {
  return (
    <Card className={cn("gap-2 py-4", className)}>
      <CardContent className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-2xl font-semibold">{value}</p>
          {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
        </div>
        {Icon && (
          <div className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-lg">
            <Icon className="size-5" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
