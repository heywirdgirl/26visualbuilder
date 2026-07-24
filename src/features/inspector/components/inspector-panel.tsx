
// src/features/inspector/components/inspector-panel.tsx

"use client";

import { useBuilderStore, useActiveNode } from "@/core/store/builder-store";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { LayoutSection } from "./layout-section";
import { DynamicPropsForm } from "./dynamic-props-form";

export function InspectorPanel() {
  const activeNode = useActiveNode();
  const setActiveNode = useBuilderStore((s) => s.setActiveNode);
  const editMode = useBuilderStore((s) => s.editMode);

  if (!editMode || !activeNode) return null;

  const def = getNodeDefinition(activeNode.type);
  const showLayout = "direction" in activeNode.props;

  return (
    <div className="fixed top-4 right-4 w-72 bg-white border rounded-lg shadow-lg p-4 flex flex-col gap-4 z-40 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{def?.title ?? activeNode.type}</span>
        <button onClick={() => setActiveNode(null)} className="text-muted-foreground hover:text-foreground">✕</button>
      </div>

      {showLayout && <LayoutSection node={activeNode} />}
      <DynamicPropsForm node={activeNode} />
    </div>
  );
}