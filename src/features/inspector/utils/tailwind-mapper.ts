// src/features/inspector/utils/tailwind-mapper.ts


import { LayoutProps } from "@/core/types/builder.types";


export function gapClass(gap?: number) {
  return gap !== undefined ? `gap-${gap}` : "";
}

export function paddingClass(padding?: number) {
  return padding !== undefined ? `p-${padding}` : "";
}

export function containerToClasses(props: LayoutProps): string {
  return [
    "flex",
    props.direction,
    gapClass(props.gap),
    paddingClass(props.padding),
    props.align,
    props.justify,
  ]
    .filter(Boolean)
    .join(" ");
}

