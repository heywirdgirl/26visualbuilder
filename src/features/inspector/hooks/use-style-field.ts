// features/inspector/hooks/use-style-field.ts


"use client";

import { TreeNode } from "@/core/types/builder.types";
import { StyleProps } from "@/core/types/style.types";
import { useBuilderStore } from "@/core/store/builder-store";
import {
  getEffectiveStyleValue,
  hasOverrideAt,
  resolveLayer,
} from "@/core/utils/style-cascade";

export function useStyleField(node: TreeNode) {
  const activeBreakpoint = useBuilderStore((s) => s.activeBreakpoint);
  const activeState = useBuilderStore((s) => s.activeState);
  const updateNodeStyleLayer = useBuilderStore((s) => s.updateNodeStyleLayer);
  const clearNodeStyleLayerOverride = useBuilderStore((s) => s.clearNodeStyleLayerOverride);
  const layer = resolveLayer(activeBreakpoint, activeState);

  return {
    layer,
    state: activeState,
    breakpoint: activeBreakpoint,
    getValue: <K extends keyof StyleProps>(key: K) =>
      getEffectiveStyleValue(node.style, layer, key),
    setValue: <K extends keyof StyleProps>(key: K, value: StyleProps[K]) =>
      updateNodeStyleLayer(node.id, layer, { [key]: value } as Partial<StyleProps>),
    hasOverride: (key: keyof StyleProps) => hasOverrideAt(node.style, layer, key),
    clearOverride: (key: keyof StyleProps) => clearNodeStyleLayerOverride(node.id, layer, key),
  };
}
