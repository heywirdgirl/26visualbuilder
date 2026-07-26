// features/node-palette/components/add-node-browser.tsx

"use client";

import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import {
  useBuilderStore,
  findNode,
  useComponentList,
  useAncestorComponentId,
  getReachableComponentIds,
} from "@/core/store/builder-store";
import { searchNodes, getNodesByCategory, getNodeDefinition } from "@/core/registry/node-registry";
import { NodeCategory } from "@/core/types/node-definition.types";
import { NodeListRow } from "./node-list-row";

const CATEGORIES: NodeCategory[] = [
  "Layout", "Typography", "Form", "List", "Media",
  "Navigation", "Overlay", "Data Display", "Templates",
];

type Selection = { kind: "definition"; id: string } | { kind: "component"; id: string };

export function AddNodeBrowser({
  open,
  onOpenChange,
  parentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string | null;
}) {
  const tree = useBuilderStore((s) => s.tree);
  const addNode = useBuilderStore((s) => s.addNode);
  const addComponentInstance = useBuilderStore((s) => s.addComponentInstance);
  const componentList = useComponentList();
  const ancestorComponentId = useAncestorComponentId(parentId);

  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Layout: true, Form: true });

  const parentNode = parentId ? findNode(tree, parentId) : null;
  const parentDef = parentNode ? getNodeDefinition(parentNode.type) : undefined;
  const isFolderMode = parentDef?.nodeKind === "folder";

  const availableComponents = componentList.filter((c) => c.id !== ancestorComponentId);
  const filteredComponents = useMemo(
    () =>
      query.trim()
        ? availableComponents.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))
        : availableComponents,
    [availableComponents, query]
  );
  const filteredFlat = useMemo(() => (query.trim() ? searchNodes(query) : null), [query]);

  const toggleCategory = (cat: string) => setExpanded((prev) => ({ ...prev, [cat]: !prev[cat] }));

  const handleClose = () => {
    setQuery("");
    setSelection(null);
    onOpenChange(false);
  };

  const handleAdd = () => {
    if (!parentId || !selection) return;
    if (selection.kind === "definition") {
      addNode(parentId, selection.id);
    } else {
      if (ancestorComponentId) {
        const reachable = getReachableComponentIds(selection.id, tree);
        if (reachable.has(ancestorComponentId)) {
          window.alert("Không thể thêm — sẽ tạo vòng lặp Component tự chứa nhau.");
          return;
        }
      }
      addComponentInstance(parentId, selection.id);
    }
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(v) : handleClose())}>
      <DialogContent className="max-w-md flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Add Node</DialogTitle>
        </DialogHeader>

        {isFolderMode ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Dùng nút [+] trên dòng Folder để tạo New Folder / New Page / New Component.
          </p>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search node..." className="pl-7"
              />
            </div>

            <div className="flex-1 overflow-y-auto -mx-2 px-2">
              {filteredFlat ? (
                <>
                  {filteredComponents.map((c) => (
                    <NodeListRow
                      key={c.id} title={c.name} iconName="Box"
                      selected={selection?.kind === "component" && selection.id === c.id}
                      onClick={() => setSelection({ kind: "component", id: c.id })}
                    />
                  ))}
                  {filteredFlat.map((def) => (
                    <NodeListRow
                      key={def.id} title={def.title} iconName={def.icon}
                      selected={selection?.kind === "definition" && selection.id === def.id}
                      onClick={() => setSelection({ kind: "definition", id: def.id })}
                    />
                  ))}
                  {filteredComponents.length === 0 && filteredFlat.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4">Không tìm thấy node nào</p>
                  )}
                </>
              ) : (
                <>
                  {availableComponents.length > 0 && (
                    <div className="mb-1">
                      <p className="text-sm font-medium px-2 py-1.5">My Components</p>
                      <div className="pl-4">
                        {availableComponents.map((c) => (
                          <NodeListRow
                            key={c.id} title={c.name} iconName="Box"
                            selected={selection?.kind === "component" && selection.id === c.id}
                            onClick={() => setSelection({ kind: "component", id: c.id })}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {CATEGORIES.map((cat) => {
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
                              <NodeListRow
                                key={def.id} title={def.title} iconName={def.icon}
                                selected={selection?.kind === "definition" && selection.id === def.id}
                                onClick={() => setSelection({ kind: "definition", id: def.id })}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          {!isFolderMode && <Button onClick={handleAdd} disabled={!selection}>Add</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}