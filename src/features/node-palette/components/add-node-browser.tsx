// features/node-palette/components/add-node-browser.tsx

"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Box, Search } from "lucide-react";
import {
  useBuilderStore,
  findNode,
  useComponentList,
  useAncestorComponentId,
  getReachableComponentIds,
} from "@/core/store/builder-store";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { canContain } from "@/core/registry/node-rules";
import { SYSTEM_NODE_IDS } from "@/core/registry/system-nodes";
import type { NodeDefinition, NodeTier } from "@/core/types/node-definition.types";
import { getNodeIcon } from "../constants/node-icons";
import { NodeListRow } from "./node-list-row";
import { buildPaletteData } from "../utils/palette-data";
import { PaletteSection, PaletteTabs, TIER_BADGE } from "./palette-sections";

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
  const [tab, setTab] = useState<NodeTier>("element");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const parentNode = parentId ? findNode(tree, parentId) : null;
  const parentDef = parentNode ? getNodeDefinition(parentNode.type) : undefined;
  const isFolderMode = parentDef?.nodeKind === "folder";
  const searching = query.trim().length > 0;
  const data = buildPaletteData(parentDef, query);
  const groups = tab === "component" ? data.component : data.element;
  const isOpen = (key: string, index: number) => expanded[`${tab}:${key}`] ?? index === 0;
  const toggle = (key: string, index: number) =>
    setExpanded((previous) => ({ ...previous, [`${tab}:${key}`]: !isOpen(key, index) }));

  const componentInstanceDef = getNodeDefinition(SYSTEM_NODE_IDS.componentInstance);
  const canAddComponentInstance =
    !!parentDef &&
    !!componentInstanceDef &&
    canContain(parentDef, componentInstanceDef.nodeKind, componentInstanceDef);
  const availableComponents = componentList.filter(
    (component) => component.id !== ancestorComponentId && canAddComponentInstance
  );
  const filteredComponents = searching
    ? availableComponents.filter((component) => component.name.toLowerCase().includes(query.trim().toLowerCase()))
    : availableComponents;

  const defRow = (def: NodeDefinition) => (
    <NodeListRow
      key={def.id}
      title={def.title}
      Icon={getNodeIcon(def.id)}
      badge={searching ? TIER_BADGE[def.tier ?? "element"] : undefined}
      selected={selection?.kind === "definition" && selection.id === def.id}
      onClick={() => setSelection({ kind: "definition", id: def.id })}
    />
  );
  const projectRows = (list: { id: string; name: string }[]) =>
    list.map((component) => (
      <NodeListRow
        key={component.id}
        title={component.name}
        Icon={Box}
        selected={selection?.kind === "component" && selection.id === component.id}
        onClick={() => setSelection({ kind: "component", id: component.id })}
      />
    ));

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
      <DialogContent className="max-w-md flex flex-col max-h-[80vh] z-[7000]">
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
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search node..." className="pl-7"
              />
            </div>

            {!searching && !data.sealed && (
              <div className="-mx-2">
                <PaletteTabs value={tab} onChange={setTab} counts={data.counts} />
              </div>
            )}

            <div className="-mx-2 flex-1 overflow-y-auto px-2">
              {searching ? (
                filteredComponents.length + data.searchResults.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">
                    Không tìm thấy node nào
                  </p>
                ) : (
                  <>
                    {projectRows(filteredComponents)}
                    {data.searchResults.map(defRow)}
                  </>
                )
              ) : (
                <>
                  {data.parts.length > 0 && (
                    <PaletteSection label={`Thành phần của ${parentDef?.title ?? ""}`}>
                      {data.parts.map(defRow)}
                    </PaletteSection>
                  )}
                  {!data.sealed && tab === "component" && availableComponents.length > 0 && (
                    <PaletteSection label="Của dự án" count={availableComponents.length}>
                      {projectRows(availableComponents)}
                    </PaletteSection>
                  )}
                  {!data.sealed && tab !== "block" &&
                    groups.map((group, index) => (
                      <PaletteSection
                        key={group.key}
                        label={group.label}
                        count={group.defs.length}
                        open={isOpen(group.key, index)}
                        onToggle={() => toggle(group.key, index)}
                      >
                        <div className="pl-2">{group.defs.map(defRow)}</div>
                      </PaletteSection>
                    ))}
                  {data.sealed && data.parts.length === 0 && (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      Node này không nhận thêm con
                    </p>
                  )}
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