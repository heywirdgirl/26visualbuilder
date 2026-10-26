// features/inspector/components/context-bar.tsx

"use client";

import { useState } from "react";
import { Smartphone, Tablet, Monitor, MousePointerClick } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import type { Breakpoint } from "@/core/types/style.types";
import type { ActiveState } from "@/core/utils/style-cascade";
import { cn } from "@/core/utils/cn";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const BREAKPOINTS: { value: Breakpoint; icon: typeof Smartphone; label: string }[] = [
  { value: "base", icon: Smartphone, label: "Mobile" },
  { value: "md", icon: Tablet, label: "Tablet" },
  { value: "lg", icon: Monitor, label: "Desktop" },
];

const STATES: { id: ActiveState; label: string; hint: string }[] = [
  { id: "normal", label: "Thường", hint: "Style luôn áp dụng" },
  { id: "hover", label: "Hover", hint: "Khi chuột rê vào node" },
  { id: "focus", label: "Focus", hint: "Khi node được focus (bàn phím, ô nhập)" },
  { id: "active", label: "Active", hint: "Khi đang nhấn giữ" },
];

export function ContextBar() {
  const activeBreakpoint = useBuilderStore((s) => s.activeBreakpoint);
  const setActiveBreakpoint = useBuilderStore((s) => s.setActiveBreakpoint);
  const activeState = useBuilderStore((s) => s.activeState);
  const setActiveState = useBuilderStore((s) => s.setActiveState);
  const [open, setOpen] = useState(false);

  const inState = activeState !== "normal";
  const stateLabel = STATES.find((s) => s.id === activeState)?.label ?? "";

  return (
    <div className="flex items-center gap-1 rounded-md bg-muted p-1 ">
      {/* Breakpoint: luôn hiện, khóa khi đang ở state */}
      {BREAKPOINTS.map(({ value, icon: Icon, label }) => {
        const selected = activeBreakpoint === value && !inState;
        return (
          <button
            key={value}
            type="button"
            title={inState ? "Breakpoint chỉ áp dụng ở trạng thái Thường" : label}
            disabled={inState}
            onClick={() => setActiveBreakpoint(value)}
            className={cn(
              "flex flex-1 items-center justify-center rounded py-1.5 transition-colors",
              selected ? "bg-white shadow-sm" : "text-muted-foreground hover:bg-white/50",
              inState && "cursor-not-allowed opacity-40"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}

      {/* State: ẩn trong popover; khi đang bật, hiện tên state để không quên */}
      <Popover open={open} onOpenChange={setOpen} >
        <PopoverTrigger asChild>
          <button
            type="button"
            title="Trạng thái tương tác"
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1.5 text-[11px] transition-colors",
              inState ? "bg-sky-500 text-white" : "text-muted-foreground hover:bg-white/50"
            )}
          >
            <MousePointerClick className="h-3.5 w-3.5" />
            {inState && <span>{stateLabel}</span>}
          </button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-52 p-1 z-[7000]">
          {STATES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActiveState(s.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full flex-col items-start rounded px-2 py-1.5 text-left hover:bg-zinc-100",
                activeState === s.id && "bg-sky-50"
              )}
            >
              <span className="text-xs font-medium">{s.label}</span>
              <span className="text-[10px] text-muted-foreground">{s.hint}</span>
            </button>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}