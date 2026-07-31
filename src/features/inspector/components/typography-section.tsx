// features/inspector/components/typography-section.tsx


"use client";

import { AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { TreeNode } from "@/core/types/builder.types";
import { useStyleField } from "../hooks/use-style-field";
import { StyleField } from "./style-field";
import { ColorPickerField } from "./color-picker-field";
import { cn } from "@/core/utils/cn";

const FONT_SIZE_OPTIONS = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"] as const;
const FONT_WEIGHT_OPTIONS = ["normal", "medium", "semibold", "bold"] as const;
const ALIGN_OPTIONS = [
  { value: "left", icon: AlignLeft },
  { value: "center", icon: AlignCenter },
  { value: "right", icon: AlignRight },
] as const;

export function TypographySection({ node }: { node: TreeNode }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">Typography</h4>

      <StyleField label="Font size" showClear={hasOverride("fontSize")} onClear={() => clearOverride("fontSize")}>
        <select
          value={getValue("fontSize") ?? ""}
          onChange={(e) => setValue("fontSize", (e.target.value || undefined) as any)}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          {FONT_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </StyleField>

      <StyleField label="Font weight" showClear={hasOverride("fontWeight")} onClear={() => clearOverride("fontWeight")}>
        <select
          value={getValue("fontWeight") ?? ""}
          onChange={(e) => setValue("fontWeight", (e.target.value || undefined) as any)}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          {FONT_WEIGHT_OPTIONS.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
      </StyleField>

      <StyleField label="Text align" showClear={hasOverride("textAlign")} onClear={() => clearOverride("textAlign")}>
        <div className="flex gap-1">
          {ALIGN_OPTIONS.map(({ value, icon: Icon }) => (
            <button
              key={value} type="button" onClick={() => setValue("textAlign", value)}
              className={cn(
                "flex-1 border rounded py-1 flex items-center justify-center",
                getValue("textAlign") === value && "bg-primary/10 border-primary text-primary"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </StyleField>

      <StyleField label="Text color" showClear={hasOverride("textColor")} onClear={() => clearOverride("textColor")}>
        <ColorPickerField value={getValue("textColor")} onChange={(v) => setValue("textColor", v)} />
      </StyleField>
    </div>
  );
}
