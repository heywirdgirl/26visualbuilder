// src/features/inspector/components/layout-section.tsx


"use client";

import { TreeNode } from "@/core/types/builder.types";
import { StyleProps } from "@/core/types/style.types";
import { useStyleField } from "../hooks/use-style-field";
import { StyleField } from "./style-field";

const ALIGN_OPTIONS = ["items-start", "items-center", "items-end"] as const;
const JUSTIFY_OPTIONS = ["justify-start", "justify-center", "justify-between", "justify-end"] as const;

export function LayoutSection({ node }: { node: TreeNode }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">Layout</h4>

      <StyleField label="Hướng" showClear={hasOverride("direction")} onClear={() => clearOverride("direction")}>
        <select
          value={getValue("direction") ?? "flex-col"}
          onChange={(e) => setValue("direction", e.target.value as StyleProps["direction"])}
          className="border rounded px-2 py-1"
        >
          <option value="flex-row">Ngang (flex-row)</option>
          <option value="flex-col">Dọc (flex-col)</option>
        </select>
      </StyleField>

      <StyleField label="Gap" showClear={hasOverride("gap")} onClear={() => clearOverride("gap")}>
        <input
          type="number" min={0} value={getValue("gap") ?? 0}
          onChange={(e) => setValue("gap", Number(e.target.value))}
          className="border rounded px-2 py-1"
        />
      </StyleField>

      <StyleField label="Align" showClear={hasOverride("align")} onClear={() => clearOverride("align")}>
        <select
          value={getValue("align") ?? ""}
          onChange={(e) => setValue("align", (e.target.value || undefined) as StyleProps["align"])}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          {ALIGN_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </StyleField>

      <StyleField label="Justify" showClear={hasOverride("justify")} onClear={() => clearOverride("justify")}>
        <select
          value={getValue("justify") ?? ""}
          onChange={(e) => setValue("justify", (e.target.value || undefined) as StyleProps["justify"])}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          {JUSTIFY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </StyleField>

      <StyleField label="Flex Wrap" showClear={hasOverride("flexWrap")} onClear={() => clearOverride("flexWrap")}>
        <select
          value={getValue("flexWrap") ?? ""}
          onChange={(e) => setValue("flexWrap", (e.target.value || undefined) as StyleProps["flexWrap"])}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          <option value="flex-nowrap">Không xuống dòng</option>
          <option value="flex-wrap">Tự xuống dòng</option>
          <option value="flex-wrap-reverse">Xuống dòng ngược</option>
        </select>
      </StyleField>
    </div>
  );
}
