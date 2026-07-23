// features/nodes-tree/components/tree-toolbar.tsx

"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Pencil } from "lucide-react";
import { useBuilderStore, useActiveNode } from "@/core/store/builder-store";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { QuickAddDropdown } from "@/features/node-palette/components/quick-add-dropdown";
import { AddNodeBrowser } from "@/features/node-palette/components/add-node-browser";

export function TreeToolbar() {
  const activeNodeId = useBuilderStore((s) => s.activeNodeId);
  const removeNode = useBuilderStore((s) => s.removeNode);
  const editMode = useBuilderStore((s) => s.editMode);
  const toggleEditMode = useBuilderStore((s) => s.toggleEditMode);
  const activeNode = useActiveNode();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);

  const activeDef = activeNode ? getNodeDefinition(activeNode.type) : undefined;
  const canRemove = !editMode && !!activeNodeId && activeNodeId !== "root";
  const canAdd = !editMode && !!activeNodeId && !!activeDef?.canHaveChildren;

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b text-xs">
      <Button
        variant={editMode ? "default" : "outline"}
        size="sm"
        className="h-7 gap-1.5"
        onClick={toggleEditMode}
        title="Bật/tắt chế độ chỉnh sửa thuộc tính (Inspector)"
      >
        <Pencil className="h-3.5 w-3.5" />
        edit mode
      </Button>

      <Button
        variant="outline" size="icon" className="h-7 w-7"
        disabled={!canRemove}
        onClick={() => activeNodeId && removeNode(activeNodeId)}
        title="Xoá node đang chọn"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>

      <Popover open={quickAddOpen} onOpenChange={setQuickAddOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="icon" className="h-7 w-7" disabled={!canAdd} title="Thêm node con">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-0">
          {activeNodeId && (
            <QuickAddDropdown
              parentId={activeNodeId}
              onClose={() => setQuickAddOpen(false)}
              onOpenBrowser={() => { setQuickAddOpen(false); setBrowserOpen(true); }}
            />
          )}
        </PopoverContent>
      </Popover>

      <AddNodeBrowser open={browserOpen} onOpenChange={setBrowserOpen} parentId={activeNodeId} />
    </div>
  );
}