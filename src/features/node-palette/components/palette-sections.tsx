"use client";

import type { ReactNode } from "react";
import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/core/utils/cn";
import type { NodeTier } from "@/core/types/node-definition.types";

export const TIER_BADGE: Partial<Record<NodeTier, string>> = {
  component: "Cụm",
  block: "Block",
};

export function PaletteTile({
  title,
  Icon,
  badge,
  onClick,
}: {
  title: string;
  Icon: LucideIcon;
  badge?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="relative flex h-14 flex-col items-center justify-center gap-1 rounded-md border bg-background px-1 hover:bg-accent active:bg-accent"
    >
      {badge && (
        <span className="absolute right-1 top-0.5 text-[8px] font-medium text-primary">{badge}</span>
      )}
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="w-full truncate text-center text-[10px] leading-tight">{title}</span>
    </button>
  );
}

export function BlockCard({
  title,
  description,
  Icon,
  nodeCount,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  Icon: LucideIcon;
  nodeCount: number;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-md border bg-background p-2 text-left hover:bg-accent active:bg-accent",
        selected && "border-primary bg-primary/10"
      )}
    >
      <div className="flex w-full items-center gap-1.5">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-xs font-medium">{title}</span>
        <span className="ml-auto shrink-0 text-[9px] text-muted-foreground">{nodeCount} node</span>
      </div>
      <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">{description}</p>
    </button>
  );
}

export function PaletteSection({
  label,
  count,
  open = true,
  onToggle,
  children,
}: {
  label: string;
  count?: number;
  open?: boolean;
  onToggle?: () => void;
  children: ReactNode;
}) {
  return (
    <section>
      <button
        type="button"
        onClick={onToggle}
        disabled={!onToggle}
        className={cn(
          "flex w-full items-center gap-1 px-1 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
          onToggle && "hover:text-foreground"
        )}
      >
        {onToggle && (
          open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />
        )}
        {label}
        {count !== undefined && <span className="ml-auto font-normal">{count}</span>}
      </button>
      {open && children}
    </section>
  );
}

const TABS: { id: NodeTier; label: string; disabled?: boolean }[] = [
  { id: "element", label: "Elements" },
  { id: "component", label: "Components" },
  { id: "block", label: "Blocks" },
];

export function PaletteTabs({
  value,
  onChange,
  counts,
}: {
  value: NodeTier;
  onChange: (tier: NodeTier) => void;
  counts: { element: number; component: number; block: number };
}) {
  return (
    <div className="flex gap-1 border-b px-2 py-1.5">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          disabled={tab.disabled}
          title={tab.disabled ? "Sắp có" : undefined}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex-1 rounded-md px-2 py-1 text-xs",
            value === tab.id ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            tab.disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
          )}
        >
          {tab.label}
          <span className="ml-1 opacity-60">{counts[tab.id]}</span>
        </button>
      ))}
    </div>
  );
}
