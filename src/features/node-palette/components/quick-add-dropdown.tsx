// features/node-palette/components/quick-add-dropdown.tsx

"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import { searchNodes, getNodeDefinition } from "@/core/registry/node-registry";
import { commonNodeIds } from "../constants/common-node-ids";
import { NodeListRow } from "./node-list-row";

export function QuickAddDropdown({
  parentId,
  onClose,
  onOpenBrowser,
}: {
  parentId: string;
  onClose: () => void;
  onOpenBrowser: () => void;
}) {
  const addNode = useBuilderStore((s) => s.addNode);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (query.trim()) return searchNodes(query).slice(0, 30);
    return commonNodeIds
      .map((id) => getNodeDefinition(id))
      .filter((d): d is NonNullable<typeof d> => !!d);
  }, [query]);

  const handleAdd = (defId: string) => {
    addNode(parentId, defId);
    onClose();
  };

  return (
    <div className="flex flex-col max-h-148">
      <div className="p-2 border-t">
        <Button variant="ghost" size="sm" className=" text-xs" onClick={onOpenBrowser}>
          MORE ...
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-1">
        {results.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Không tìm thấy node nào</p>
        ) : (
          results.map((def) => (
            <NodeListRow key={def.id} def={def} onClick={() => handleAdd(def.id)} />
          ))
        )}
      </div>

      
    </div>
  );
}