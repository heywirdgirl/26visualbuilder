// src/features/canvas-preview/components/component-renderer.tsx

"use client";

import { TreeNode } from "@/core/types/builder.types";
import { renderRegisteredComponent } from "../constants/component-registry";
import { useBuilderStore } from "@/core/store/builder-store";

export function ComponentRenderer({ node }: { node: TreeNode }) {
  const setActiveNode = useBuilderStore((s) => s.setActiveNode);
  const activeNodeId = useBuilderStore((s) => s.activeNodeId);
  const isActive = node.id === activeNodeId;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveNode(node.id);
  };

  const children = node.children.map((child) => (
    <ComponentRenderer key={child.id} node={child} />
  ));

  return (
    <div onClick={handleClick} style={{ display: "contents" }}>
      {renderRegisteredComponent(node, children, isActive)}
    </div>
  );
}