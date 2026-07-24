// features/inspector/components/dynamic-props-form.tsx

"use client";

import { TreeNode } from "@/core/types/builder.types";
import { useBuilderStore } from "@/core/store/builder-store";
import { getNodeDefinition } from "@/core/registry/node-registry";

export function DynamicPropsForm({ node }: { node: TreeNode }) {
  const updateNodeProps = useBuilderStore((s) => s.updateNodeProps);
  const def = getNodeDefinition(node.type);

  if (!def || def.propsSchema.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">{def.title} Props</h4>

      {def.propsSchema.map((meta) => {
        const value = node.props[meta.key];

        if (meta.inputType === "checkbox") {
          return (
            <label key={meta.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!value}
                onChange={(e) => updateNodeProps(node.id, { [meta.key]: e.target.checked })}
              />
              {meta.label}
            </label>
          );
        }

        if (meta.inputType === "select") {
          return (
            <label key={meta.key} className="flex flex-col gap-1 text-sm">
              {meta.label}
              <select
                value={String(value ?? "")}
                onChange={(e) => updateNodeProps(node.id, { [meta.key]: e.target.value })}
                className="border rounded px-2 py-1"
              >
                {(meta.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>
          );
        }

        if (meta.inputType === "textarea") {
          return (
            <label key={meta.key} className="flex flex-col gap-1 text-sm">
              {meta.label}
              <textarea
                value={String(value ?? "")}
                onChange={(e) => updateNodeProps(node.id, { [meta.key]: e.target.value })}
                className="border rounded px-2 py-1"
              />
            </label>
          );
        }

        if (meta.inputType === "number") {
          return (
            <label key={meta.key} className="flex flex-col gap-1 text-sm">
              {meta.label}
              <input
                type="number"
                value={Number(value ?? 0)}
                onChange={(e) => updateNodeProps(node.id, { [meta.key]: Number(e.target.value) })}
                className="border rounded px-2 py-1"
              />
            </label>
          );
        }

        // text (default)
        return (
          <label key={meta.key} className="flex flex-col gap-1 text-sm">
            {meta.label}
            <input
              type="text"
              value={String(value ?? "")}
              onChange={(e) => updateNodeProps(node.id, { [meta.key]: e.target.value })}
              className="border rounded px-2 py-1"
            />
          </label>
        );
      })}
    </div>
  );
}