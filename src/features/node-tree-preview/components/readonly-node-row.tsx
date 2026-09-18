"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Folder, FileText, Component as ComponentIcon } from "lucide-react";
import { TreeNode } from "@/core/types/builder.types";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { SYSTEM_NODE_IDS } from "@/core/registry/system-nodes";
import { findNode } from "@/core/store/builder-store";
import { cn } from "@/core/utils/cn";

function useDisplayName(node: TreeNode, fullTree: TreeNode): string {
  const def = getNodeDefinition(node.type);

  if (node.type === SYSTEM_NODE_IDS.componentInstance) {
    const referenced = node.referenceId ? findNode(fullTree, node.referenceId) : null;
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
      return <span className={cls} />;
  }
}

export function ReadonlyNodeRow({
  node,
  fullTree,
  depth,
}: {
  node: TreeNode;
  fullTree: TreeNode;
  depth: number;
}) {
  const [expanded, setExpanded] = useState(true);

  const def = getNodeDefinition(node.type);
  const hasChildren = def?.nodeKind !== "component-instance" && node.children.length > 0;
  const displayName = useDisplayName(node, fullTree);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded((prev) => !prev);
  };

  return (
    <div>
      <div
        onClick={hasChildren ? handleToggle : undefined}
        style={{ paddingLeft: depth * 16 }}
        className={cn(
          "flex items-center gap-1.5 text-xs py-1 rounded",
          hasChildren && "cursor-pointer hover:bg-muted",
          def?.nodeKind === "component" && "text-purple-600",
          def?.nodeKind === "component-instance" && "text-purple-500 italic"
        )}
      >
        {hasChildren ? (
          expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <NodeIcon node={node} />
        <span className="truncate">{displayName}</span>
      </div>

      {expanded &&
        node.children.map((child) => (
          <ReadonlyNodeRow key={child.id} node={child} fullTree={fullTree} depth={depth + 1} />
        ))}
    </div>
  );
}
