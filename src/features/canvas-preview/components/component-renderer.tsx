// src/features/canvas-preview/components/component-renderer.tsx

"use client";

import { TreeNode } from "@/core/types/builder.types";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { getRendererEntry } from "../constants/renderer-map";
import { useBuilderStore } from "@/core/store/builder-store";
import { containerToClasses } from "@/features/inspector/utils/tailwind-mapper";
import { cn } from "@/core/utils/cn";

export function ComponentRenderer({ node }: { node: TreeNode }) {
  const setActiveNode = useBuilderStore((s) => s.setActiveNode);
  const activeNodeId = useBuilderStore((s) => s.activeNodeId);
  const isActive = node.id === activeNodeId;

  const def = getNodeDefinition(node.type);
  const entry = getRendererEntry(node.type);

  if (!def || !entry) {
    return (
      <div className="text-xs text-red-500 border border-red-300 rounded px-2 py-1">
        Node type không tồn tại trong registry: {node.type}
      </div>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveNode(node.id);
  };

  const children = node.children.map((child) => (
    <ComponentRenderer key={child.id} node={child} />
  ));

  const highlightClass = isActive ? "outline outline-2 outline-blue-500 outline-offset-1" : "";
  const hasLayout = "direction" in node.props;
const layoutClass = hasLayout ? containerToClasses(node.props as any) : "";

  return (
    <div onClick={handleClick} style={{ display: "contents" }}>
      {entry.render(node, children, cn(layoutClass, highlightClass))}
    </div>
  );
}