// features/inspector/components/spacing-section.tsx


"use client";

import { TreeNode } from "@/core/types/builder.types";
import { useStyleField } from "../hooks/use-style-field";
import { StyleField } from "./style-field";

export function SpacingSection({ node }: { node: TreeNode }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">Spacing</h4>

      <StyleField label="Padding" showClear={hasOverride("padding")} onClear={() => clearOverride("padding")}>
        <input
          type="number" min={0} value={getValue("padding") ?? 0}
          onChange={(e) => setValue("padding", Number(e.target.value))}
          className="border rounded px-2 py-1"
        />
      </StyleField>

      <StyleField label="Margin" showClear={hasOverride("margin")} onClear={() => clearOverride("margin")}>
        <input
          type="number" min={0} value={getValue("margin") ?? 0}
          onChange={(e) => setValue("margin", Number(e.target.value))}
          className="border rounded px-2 py-1"
        />
      </StyleField>
    </div>
  );
}
