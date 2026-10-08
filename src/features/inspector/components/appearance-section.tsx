// features/inspector/components/appearance-section.tsx


"use client";

import { TreeNode } from "@/core/types/builder.types";
import { StyleProps } from "@/core/types/style.types";
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
          onChange={(e) => setValue("borderWidth", (e.target.value === "" ? undefined : Number(e.target.value)) as StyleProps["borderWidth"])}
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
          onChange={(e) => setValue("borderRadius", (e.target.value || undefined) as StyleProps["borderRadius"])}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          {RADIUS_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </StyleField>

      <StyleField label="Shadow" showClear={hasOverride("shadow")} onClear={() => clearOverride("shadow")}>
        <select
          value={getValue("shadow") ?? ""}
          onChange={(e) => setValue("shadow", (e.target.value || undefined) as StyleProps["shadow"])}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          {SHADOW_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </StyleField>

      <StyleField label="Overflow" showClear={hasOverride("overflow")} onClear={() => clearOverride("overflow")}>
        <select
          value={getValue("overflow") ?? ""}
          onChange={(e) => setValue("overflow", (e.target.value || undefined) as StyleProps["overflow"])}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          <option value="visible">visible</option>
          <option value="hidden">hidden</option>
          <option value="scroll">scroll</option>
          <option value="auto">auto</option>
        </select>
      </StyleField>

      <StyleField label="Opacity" showClear={hasOverride("opacity")} onClear={() => clearOverride("opacity")}>
        <select
          value={getValue("opacity") ?? ""}
          onChange={(e) => setValue("opacity", (e.target.value === "" ? undefined : Number(e.target.value)) as StyleProps["opacity"])}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          <option value="0">0%</option>
          <option value="25">25%</option>
          <option value="50">50%</option>
          <option value="75">75%</option>
          <option value="100">100%</option>
        </select>
      </StyleField>
    </div>
  );
}
