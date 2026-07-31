// features/inspector/components/breakpoint-switcher.tsx



"use client";

import { Smartphone, Tablet, Monitor } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import { Breakpoint } from "@/core/types/style.types";
import { cn } from "@/core/utils/cn";

const OPTIONS: { value: Breakpoint; icon: typeof Smartphone; label: string }[] = [
  { value: "base", icon: Smartphone, label: "Mobile" }, // mobile-first: base KHÔNG có prefix
  { value: "md", icon: Tablet, label: "Tablet" },
  { value: "lg", icon: Monitor, label: "Desktop" },
];

export function BreakpointSwitcher() {
  const activeBreakpoint = useBuilderStore((s) => s.activeBreakpoint);
  const setActiveBreakpoint = useBuilderStore((s) => s.setActiveBreakpoint);

  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-md">
      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value} title={label} onClick={() => setActiveBreakpoint(value)}
          className={cn(
            "flex-1 flex items-center justify-center py-1.5 rounded",
            activeBreakpoint === value ? "bg-white shadow-sm" : "text-muted-foreground hover:bg-white/50"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
