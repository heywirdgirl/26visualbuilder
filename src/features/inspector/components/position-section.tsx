"use client";

import { TreeNode } from "@/core/types/builder.types";
import { StyleProps } from "@/core/types/style.types";
import { useStyleField } from "../hooks/use-style-field";
import { StyleField } from "./style-field";
import { cn } from "@/core/utils/cn";

const POSITION_OPTIONS: NonNullable<StyleProps["position"]>[] = [
  "static", "relative", "absolute", "fixed", "sticky",
];
const Z_INDEX_OPTIONS: NonNullable<StyleProps["zIndex"]>[] = [0, 10, 20, 30, 40, 50];

function OffsetInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5 text-xs">
      {label}
      <input
        type="number"
        value={value ?? ""}
        placeholder="—"
        onChange={(event) => {
          if (event.target.value === "") return onChange(undefined);
          const number = Number(event.target.value);
          onChange(Number.isFinite(number) ? number : undefined);
        }}
        className="border rounded px-2 py-1"
      />
    </label>
  );
}

export function PositionSection({ node }: { node: TreeNode }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);
  const position = getValue("position");
  const showOffsets = !!position && position !== "static";

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">Position</h4>
      <StyleField label="Position" showClear={hasOverride("position")} onClear={() => clearOverride("position")}>
        <div className="flex flex-wrap gap-1">
          {POSITION_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setValue("position", option)}
              className={cn(
                "border rounded px-2 py-1 text-xs capitalize",
                position === option && "bg-primary/10 border-primary text-primary"
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </StyleField>
      {showOffsets && (
        <div className="grid grid-cols-2 gap-2">
          <OffsetInput label="Top" value={getValue("top")} onChange={(value) => setValue("top", value)} />
          <OffsetInput label="Right" value={getValue("right")} onChange={(value) => setValue("right", value)} />
          <OffsetInput label="Bottom" value={getValue("bottom")} onChange={(value) => setValue("bottom", value)} />
          <OffsetInput label="Left" value={getValue("left")} onChange={(value) => setValue("left", value)} />
        </div>
      )}
      <StyleField label="Z-index" showClear={hasOverride("zIndex")} onClear={() => clearOverride("zIndex")}>
        <div className="flex flex-wrap gap-1">
          {Z_INDEX_OPTIONS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue("zIndex", value)}
              className={cn(
                "border rounded px-2 py-1 text-xs",
                getValue("zIndex") === value && "bg-primary/10 border-primary text-primary"
              )}
            >
              {value}
            </button>
          ))}
        </div>
      </StyleField>
    </div>
  );
}
