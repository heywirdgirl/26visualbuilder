// src/features/inspector/components/props-section.tsx

"use client";

import { TreeNode, ButtonProps, CardProps } from "@/core/types/builder.types";
import { useBuilderStore } from "@/core/store/builder-store";

const VARIANT_OPTIONS: ButtonProps["variant"][] = ["default", "destructive", "outline", "ghost"];
const SIZE_OPTIONS: ButtonProps["size"][] = ["sm", "default", "lg"];

export function PropsSection({ node }: { node: TreeNode }) {
  const updateNodeProps = useBuilderStore((s) => s.updateNodeProps);

  if (node.type === "button") {
    const props = node.props as ButtonProps;
    return (
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase">Button Props</h4>

        <label className="flex flex-col gap-1 text-sm">
          Nội dung
          <input
            type="text" value={props.text}
            onChange={(e) => updateNodeProps(node.id, { text: e.target.value })}
            className="border rounded px-2 py-1"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Variant
          <select
            value={props.variant}
            onChange={(e) => updateNodeProps(node.id, { variant: e.target.value as ButtonProps["variant"] })}
            className="border rounded px-2 py-1"
          >
            {VARIANT_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Size
          <select
            value={props.size}
            onChange={(e) => updateNodeProps(node.id, { size: e.target.value as ButtonProps["size"] })}
            className="border rounded px-2 py-1"
          >
            {SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
    );
  }

  if (node.type === "card") {
    const props = node.props as CardProps;
    return (
      <div className="flex flex-col gap-3">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase">Card Props</h4>

        <label className="flex flex-col gap-1 text-sm">
          Title
          <input
            type="text" value={props.title}
            onChange={(e) => updateNodeProps(node.id, { title: e.target.value })}
            className="border rounded px-2 py-1"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Description
          <input
            type="text" value={props.description ?? ""}
            onChange={(e) => updateNodeProps(node.id, { description: e.target.value })}
            className="border rounded px-2 py-1"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Content
          <textarea
            value={props.content ?? ""}
            onChange={(e) => updateNodeProps(node.id, { content: e.target.value })}
            className="border rounded px-2 py-1"
          />
        </label>
      </div>
    );
  }

  return null;
}