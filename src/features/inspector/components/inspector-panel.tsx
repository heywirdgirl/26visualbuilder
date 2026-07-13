
// src/features/inspector/components/inspector-panel.tsx

"use client";

import { useBuilderStore, useActiveNode } from "@/core/store/builder-store";
import { LayoutSection } from "./layout-section";
import { PropsSection } from "./props-section";

export function InspectorPanel() {
  const activeNode = useActiveNode();
  const setActiveNode = useBuilderStore((s) => s.setActiveNode);

  if (!activeNode) return null;

  return (
    <div className="fixed top-4 right-4 w-72 bg-white border rounded-lg shadow-lg p-4 flex flex-col gap-4 z-40">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium capitalize">{activeNode.type}</span>
        <button onClick={() => setActiveNode(null)} className="text-muted-foreground hover:text-foreground">✕</button>
      </div>

      {activeNode.type === "container" && <LayoutSection node={activeNode} />}
      {(activeNode.type === "button" || activeNode.type === "card") && <PropsSection node={activeNode} />}
    </div>
  );
}