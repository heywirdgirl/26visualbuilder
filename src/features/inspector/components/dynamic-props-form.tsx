"use client";

import { useState } from "react";
import type { TreeNode } from "@/core/types/builder.types";
import { useBuilderStore } from "@/core/store/builder-store";
import { getNodeDefinition } from "@/core/registry/node-registry";
import type { PropMeta } from "@/core/types/node-definition.types";

export function DynamicPropsForm({ node }: { node: TreeNode }) {
  const updateNodeProps = useBuilderStore((state) => state.updateNodeProps);
  const def = getNodeDefinition(node.type);
  if (!def || def.propsSchema.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {def.propsSchema.map((meta) => (
        <PropField
          key={`${node.id}:${meta.key}`}
          meta={meta}
          value={node.props[meta.key]}
          onChange={(next) => updateNodeProps(node.id, { [meta.key]: next })}
        />
      ))}
    </div>
  );
}

function PropField({
  meta,
  value,
  onChange,
}: {
  meta: PropMeta;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  switch (meta.inputType) {
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(event) => onChange(event.target.checked)}
          />
          {meta.label}
        </label>
      );
    case "select":
      return (
        <FieldShell label={meta.label}>
          <select
            value={String(value ?? "")}
            onChange={(event) => onChange(event.target.value)}
            className="border rounded px-2 py-1"
          >
            {(meta.options ?? []).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </FieldShell>
      );
    case "textarea":
      return (
        <FieldShell label={meta.label}>
          <textarea
            value={String(value ?? "")}
            onChange={(event) => onChange(event.target.value)}
            className="border rounded px-2 py-1"
          />
        </FieldShell>
      );
    case "number":
      return (
        <FieldShell label={meta.label}>
          <NumberDraftInput
            key={`${nodeValueKey(value)}`}
            value={typeof value === "number" ? value : undefined}
            onCommit={onChange}
          />
        </FieldShell>
      );
    default:
      return (
        <FieldShell label={meta.label}>
          <input
            type="text"
            value={String(value ?? "")}
            onChange={(event) => onChange(event.target.value)}
            className="border rounded px-2 py-1"
          />
        </FieldShell>
      );
  }
}

function nodeValueKey(value: unknown): string {
  return typeof value === "number" ? String(value) : "";
}

function FieldShell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      {children}
    </label>
  );
}

function NumberDraftInput({
  value,
  onCommit,
}: {
  value?: number;
  onCommit: (next: number | undefined) => void;
}) {
  const stored = value === undefined ? "" : String(value);
  const [draft, setDraft] = useState(stored);

  const commit = () => {
    if (draft.trim() === "") return onCommit(undefined);
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) return setDraft(stored);
    onCommit(parsed);
    setDraft(String(parsed));
  };

  return (
    <input
      type="number"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit();
      }}
      className="border rounded px-2 py-1"
    />
  );
}
