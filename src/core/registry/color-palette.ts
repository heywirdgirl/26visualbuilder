export interface PaletteSwatch {
  name: string;
  value: string;
  swatchClass: string;
}

export const HUE_SWATCHES: PaletteSwatch[] = [
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

export const NEUTRAL_SWATCHES: PaletteSwatch[] = [
  { name: "White", value: "white", swatchClass: "bg-white" },
  { name: "Zinc 100", value: "zinc-100", swatchClass: "bg-zinc-100" },
  { name: "Zinc 300", value: "zinc-300", swatchClass: "bg-zinc-300" },
  { name: "Zinc 500", value: "zinc-500", swatchClass: "bg-zinc-500" },
  { name: "Zinc 700", value: "zinc-700", swatchClass: "bg-zinc-700" },
  { name: "Zinc 900", value: "zinc-900", swatchClass: "bg-zinc-900" },
  { name: "Black", value: "black", swatchClass: "bg-black" },
];

export const PALETTE_TOKENS = [
  ...HUE_SWATCHES.map((swatch) => swatch.value),
  ...NEUTRAL_SWATCHES.map((swatch) => swatch.value),
  "transparent",
];