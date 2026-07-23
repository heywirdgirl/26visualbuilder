// features/node-palette/components/node-list-row.tsx

"use client";

import type { ComponentType } from "react";
import * as LucideIcons from "lucide-react";
import { NodeDefinition } from "@/core/types/node-definition.types";
import { cn } from "@/core/utils/cn";

export function NodeListRow({
  def,
  selected,
  onClick,
}: {
  def: NodeDefinition;
  selected?: boolean;
  onClick: () => void;
}) {
  const IconComp = def.icon
    ? (LucideIcons as unknown as Record<string, ComponentType<any>>)[def.icon]
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
      <span className="truncate">{def.title}</span>
    </button>
  );
}