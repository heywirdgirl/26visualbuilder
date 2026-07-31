// features/inspector/components/color-picker-field.tsx


"use client";

const CURATED_COLORS: { name: string; value: string; swatchClass: string }[] = [
  { name: "Slate", value: "slate-500", swatchClass: "bg-slate-500" },
  { name: "Red", value: "red-500", swatchClass: "bg-red-500" },
  { name: "Orange", value: "orange-500", swatchClass: "bg-orange-500" },
  { name: "Amber", value: "amber-500", swatchClass: "bg-amber-500" },
  { name: "Yellow", value: "yellow-500", swatchClass: "bg-yellow-500" },
  { name: "Lime", value: "lime-500", swatchClass: "bg-lime-500" },
  { name: "Green", value: "green-500", swatchClass: "bg-green-500" },
  { name: "Teal", value: "teal-500", swatchClass: "bg-teal-500" },
  { name: "Blue", value: "blue-500", swatchClass: "bg-blue-500" },
  { name: "Indigo", value: "indigo-500", swatchClass: "bg-indigo-500" },
  { name: "Purple", value: "purple-500", swatchClass: "bg-purple-500" },
  { name: "Pink", value: "pink-500", swatchClass: "bg-pink-500" },
];

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
      <div className="flex flex-wrap gap-1">
        {CURATED_COLORS.map((c) => (
          <button
            key={c.value} type="button" title={c.name}
            onClick={() => onChange(c.value)}
            className={`w-5 h-5 rounded-full ${c.swatchClass} border-2 ${
              value === c.value ? "border-primary" : "border-transparent"
            }`}
          />
        ))}
        <button
          type="button" onClick={() => onChange(undefined)} title="Xoá màu"
          className="w-5 h-5 rounded-full border border-dashed flex items-center justify-center text-[10px] text-muted-foreground"
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
