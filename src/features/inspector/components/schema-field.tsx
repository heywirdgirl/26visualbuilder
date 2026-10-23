"use client";

import { useState } from "react";
import type { TreeNode } from "@/core/types/builder.types";
import type { StyleProps } from "@/core/types/style.types";
import { useStyleField } from "../hooks/use-style-field";
import type { FieldControl, EnumOption, StyleFieldSpec } from "../constants/style-field-schema";
import { StyleField } from "./style-field";

const COLOR_TOKEN = /^[a-z]+(?:-[a-z]+)?(?:-\d{2,3})?(?:\/(?:[0-9]|[1-9][0-9]|100))?$/;
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const isValidColor = (value: string) => COLOR_TOKEN.test(value) || HEX_COLOR.test(value);

export function SchemaField({ node, spec }: { node: TreeNode; spec: StyleFieldSpec }) {
  const { getValue, setValue, hasOverride, clearOverride, layer } = useStyleField(node);
  const value = getValue(spec.key);

  return (
    <StyleField
      label={spec.label}
      showClear={hasOverride(spec.key)}
      onClear={() => clearOverride(spec.key)}
    >
      <ControlRenderer
        key={`${node.id}:${layer}:${String(value ?? "")}`}
        control={spec.control}
        value={value}
        onChange={(next) => setValue(spec.key, next as StyleProps[typeof spec.key])}
      />
    </StyleField>
  );
}

function ControlRenderer({
  control,
  value,
  onChange,
}: {
  control: FieldControl;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  switch (control.kind) {
    case "enum":
      return <EnumSelect options={control.options} value={value} onChange={onChange} />;
    case "int":
      return (
        <IntInput
          value={typeof value === "number" ? value : undefined}
          min={control.min}
          max={control.max}
          onCommit={onChange}
        />
      );
    case "size":
      return <SizeControl keywords={control.keywords} value={value} onChange={onChange} />;
    case "color":
      return <ColorInput value={typeof value === "string" ? value : undefined} onCommit={onChange} />;
  }
}

function EnumSelect({
  options,
  value,
  onChange,
}: {
  options: EnumOption[];
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const raw = value === undefined ? "" : String(value);
  return (
    <select
      value={raw}
      onChange={(event) => {
        const picked = event.target.value;
        if (picked === "") return onChange(undefined);
        const match = options.find((option) => String(option.value) === picked);
        if (match) onChange(match.value);
      }}
      className="border rounded px-2 py-1"
    >
      <option value="">—</option>
      {options.map((option) => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function IntInput({
  value,
  min,
  max,
  onCommit,
}: {
  value?: number;
  min: number;
  max: number;
  onCommit: (next: number | undefined) => void;
}) {
  const stored = value === undefined ? "" : String(value);
  const [draft, setDraft] = useState(stored);

  const commit = () => {
    if (draft.trim() === "") return onCommit(undefined);
    const parsed = Number(draft);
    if (!Number.isInteger(parsed)) return setDraft(stored);
    const clamped = Math.min(max, Math.max(min, parsed));
    onCommit(clamped);
    setDraft(String(clamped));
  };

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={1}
      placeholder="—"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") commit();
      }}
      className="border rounded px-2 py-1 w-full"
    />
  );
}

function SizeControl({
  keywords,
  value,
  onChange,
}: {
  keywords: string[];
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const isPx = typeof value === "number";
  const selectValue = isPx ? "__px" : value === undefined ? "" : String(value);

  return (
    <div className="flex gap-1">
      <select
        value={selectValue}
        onChange={(event) => {
          const picked = event.target.value;
          if (picked === "") return onChange(undefined);
          if (picked === "__px") return onChange(isPx ? value : 0);
          onChange(picked);
        }}
        className="border rounded px-2 py-1 min-w-0 flex-1"
      >
        <option value="">—</option>
        {keywords.map((keyword) => (
          <option key={keyword} value={keyword}>
            {keyword}
          </option>
        ))}
        <option value="__px">px</option>
      </select>
      {isPx && (
        <div className="w-20">
          <IntInput value={value} min={0} max={2000} onCommit={onChange} />
        </div>
      )}
    </div>
  );
}

function ColorInput({
  value,
  onCommit,
}: {
  value?: string;
  onCommit: (next: string | undefined) => void;
}) {
  const stored = value ?? "";
  const [draft, setDraft] = useState(stored);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed === "") return onCommit(undefined);
    if (isValidColor(trimmed)) return onCommit(trimmed);
    setDraft(stored);
  };

  return (
    <input
      type="text"
      placeholder="zinc-900 hoặc #hex"
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
