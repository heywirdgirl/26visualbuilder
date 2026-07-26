// src/features/nodes-tree/components/tree-view.tsx

"use client";

import { useBuilderStore } from "@/core/store/builder-store";
import { TreeNodeItem } from "./tree-node-item";
import { TreeToolbar } from "./tree-toolbar";

export function TreeView() {
  const tree = useBuilderStore((s) => s.tree);

  return (
    <div className="flex flex-col h-full">
      <TreeToolbar />
      <div className="flex flex-col gap-1 p-2 overflow-y-auto">
        {/* Project (root) không hiện thành dòng riêng — chỉ hiện thẳng App/Components,
            đúng UI mong muốn (2 folder kiểu Next.js thay vì 1 root kiểu HTML). */}
        {tree.children.map((child) => (
          <TreeNodeItem key={child.id} node={child} depth={0} />
        ))}
      </div>
    </div>
  );
}