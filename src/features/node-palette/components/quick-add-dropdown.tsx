// features/node-palette/components/quick-add-dropdown.tsx

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Folder, FileText, PackagePlus, Box } from "lucide-react";
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
import { countSpecNodes } from "@/core/registry/blocks";
import type { BlockDefinition } from "@/core/types/block.types";
import type { NodeDefinition, NodeTier } from "@/core/types/node-definition.types";
import { getBlockIcon } from "../constants/block-icons";
import { getNodeIcon } from "../constants/node-icons";
import { buildPaletteData } from "../utils/palette-data";
import { BlockCard, PaletteSection, PaletteTabs, PaletteTile, TIER_BADGE } from "./palette-sections";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function QuickAddDropdown({
  parentId,
  onClose,
  onOpenBrowser,
}: {
  parentId: string;
  onClose: () => void;
  onOpenBrowser: () => void;
}) {
  const tree = useBuilderStore((s) => s.tree);
  const addNode = useBuilderStore((s) => s.addNode);
  const addBlock = useBuilderStore((s) => s.addBlock);
  const addFolder = useBuilderStore((s) => s.addFolder);
  const addPage = useBuilderStore((s) => s.addPage);
  const addComponent = useBuilderStore((s) => s.addComponent);
  const addComponentInstance = useBuilderStore((s) => s.addComponentInstance);
  const componentList = useComponentList();
  const ancestorComponentId = useAncestorComponentId(parentId);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<NodeTier>("element");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const parentNode = findNode(tree, parentId);
  const parentDef = parentNode ? getNodeDefinition(parentNode.type) : undefined;
  const isFolderMode = parentDef?.nodeKind === "folder";

  const componentInstanceDef = getNodeDefinition(SYSTEM_NODE_IDS.componentInstance);
  const canAddComponentInstance =
    !!parentDef &&
    !!componentInstanceDef &&
    canContain(parentDef, componentInstanceDef.nodeKind, componentInstanceDef);
  const availableComponents = componentList.filter(
    (component) => component.id !== ancestorComponentId && canAddComponentInstance
  );
  const filteredComponents = query.trim()
    ? availableComponents.filter((component) => component.name.toLowerCase().includes(query.trim().toLowerCase()))
    : availableComponents;
  const searching = query.trim().length > 0;
  const data = buildPaletteData(parentDef, query);
  const groups = tab === "component" ? data.component : data.element;
  const isOpen = (key: string, index: number) => expanded[`${tab}:${key}`] ?? index === 0;
  const toggle = (key: string, index: number) =>
    setExpanded((previous) => ({ ...previous, [`${tab}:${key}`]: !isOpen(key, index) }));

  const handleAddDef = (defId: string) => {
    addNode(parentId, defId);
    onClose();
  };

  const handleAddBlock = (blockId: string) => {
    addBlock(parentId, blockId);
    onClose();
  };

  const handleAddComponentInstance = (componentId: string) => {
    if (ancestorComponentId) {
      const reachable = getReachableComponentIds(componentId, tree);
      if (reachable.has(ancestorComponentId)) {
        window.alert("Không thể thêm — sẽ tạo vòng lặp Component tự chứa nhau.");
        return;
      }
    }
    addComponentInstance(parentId, componentId);
    onClose();
  };

  const handleNewFolder = () => {
    const name = window.prompt("Tên Folder:", "New Folder");
    if (name?.trim()) { addFolder(parentId, name.trim()); onClose(); }
  };
  const handleNewPage = () => {
    const name = window.prompt("Tên Page:", "New Page");
    if (name?.trim()) { addPage(parentId, name.trim(), slugify(name.trim())); onClose(); }
  };
  const handleNewComponent = () => {
    const name = window.prompt("Tên Component:", "New Component");
    if (name?.trim()) { addComponent(parentId, name.trim()); onClose(); }
  };
  const defTile = (def: NodeDefinition) => (
    <PaletteTile
      key={def.id}
      title={def.title}
      Icon={getNodeIcon(def.id)}
      badge={searching ? TIER_BADGE[def.tier ?? "element"] : undefined}
      onClick={() => handleAddDef(def.id)}
    />
  );
  const blockCard = (block: BlockDefinition) => (
    <BlockCard
      key={block.id}
      title={block.title}
      description={block.description}
      Icon={getBlockIcon(block.id)}
      nodeCount={countSpecNodes(block.spec)}
      onClick={() => handleAddBlock(block.id)}
    />
  );
  const projectTiles = filteredComponents.map((component) => (
    <PaletteTile
      key={component.id}
      title={component.name}
      Icon={Box}
      onClick={() => handleAddComponentInstance(component.id)}
    />
  ));

  // ── Folder: chỉ tạo Folder/Page/Component mới — Node Rules không cho HTML/shadcn ở đây ──
  if (isFolderMode) {
    return (
      <div className="flex flex-col p-2 gap-1">
        <p className="text-xs text-muted-foreground px-2 pb-1">
          Thêm vào &quot;{String((parentNode?.props as { name?: string })?.name ?? "Folder")}&quot;
        </p>
        <Button variant="ghost" size="sm" className="justify-start gap-2 h-8" onClick={handleNewFolder}>
          <Folder className="h-3.5 w-3.5" /> New Folder
        </Button>
        <Button variant="ghost" size="sm" className="justify-start gap-2 h-8" onClick={handleNewPage}>
          <FileText className="h-3.5 w-3.5" /> New Page
        </Button>
        <Button variant="ghost" size="sm" className="justify-start gap-2 h-8" onClick={handleNewComponent}>
          <PackagePlus className="h-3.5 w-3.5" /> New Component
        </Button>
      </div>
    );
  }

  // ── Page/Component: HTML/shadcn + project components ──
  const showTabs = !searching && !data.sealed;

  return (
    <div className="flex w-full max-h-[70vh] flex-col">
      <div className="border-b p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search node..." className="h-8 pl-7 text-sm"
          />
        </div>
      </div>

      {showTabs && <PaletteTabs value={tab} onChange={setTab} counts={data.counts} />}

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {searching ? (
          projectTiles.length + data.searchResults.length + data.blockResults.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Không tìm thấy node nào</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-1">
                {projectTiles}
                {data.searchResults.map(defTile)}
              </div>
              {data.blockResults.length > 0 && (
                <PaletteSection label="Block" count={data.blockResults.length}>
                  <div className="grid grid-cols-2 gap-1.5">
                    {data.blockResults.map(blockCard)}
                  </div>
                </PaletteSection>
              )}
            </>
          )
        ) : (
          <>
            {data.parts.length > 0 && (
              <PaletteSection label={`Thành phần của ${parentDef?.title ?? ""}`}>
                <div className="grid grid-cols-4 gap-1">{data.parts.map(defTile)}</div>
              </PaletteSection>
            )}

            {!data.sealed && tab === "component" && projectTiles.length > 0 && (
              <PaletteSection label="Của dự án" count={projectTiles.length}>
                <div className="grid grid-cols-4 gap-1">{projectTiles}</div>
              </PaletteSection>
            )}

            {!data.sealed && tab === "block" &&
              data.blockGroups.map((group) => (
                <PaletteSection key={group.key} label={group.label} count={group.blocks.length}>
                  <div className="grid grid-cols-2 gap-1.5">
                    {group.blocks.map(blockCard)}
                  </div>
                </PaletteSection>
              ))}

            {!data.sealed && tab !== "block" &&
              groups.map((group, index) => (
                <PaletteSection
                  key={group.key}
                  label={group.label}
                  count={group.defs.length}
                  open={isOpen(group.key, index)}
                  onToggle={() => toggle(group.key, index)}
                >
                  <div className="grid grid-cols-4 gap-1">{group.defs.map(defTile)}</div>
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

      <div className="border-t p-2">
        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={onOpenBrowser}>
          Duyệt tất cả theo danh mục...
        </Button>
      </div>
    </div>
  );
}