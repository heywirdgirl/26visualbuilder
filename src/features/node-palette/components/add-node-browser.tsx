// features/node-palette/components/add-node-browser.tsx


"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import { searchNodes, getNodesByCategory } from "@/core/registry/node-registry";
import { NodeCategory } from "@/core/types/node-definition.types";
import { NodeListRow } from "./node-list-row";

const CATEGORIES: NodeCategory[] = [
  "Layout", "Typography", "Form", "List", "Media",
  "Navigation", "Overlay", "Data Display", "Templates",
];

export function AddNodeBrowser({
  open,
  onOpenChange,
  parentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string | null;
}) {
  const addNode = useBuilderStore((s) => s.addNode);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Layout: true, Form: true });

  const filteredFlat = useMemo(() => (query.trim() ? searchNodes(query) : null), [query]);

  const toggleCategory = (cat: string) =>
    setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const handleClose = () => {
    setQuery("");
    setSelectedId(null);
    onOpenChange(false);
  };

  const handleAdd = () => {
    if (parentId && selectedId) addNode(parentId, selectedId);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="max-w-md flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Node</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search node..."
            className="pl-7"
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-2 px-2">
          {filteredFlat ? (
            filteredFlat.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Không tìm thấy node nào</p>
            ) : (
              filteredFlat.map((def) => (
                <NodeListRow key={def.id} def={def} selected={def.id === selectedId} onClick={() => setSelectedId(def.id)} />
              ))
            )
          ) : (
            CATEGORIES.map((cat) => {
              const nodes = getNodesByCategory(cat);
              if (nodes.length === 0) return null;
              const isOpen = !!expanded[cat];
              return (
                <div key={cat} className="mb-1">
                  <button
                    onClick={() => toggleCategory(cat)}
                    className="w-full flex items-center gap-1.5 text-sm font-medium px-2 py-1.5 hover:bg-muted rounded"
                  >
                    {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                    {cat}
                  </button>
                  {isOpen && (
                    <div className="pl-4">
                      {nodes.map((def) => (
                        <NodeListRow key={def.id} def={def} selected={def.id === selectedId} onClick={() => setSelectedId(def.id)} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!selectedId}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}