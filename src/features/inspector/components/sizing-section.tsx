"use client";

import { TreeNode } from "@/core/types/builder.types";
import { StyleProps } from "@/core/types/style.types";
import { useStyleField } from "../hooks/use-style-field";
import { StyleField } from "./style-field";
import { cn } from "@/core/utils/cn";

const PRESETS: { value: Exclude<StyleProps["width"], number | undefined>; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "fit", label: "Fit" },
  { value: "1/2", label: "1/2" },
  { value: "1/3", label: "1/3" },
  { value: "2/3", label: "2/3" },
  { value: "1/4", label: "1/4" },
  { value: "3/4", label: "3/4" },
  { value: "full", label: "Full" },
  { value: "screen", label: "Screen" },
];

function DimensionControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: StyleProps["width"];
  onChange: (value: StyleProps["width"]) => void;
}) {
  const isCustomPx = typeof value === "number";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm">{label}</span>
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => onChange(preset.value)}
            className={cn(
              "border rounded px-2 py-1 text-xs",
              value === preset.value && "bg-primary/10 border-primary text-primary"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          placeholder="px tự do"
          value={isCustomPx ? value : ""}
          onChange={(event) => {
            if (event.target.value === "") return onChange(undefined);
            const number = Number(event.target.value);
            onChange(Number.isFinite(number) ? number : undefined);
          }}
          className="border rounded px-2 py-1 text-xs w-24"
        />
        <span className="text-xs text-muted-foreground">px</span>
        {value !== undefined && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-xs text-muted-foreground hover:text-foreground ml-auto"
          >
            Xoá
          </button>
        )}
      </div>
    </div>
  );
}

export function SizingSection({ node }: { node: TreeNode }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">Sizing</h4>
      <StyleField label="" showClear={hasOverride("width")} onClear={() => clearOverride("width")}>
        <DimensionControl label="Width" value={getValue("width")} onChange={(value) => setValue("width", value)} />
      </StyleField>
      <StyleField label="" showClear={hasOverride("height")} onClear={() => clearOverride("height")}>
        <DimensionControl label="Height" value={getValue("height")} onChange={(value) => setValue("height", value)} />
      </StyleField>
    </div>
  );
}
