"use client";

import { Box, type LucideIcon } from "lucide-react";
import { cn } from "@/core/utils/cn";

export function NodeListRow({
  title,
  Icon,
  iconName,
  badge,
  selected,
  onClick,
}: {
  title: string;
  Icon?: LucideIcon;
  iconName?: string;
  badge?: string;
  selected?: boolean;
  onClick: () => void;
}) {
  const IconComp = Icon ?? (iconName === "Box" ? Box : undefined);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
        selected && "bg-primary/10 text-primary"
      )}
    >
      {IconComp ? <IconComp className="h-3.5 w-3.5 shrink-0" /> : <span className="w-3.5 shrink-0" />}
      <span className="truncate">{title}</span>
      {badge && <span className="ml-auto text-[10px] text-muted-foreground">{badge}</span>}
    </button>
  );
}
