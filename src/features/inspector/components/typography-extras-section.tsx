"use client";

import { TreeNode } from "@/core/types/builder.types";
import { SectionShell } from "./section-shell";
import { StyleSelectField } from "./style-controls";

const options = (...values: string[]) => values.map((value) => ({ value }));

export function TypographyExtrasSection({ node }: { node: TreeNode }) {
  return (
    <SectionShell title="Typography+">
      <StyleSelectField node={node} field="fontFamily" label="Font family" options={options("sans", "serif", "mono")} />
      <StyleSelectField node={node} field="lineHeight" label="Line height" options={options("none", "tight", "snug", "normal", "relaxed", "loose")} />
      <StyleSelectField node={node} field="letterSpacing" label="Letter spacing" options={options("tighter", "tight", "normal", "wide", "wider", "widest")} />
      <StyleSelectField node={node} field="textTransform" label="Text transform" options={options("uppercase", "lowercase", "capitalize", "normal-case")} />
      <StyleSelectField node={node} field="textDecoration" label="Decoration" options={options("underline", "line-through", "no-underline")} />
    </SectionShell>
  );
}