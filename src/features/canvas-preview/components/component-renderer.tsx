// features/canvas-preview/components/component-renderer.tsx

"use client";

import { TreeNode } from "@/core/types/builder.types";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { getRendererEntry } from "../constants/renderer-map";
import { useBuilderStore, findNode } from "@/core/store/builder-store";
import { SYSTEM_NODE_IDS } from "@/core/registry/system-nodes";
import { containerToClasses } from "@/features/inspector/utils/tailwind-mapper";
import { cn } from "@/core/utils/cn";

function ErrorBox({ message }: { message: string }) {
  return <div className="text-xs text-red-500 border border-red-300 rounded px-2 py-1">{message}</div>;
}

export function ComponentRenderer({
  node,
  visitedComponentIds,
}: {
  node: TreeNode;
  visitedComponentIds?: Set<string>;
}) {
  const setActiveNode = useBuilderStore((s) => s.setActiveNode);
  const activeNodeId = useBuilderStore((s) => s.activeNodeId);
  const highlightReferenceId = useBuilderStore((s) => s.highlightReferenceId);
  const tree = useBuilderStore((s) => s.tree);

  const isActive = node.id === activeNodeId;
  const visited = visitedComponentIds ?? new Set<string>();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveNode(node.id);
  };

  // ── Component Instance: render đúng nội dung Component canonical, nhưng mọi
  // tương tác (click/highlight/data-node-id) bám theo Instance, KHÔNG phải bản gốc
  // nằm dưới Components/ folder. ──
  if (node.type === SYSTEM_NODE_IDS.componentInstance) {
    const isHighlighted = node.referenceId === highlightReferenceId;
    const highlightClass = cn(
      isActive && "outline outline-2 outline-blue-500 outline-offset-1",
      isHighlighted && "outline outline-2 outline-purple-500 outline-offset-1"
    );

    if (!node.referenceId) return <ErrorBox message="Component Instance thiếu referenceId" />;
    if (visited.has(node.referenceId)) {
      return <ErrorBox message={`Vòng lặp Component: ${node.referenceId}`} />;
    }

    const componentNode = findNode(tree, node.referenceId);
    if (!componentNode) return <ErrorBox message={`Component không tồn tại: ${node.referenceId}`} />;

    const def = getNodeDefinition(componentNode.type);
    const entry = getRendererEntry(componentNode.type);
    if (!def || !entry) {
      return <ErrorBox message={`Node type không tồn tại trong registry: ${componentNode.type}`} />;
    }

    const nextVisited = new Set(visited);
    nextVisited.add(node.referenceId);

    const children = componentNode.children.map((child) => (
      <ComponentRenderer key={child.id} node={child} visitedComponentIds={nextVisited} />
    ));

    const hasLayout = "direction" in componentNode.props;
    const layoutClass = hasLayout ? containerToClasses(componentNode.props as any) : "";

    return (
      <div onClick={handleClick} style={{ display: "contents" }}>
        {entry.render({ ...componentNode, id: node.id }, children, cn(layoutClass, highlightClass))}
      </div>
    );
  }

  // ── Node bình thường: Page/Component (khi là root đang mở)/html/shadcn ──
  const def = getNodeDefinition(node.type);
  const entry = getRendererEntry(node.type);

  if (!def || !entry) {
    return <ErrorBox message={`Node type không tồn tại trong registry: ${node.type}`} />;
  }

  const children = node.children.map((child) => (
    <ComponentRenderer key={child.id} node={child} visitedComponentIds={visited} />
  ));

  const hasLayout = "direction" in node.props;
  const layoutClass = hasLayout ? containerToClasses(node.props as any) : "";
  const highlightClass = isActive ? "outline outline-2 outline-blue-500 outline-offset-1" : "";

  return (
    <div onClick={handleClick} style={{ display: "contents" }}>
      {entry.render(node, children, cn(layoutClass, highlightClass))}
    </div>
  );
}