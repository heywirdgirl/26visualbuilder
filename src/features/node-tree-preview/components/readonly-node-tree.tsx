"use client";

import { useMemo } from "react";
import { TreeNode } from "@/core/types/builder.types";
import { getPageNodes } from "@/core/store/builder-store";
import { ReadonlyNodeRow } from "./readonly-node-row";

export function ReadonlyNodeTree({
  tree,
  maxHeight = 200,
}: {
  tree: TreeNode;
  maxHeight?: number;
}) {
  const pageNodes = useMemo(() => getPageNodes(tree), [tree]);

  if (pageNodes.length === 0) {
    return <p className="text-xs text-muted-foreground">Không có trang nào.</p>;
  }

  return (
    <div className="overflow-y-auto" style={{ maxHeight }}>
      {pageNodes.map((page) => (
        <ReadonlyNodeRow key={page.id} node={page} fullTree={tree} depth={0} />
      ))}
    </div>
  );
}
