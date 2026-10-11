"use client";

import { TreeNode } from "@/core/types/builder.types";
import { StyleProps } from "@/core/types/style.types";
import { useStyleField } from "../hooks/use-style-field";
import { StyleField } from "./style-field";

export function StyleSelectField<K extends keyof StyleProps>({
  node,
  field,
  label,
  options,
}: {
  node: TreeNode;
  field: K;
  label: string;
  options: { value: string | number; label?: string }[];
}) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);
  const current = getValue(field);

  return (
    <StyleField label={label} showClear={hasOverride(field)} onClear={() => clearOverride(field)}>
      <select
        value={current === undefined ? "" : String(current)}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === "") return setValue(field, undefined);
          const match = options.find((option) => String(option.value) === raw);
          if (match) setValue(field, match.value as StyleProps[K]);
        }}
        className="border rounded px-2 py-1"
      >
        <option value="">—</option>
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label ?? String(option.value)}
          </option>
        ))}
      </select>
    </StyleField>
  );
}

export function StyleNumberField<K extends keyof StyleProps>({
  node,
  field,
  label,
}: {
  node: TreeNode;
  field: K;
  label: string;
}) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);
  const current = getValue(field);

  return (
    <StyleField label={label} showClear={hasOverride(field)} onClear={() => clearOverride(field)}>
      <input
        type="number"
        min={0}
        max={24}
        step={1}
        placeholder="—"
        value={typeof current === "number" ? current : ""}
        onChange={(event) => {
          if (event.target.value === "") return setValue(field, undefined);
          const number = Number(event.target.value);
          if (Number.isFinite(number)) setValue(field, number as StyleProps[K]);
        }}
        className="border rounded px-2 py-1"
      />
    </StyleField>
  );
}