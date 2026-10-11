// features/inspector/components/color-picker-field.tsx


"use client";

import { HUE_SWATCHES, NEUTRAL_SWATCHES, PaletteSwatch } from "@/core/registry/color-palette";
import { cn } from "@/core/utils/cn";

function SwatchRow({
  swatches,
  value,
  onChange,
}: {
  swatches: PaletteSwatch[];
  value?: string;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {swatches.map((swatch) => (
        <button
          key={swatch.value}
          type="button"
          title={swatch.name}
          onClick={() => onChange(swatch.value)}
          className={cn(
            "h-5 w-5 rounded-full border-2",
            swatch.swatchClass,
            value === swatch.value ? "border-primary" : "border-zinc-200"
          )}
        />
      ))}
    </div>
  );
}

function isHex(value?: string) {
  return !!value && value.startsWith("#");
}

export function ColorPickerField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <SwatchRow swatches={HUE_SWATCHES} value={value} onChange={onChange} />
      <div className="flex items-center gap-1">
        <SwatchRow swatches={NEUTRAL_SWATCHES} value={value} onChange={onChange} />
        <button
          type="button"
          onClick={() => onChange(undefined)}
          title="Xoá màu"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-dashed text-[10px] text-muted-foreground"
        >
          ✕
        </button>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={isHex(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 border rounded cursor-pointer"
        />
        <input
          type="text" value={value ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="blue-500 hoặc #1e40af"
          className="flex-1 border rounded px-2 py-1 text-xs"
        />
      </div>
    </div>
  );
}
