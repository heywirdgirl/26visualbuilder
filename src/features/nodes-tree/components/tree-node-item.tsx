// src/features/nodes-tree/components/tree-node-item.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Folder, FileText, Component as ComponentIcon } from "lucide-react";
// 👆 Nếu bản lucide-react đang cài không có icon "Component", đổi tạm sang "Box" hoặc "Package".
import { TreeNode } from "@/core/types/builder.types";
import { useBuilderStore, findNode } from "@/core/store/builder-store";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { SYSTEM_NODE_IDS } from "@/core/registry/system-nodes";
import { cn } from "@/core/utils/cn";

function useDisplayName(node: TreeNode): string {
  const tree = useBuilderStore((s) => s.tree);
  const def = getNodeDefinition(node.type);

  if (node.type === SYSTEM_NODE_IDS.componentInstance) {
    const referenced = node.referenceId ? findNode(tree, node.referenceId) : null;
    const refName = (referenced?.props as { name?: string })?.name;
    return refName ? `${refName} (Instance)` : "Component Instance (lỗi tham chiếu)";
  }

  const nameProp = (node.props as { name?: string })?.name;
  return nameProp ?? def?.title ?? node.type;
}

function NodeIcon({ node }: { node: TreeNode }) {
  const def = getNodeDefinition(node.type);
  const cls = "h-3.5 w-3.5 shrink-0";

  switch (def?.nodeKind) {
    case "folder":
      return <Folder className={cn(cls, "text-muted-foreground")} />;
    case "page":
      return <FileText className={cn(cls, "text-blue-600")} />;
    case "component":
      return <ComponentIcon className={cn(cls, "text-purple-600")} />;
    case "component-instance":
      return <ComponentIcon className={cn(cls, "text-purple-400")} />;
    default:
      return <span className={cls} />; // html/shadcn: không icon riêng, giữ UI gọn
  }
}

export function TreeNodeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const activeNodeId = useBuilderStore((s) => s.activeNodeId);
  const activePageId = useBuilderStore((s) => s.activePageId);
  const setActiveNode = useBuilderStore((s) => s.setActiveNode);
  const setActivePage = useBuilderStore((s) => s.setActivePage);
  const setHighlightReferenceId = useBuilderStore((s) => s.setHighlightReferenceId);

  const isActive = node.id === activeNodeId;
  const rowRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(true);

  const def = getNodeDefinition(node.type);
  // Component Instance không expand trên Tree — nội dung thật chỉ sửa qua Component
  // canonical dưới Components/, đúng nguyên tắc "1 nơi sửa, mọi nơi tự cập nhật".
  const hasChildren = def?.nodeKind !== "component-instance" && node.children.length > 0;
  const displayName = useDisplayName(node);

  useEffect(() => {
    if (isActive) rowRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [isActive]);

  const handleRowClick = () => {
    setActiveNode(node.id);

    if (def?.nodeKind === "page" && node.id !== activePageId) {
      setActivePage(node.id); // click Page khác -> Canvas chuyển theo ngay (PRD)
    }
    setHighlightReferenceId(def?.nodeKind === "component" ? node.id : null);
  };

  return (
    <div>
      <div
        ref={rowRef}
        onClick={handleRowClick}
        style={{ paddingLeft: depth * 16 }}
        className={cn(
          "flex items-center gap-1.5 text-sm rounded px-2 py-1 cursor-pointer hover:bg-muted",
          isActive && "bg-primary/10 text-primary font-medium",
          def?.nodeKind === "component" && "text-purple-600",
          def?.nodeKind === "component-instance" && "text-purple-500 italic"
        )}
      >
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); setExpanded((p) => !p); }} className="shrink-0">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <NodeIcon node={node} />
        <span className="truncate">{displayName}</span>
        {def?.nodeKind === "page" && node.id === activePageId && (
          <span className="ml-auto text-[10px] text-blue-600 shrink-0" title="Đang mở trên Canvas">●</span>
        )}
      </div>

      {expanded && node.children.map((child) => (
        <TreeNodeItem key={child.id} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}