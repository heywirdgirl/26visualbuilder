
// src/features/inspector/components/inspector-panel.tsx



"use client";

import { useBuilderStore, useActiveNode } from "@/core/store/builder-store";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { BreakpointSwitcher } from "./breakpoint-switcher";
import { LayoutSection } from "./layout-section";
import { SpacingSection } from "./spacing-section";
import { TypographySection } from "./typography-section";
import { AppearanceSection } from "./appearance-section";
import { DynamicPropsForm } from "./dynamic-props-form";

export function InspectorPanel() {
  const activeNode = useActiveNode();
  const setActiveNode = useBuilderStore((s) => s.setActiveNode);
  const editMode = useBuilderStore((s) => s.editMode);

  if (!editMode || !activeNode) return null;

  const def = getNodeDefinition(activeNode.type);
  // Component Instance không có style riêng để sửa — style thật nằm trên Component
  // canonical, đúng nguyên tắc "1 nơi sửa, mọi nơi cập nhật" đã chốt từ V1.9.
  const isInstance = def?.nodeKind === "component-instance";

  return (
    <div className="fixed top-4 right-4 w-72 bg-white border rounded-lg shadow-lg p-4 flex flex-col gap-4 z-40 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{def?.title ?? activeNode.type}</span>
        <button onClick={() => setActiveNode(null)} className="text-muted-foreground hover:text-foreground">✕</button>
      </div>

      {isInstance ? (
        <p className="text-xs text-muted-foreground">
          Component Instance không sửa trực tiếp — chọn đúng Component gốc trong Components/ để sửa.
        </p>
      ) : (
        <>
          <BreakpointSwitcher />
          {def?.canHaveChildren && <LayoutSection node={activeNode} />}
          <SpacingSection node={activeNode} />
          <TypographySection node={activeNode} />
          <AppearanceSection node={activeNode} />
          <DynamicPropsForm node={activeNode} />
        </>
      )}
    </div>
  );
}
