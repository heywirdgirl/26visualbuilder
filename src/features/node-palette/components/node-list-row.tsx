// features/node-palette/components/node-list-row.tsx

"use client";

import type { ComponentType } from "react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/core/utils/cn";

export function NodeListRow({
  title,
  iconName,
  selected,
  onClick,
}: {
  title: string;
  iconName?: string;
  selected?: boolean;
  onClick: () => void;
}) {
  const IconComp = iconName
    ? (LucideIcons as unknown as Record<string, ComponentType<any>>)[iconName]
    : undefined;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 text-left text-sm px-2 py-1.5 rounded hover:bg-muted",
        selected && "bg-primary/10 text-primary"
      )}
    >
      {IconComp ? <IconComp className="h-3.5 w-3.5 shrink-0" /> : <span className="w-3.5 shrink-0" />}
      <span className="truncate">{title}</span>
    </button>
  );
}