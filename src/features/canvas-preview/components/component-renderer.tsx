// features/canvas-preview/components/component-renderer.tsx

"use client";

import { TreeNode } from "@/core/types/builder.types";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { getRendererEntry } from "../constants/renderer-map";
import { useBuilderStore, findNode } from "@/core/store/builder-store";
import { SYSTEM_NODE_IDS } from "@/core/registry/system-nodes";
import { styleToClasses } from "@/core/utils/style-to-classes";
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

    // Style dùng ở đây là style CỦA COMPONENT CANONICAL (componentNode.style) — Instance
    // không có style riêng cho chính khối hiển thị (giống <Header /> không tự có style,
    // trừ khi Component definition tự định nghĩa). Giữ đúng hành vi từ trước Phase 2.
    const contentStyleClass = styleToClasses(componentNode.style);

    return (
      <div onClick={handleClick} style={{ display: "contents" }}>
        {entry.render({ ...componentNode, id: node.id }, children, cn(contentStyleClass, highlightClass))}
      </div>
    );
  }

  const def = getNodeDefinition(node.type);
  const entry = getRendererEntry(node.type);

  if (!def || !entry) {
    return <ErrorBox message={`Node type không tồn tại trong registry: ${node.type}`} />;
  }

  const children = node.children.map((child) => (
    <ComponentRenderer key={child.id} node={child} visitedComponentIds={visited} />
  ));

  // Style áp dụng cho MỌI node, không chỉ container — Button/Input/text giờ cũng nhận
  // margin/màu/border riêng ngay khi Inspector (Phase 3) có UI cho việc này.
  const styleClass = styleToClasses(node.style);
  const highlightClass = isActive ? "outline outline-2 outline-blue-500 outline-offset-1" : "";

  return (
    <div onClick={handleClick} style={{ display: "contents" }}>
      {entry.render(node, children, cn(styleClass, highlightClass))}
    </div>
  );
}