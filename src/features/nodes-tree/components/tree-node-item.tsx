// src/features/nodes-tree/components/tree-node-item.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { TreeNode } from "@/core/types/builder.types";
import { useBuilderStore } from "@/core/store/builder-store";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { cn } from "@/core/utils/cn";

export function TreeNodeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const activeNodeId = useBuilderStore((s) => s.activeNodeId);
  const setActiveNode = useBuilderStore((s) => s.setActiveNode);

  const isActive = node.id === activeNodeId;
  const rowRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(true);

  const def = getNodeDefinition(node.type);
  const hasChildren = node.children.length > 0;

  useEffect(() => {
    if (isActive) rowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [isActive]);

  return (
    <div>
      <div
        ref={rowRef}
        onClick={() => setActiveNode(node.id)}
        style={{ paddingLeft: depth * 16 }}
        className={cn(
          "flex items-center gap-1 text-sm rounded px-2 py-1 cursor-pointer hover:bg-muted",
          isActive && "bg-primary/10 text-primary font-medium"
        )}
      >
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p); }} className="shrink-0">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span className="truncate">{def?.title ?? node.type}</span>
      </div>

      {expanded && node.children.map((child) => (
        <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}