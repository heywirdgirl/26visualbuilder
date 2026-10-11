"use client";

import { TreeNode } from "@/core/types/builder.types";
import { useStyleField } from "../hooks/use-style-field";
import { SectionShell } from "./section-shell";
import { StyleField } from "./style-field";
import { StyleNumberField, StyleSelectField } from "./style-controls";
import { cn } from "@/core/utils/cn";

const options = (...values: (string | number)[]) => values.map((value) => ({ value }));

function MarginXField({ node }: { node: TreeNode }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);
  const current = getValue("marginX");

  return (
    <StyleField label="Margin X" showClear={hasOverride("marginX")} onClear={() => clearOverride("marginX")}>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          max={24}
          step={1}
          placeholder="—"
          value={typeof current === "number" ? current : ""}
          onChange={(event) => {
            if (event.target.value === "") return setValue("marginX", undefined);
            const number = Number(event.target.value);
            if (Number.isFinite(number)) setValue("marginX", number);
          }}
          className="w-20 border rounded px-2 py-1"
        />
        <button
          type="button"
          onClick={() => setValue("marginX", current === "auto" ? undefined : "auto")}
          className={cn("border rounded px-2 py-1 text-xs", current === "auto" && "bg-primary/10 border-primary text-primary")}
        >
          auto
        </button>
      </div>
    </StyleField>
  );
}

export function ExtrasSection({ node }: { node: TreeNode }) {
  return (
    <SectionShell title="More">
      <p className="-mt-1 text-[10px] text-muted-foreground">Căn giữa container: đặt Max width + Margin X = auto.</p>
      <StyleSelectField node={node} field="maxWidth" label="Max width" options={options("sm", "md", "lg", "xl", "2xl", "4xl", "6xl", "7xl", "full", "prose")} />
      <MarginXField node={node} />
      <StyleNumberField node={node} field="marginY" label="Margin Y" />
      <StyleNumberField node={node} field="paddingX" label="Padding X" />
      <StyleNumberField node={node} field="paddingY" label="Padding Y" />
      <StyleSelectField node={node} field="gridCols" label="Grid columns" options={options(1, 2, 3, 4, 6, 12)} />
      <StyleNumberField node={node} field="gapX" label="Gap X" />
      <StyleNumberField node={node} field="gapY" label="Gap Y" />
      <StyleSelectField node={node} field="display" label="Display" options={options("block", "inline-block", "hidden")} />
      <StyleSelectField node={node} field="objectFit" label="Object fit" options={options("cover", "contain", "fill")} />
      <StyleSelectField node={node} field="aspectRatio" label="Aspect ratio" options={options("auto", "square", "video")} />
      <StyleSelectField node={node} field="cursor" label="Cursor" options={options("pointer", "default", "not-allowed")} />
    </SectionShell>
  );
}