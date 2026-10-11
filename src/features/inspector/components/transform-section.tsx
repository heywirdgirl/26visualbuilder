"use client";

import { TreeNode } from "@/core/types/builder.types";
import { SectionShell } from "./section-shell";
import { StyleSelectField } from "./style-controls";

const SCALE = [50, 75, 90, 95, 100, 105, 110, 125].map((value) => ({ value, label: `${value}%` }));
const ROTATE = [-45, -12, -6, -3, -2, -1, 1, 2, 3, 6, 12, 45, 90, 180].map((value) => ({ value, label: `${value}°` }));
const TRANSLATE = [-4, -2, -1, 1, 2, 4].map((value) => ({ value, label: `${value * 4}px` }));
const TRANSITION = ["none", "all", "colors", "shadow", "transform"].map((value) => ({ value }));
const DURATION = [75, 150, 200, 300, 500, 700].map((value) => ({ value, label: `${value}ms` }));

export function TransformSection({ node }: { node: TreeNode }) {
  return (
    <SectionShell title="Transform & Transition">
      <StyleSelectField node={node} field="scale" label="Scale" options={SCALE} />
      <StyleSelectField node={node} field="rotate" label="Rotate" options={ROTATE} />
      <StyleSelectField node={node} field="translateX" label="Translate X" options={TRANSLATE} />
      <StyleSelectField node={node} field="translateY" label="Translate Y" options={TRANSLATE} />
      <StyleSelectField node={node} field="transition" label="Transition" options={TRANSITION} />
      <StyleSelectField node={node} field="duration" label="Duration" options={DURATION} />
    </SectionShell>
  );
}