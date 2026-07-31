// features/inspector/hooks/use-style-field.ts


"use client";

import { TreeNode } from "@/core/types/builder.types";
import { StyleProps } from "@/core/types/style.types";
import { useBuilderStore } from "@/core/store/builder-store";
import { getEffectiveStyleValue, hasOverrideAt } from "@/core/utils/style-cascade";

export function useStyleField(node: TreeNode) {
  const activeBreakpoint = useBuilderStore((s) => s.activeBreakpoint);
  const updateNodeStyle = useBuilderStore((s) => s.updateNodeStyle);
  const clearNodeStyleOverride = useBuilderStore((s) => s.clearNodeStyleOverride);

  return {
    breakpoint: activeBreakpoint,
    getValue: <K extends keyof StyleProps>(key: K) =>
      getEffectiveStyleValue(node.style, activeBreakpoint, key),
    setValue: <K extends keyof StyleProps>(key: K, value: StyleProps[K]) =>
      updateNodeStyle(node.id, activeBreakpoint, { [key]: value } as Partial<StyleProps>),
    hasOverride: (key: keyof StyleProps) => hasOverrideAt(node.style, activeBreakpoint, key),
    clearOverride: (key: keyof StyleProps) => clearNodeStyleOverride(node.id, activeBreakpoint, key),
  };
}
