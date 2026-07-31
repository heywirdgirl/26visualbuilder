// features/inspector/components/appearance-section.tsx


"use client";

import { TreeNode } from "@/core/types/builder.types";
import { useStyleField } from "../hooks/use-style-field";
import { StyleField } from "./style-field";
import { ColorPickerField } from "./color-picker-field";

const BORDER_WIDTH_OPTIONS = [0, 1, 2, 4] as const;
const RADIUS_OPTIONS = ["none", "sm", "md", "lg", "xl", "full"] as const;
const SHADOW_OPTIONS = ["none", "sm", "md", "lg", "xl"] as const;

export function AppearanceSection({ node }: { node: TreeNode }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">Appearance</h4>

      <StyleField label="Background" showClear={hasOverride("bgColor")} onClear={() => clearOverride("bgColor")}>
        <ColorPickerField value={getValue("bgColor")} onChange={(v) => setValue("bgColor", v)} />
      </StyleField>

      <StyleField label="Border width" showClear={hasOverride("borderWidth")} onClear={() => clearOverride("borderWidth")}>
        <select
          value={getValue("borderWidth") ?? ""}
          onChange={(e) => setValue("borderWidth", (e.target.value === "" ? undefined : Number(e.target.value)) as any)}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          {BORDER_WIDTH_OPTIONS.map((w) => <option key={w} value={w}>{w}px</option>)}
        </select>
      </StyleField>

      <StyleField label="Border color" showClear={hasOverride("borderColor")} onClear={() => clearOverride("borderColor")}>
        <ColorPickerField value={getValue("borderColor")} onChange={(v) => setValue("borderColor", v)} />
      </StyleField>

      <StyleField label="Border radius" showClear={hasOverride("borderRadius")} onClear={() => clearOverride("borderRadius")}>
        <select
          value={getValue("borderRadius") ?? ""}
          onChange={(e) => setValue("borderRadius", (e.target.value || undefined) as any)}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </StyleField>

      <StyleField label="Shadow" showClear={hasOverride("shadow")} onClear={() => clearOverride("shadow")}>
        <select
          value={getValue("shadow") ?? ""}
          onChange={(e) => setValue("shadow", (e.target.value || undefined) as any)}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          {SHADOW_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </StyleField>
    </div>
  );
}
