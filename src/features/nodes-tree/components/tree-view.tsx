// src/features/nodes-tree/components/tree-view.tsx

"use client";

import { useBuilderStore } from "@/core/store/builder-store";
import { TreeNodeItem } from "./tree-node-item";

export function TreeView() {
  const tree = useBuilderStore((s) => s.tree);

  return (
    <div className="flex flex-col gap-1 p-2 overflow-y-auto">
      <TreeNodeItem node={tree} depth={0} />
    </div>
  );
}