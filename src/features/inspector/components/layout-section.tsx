// src/features/inspector/components/layout-section.tsx

"use client";

import { TreeNode, ContainerProps } from "@/core/types/builder.types";
import { useBuilderStore } from "@/core/store/builder-store";

const ALIGN_OPTIONS = ["items-start", "items-center", "items-end"] as const;
const JUSTIFY_OPTIONS = ["justify-start", "justify-center", "justify-between", "justify-end"] as const;

export function LayoutSection({ node }: { node: TreeNode }) {
  const updateNodeProps = useBuilderStore((s) => s.updateNodeProps);
  const props = node.props as ContainerProps;

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">Layout</h4>

      <label className="flex flex-col gap-1 text-sm">
        Hướng
        <select
          value={props.direction}
          onChange={(e) => updateNodeProps(node.id, { direction: e.target.value as ContainerProps["direction"] })}
          className="border rounded px-2 py-1"
        >
          <option value="flex-row">Ngang (flex-row)</option>
          <option value="flex-col">Dọc (flex-col)</option>
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Gap
        <input
          type="number" min={0} value={props.gap ?? 0}
          onChange={(e) => updateNodeProps(node.id, { gap: Number(e.target.value) })}
          className="border rounded px-2 py-1"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Padding
        <input
          type="number" min={0} value={props.padding ?? 0}
          onChange={(e) => updateNodeProps(node.id, { padding: Number(e.target.value) })}
          className="border rounded px-2 py-1"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Align
        <select
          value={props.align ?? ""}
          onChange={(e) => updateNodeProps(node.id, { align: e.target.value as ContainerProps["align"] })}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          {ALIGN_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Justify
        <select
          value={props.justify ?? ""}
          onChange={(e) => updateNodeProps(node.id, { justify: e.target.value as ContainerProps["justify"] })}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          {JUSTIFY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </label>
    </div>
  );
}