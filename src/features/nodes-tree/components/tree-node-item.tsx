// src/features/nodes-tree/components/tree-node-item.tsx

"use client";

import { useEffect, useRef } from "react";
import { TreeNode, ComponentType } from "@/core/types/builder.types";
import { useBuilderStore } from "@/core/store/builder-store";
import { cn } from "@/core/utils/cn";

export function TreeNodeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const activeNodeId = useBuilderStore((s) => s.activeNodeId);
  const setActiveNode = useBuilderStore((s) => s.setActiveNode);
  const addNode = useBuilderStore((s) => s.addNode);
  const removeNode = useBuilderStore((s) => s.removeNode);

  const isActive = node.id === activeNodeId;
  const rowRef = useRef<HTMLDivElement>(null);

  // Khi node được active (từ click trên Canvas hoặc Tree), tự cuộn tới dòng này
  useEffect(() => {
    if (isActive) {
      rowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isActive]);

  const handleAddChild = (type: ComponentType) => {
    addNode(node.id, type);
  };

  return (
    <div>
      <div
        ref={rowRef}
        onClick={() => setActiveNode(node.id)}
        style={{ paddingLeft: depth * 16 }}
        className={cn(
          "flex items-center justify-between text-sm rounded px-2 py-1 cursor-pointer hover:bg-muted",
          isActive && "bg-primary/10 text-primary font-medium"
        )}
      >
        <span>{node.type}</span>

        <div className="flex gap-1">
          {node.type === "container" && (
            <>
              <button onClick={(e) => { e.stopPropagation(); handleAddChild("container"); }}>+C</button>
              <button onClick={(e) => { e.stopPropagation(); handleAddChild("button"); }}>+B</button>
              <button onClick={(e) => { e.stopPropagation(); handleAddChild("card"); }}>+Ca</button>
            </>
          )}
          {node.id !== "root" && (
            <button onClick={(e) => { e.stopPropagation(); removeNode(node.id); }}>✕</button>
          )}
        </div>
      </div>

      {node.children.map((child) => (
        <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}