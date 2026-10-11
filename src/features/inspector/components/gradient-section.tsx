"use client";

import { TreeNode } from "@/core/types/builder.types";
import { GradientValue } from "@/core/types/style.types";
import { useStyleField } from "../hooks/use-style-field";
import { SectionShell } from "./section-shell";
import { StyleField } from "./style-field";
import { ColorPickerField } from "./color-picker-field";

const DIRECTIONS: GradientValue["direction"][] = ["to-r", "to-l", "to-t", "to-b", "to-tr", "to-br", "to-tl", "to-bl"];

export function GradientSection({ node }: { node: TreeNode }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);
  const gradient = getValue("bgGradient");

  const update = (patch: Partial<GradientValue>) => {
    if (gradient) setValue("bgGradient", { ...gradient, ...patch });
  };

  return (
    <SectionShell title="Gradient">
      {!gradient ? (
        <button
          type="button"
          onClick={() => setValue("bgGradient", { direction: "to-r", from: "blue-500", to: "purple-500" })}
          className="border rounded px-2 py-1.5 text-xs hover:bg-muted"
        >
          + Thêm gradient nền
        </button>
      ) : (
        <>
          <StyleField label="Hướng" showClear={hasOverride("bgGradient")} onClear={() => clearOverride("bgGradient")}>
            <select
              value={gradient.direction}
              onChange={(event) => update({ direction: event.target.value as GradientValue["direction"] })}
              className="border rounded px-2 py-1"
            >
              {DIRECTIONS.map((direction) => <option key={direction} value={direction}>{direction}</option>)}
            </select>
          </StyleField>
          <StyleField label="From">
            <ColorPickerField value={gradient.from} onChange={(value) => value && update({ from: value })} />
          </StyleField>
          <StyleField label="Via (tuỳ chọn)">
            <ColorPickerField value={gradient.via} onChange={(value) => update({ via: value })} />
          </StyleField>
          <StyleField label="To">
            <ColorPickerField value={gradient.to} onChange={(value) => value && update({ to: value })} />
          </StyleField>
          <button
            type="button"
            onClick={() => setValue("bgGradient", undefined)}
            className="self-start text-xs text-muted-foreground hover:text-foreground"
          >
            Xoá gradient
          </button>
        </>
      )}
    </SectionShell>
  );
}