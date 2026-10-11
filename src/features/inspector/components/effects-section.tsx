"use client";

import { TreeNode } from "@/core/types/builder.types";
import { useStyleField } from "../hooks/use-style-field";
import { SectionShell } from "./section-shell";
import { StyleField } from "./style-field";
import { StyleSelectField } from "./style-controls";
import { ColorPickerField } from "./color-picker-field";

const OPACITY = [10, 20, 30, 40, 50, 60, 70, 80, 90].map((value) => ({ value, label: `${value}%` }));
const RING = [0, 1, 2, 4, 8].map((value) => ({ value, label: `${value}px` }));
const BLUR = ["none", "sm", "md", "lg", "xl"].map((value) => ({ value }));
const BACKDROP = ["none", "sm", "md", "lg", "xl", "2xl"].map((value) => ({ value }));

export function EffectsSection({ node }: { node: TreeNode }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);

  return (
    <SectionShell title="Effects">
      <p className="-mt-1 text-[10px] text-muted-foreground">
        Opacity áp lên màu đã chọn (Background / Text / Border).
      </p>
      <StyleSelectField node={node} field="bgOpacity" label="Background opacity" options={OPACITY} />
      <StyleSelectField node={node} field="textOpacity" label="Text opacity" options={OPACITY} />
      <StyleSelectField node={node} field="borderOpacity" label="Border opacity" options={OPACITY} />
      <StyleField label="Shadow color" showClear={hasOverride("shadowColor")} onClear={() => clearOverride("shadowColor")}>
        <ColorPickerField value={getValue("shadowColor")} onChange={(value) => setValue("shadowColor", value)} />
      </StyleField>
      <StyleSelectField node={node} field="ringWidth" label="Ring" options={RING} />
      <StyleField label="Ring color" showClear={hasOverride("ringColor")} onClear={() => clearOverride("ringColor")}>
        <ColorPickerField value={getValue("ringColor")} onChange={(value) => setValue("ringColor", value)} />
      </StyleField>
      <StyleSelectField node={node} field="backdropBlur" label="Backdrop blur" options={BACKDROP} />
      <StyleSelectField node={node} field="blur" label="Blur" options={BLUR} />
    </SectionShell>
  );
}