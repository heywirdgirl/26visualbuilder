// features/node-palette/components/quick-add-dropdown.tsx

"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Folder, FileText, PackagePlus } from "lucide-react";
import {
  useBuilderStore,
  findNode,
  useComponentList,
  useAncestorComponentId,
  getReachableComponentIds,
} from "@/core/store/builder-store";
import { searchNodes, getNodeDefinition } from "@/core/registry/node-registry";
import { commonNodeIds } from "../constants/common-node-ids";
import { NodeListRow } from "./node-list-row";

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
  const addFolder = useBuilderStore((s) => s.addFolder);
  const addPage = useBuilderStore((s) => s.addPage);
  const addComponent = useBuilderStore((s) => s.addComponent);
  const addComponentInstance = useBuilderStore((s) => s.addComponentInstance);
  const componentList = useComponentList();
  const ancestorComponentId = useAncestorComponentId(parentId);
  const [query, setQuery] = useState("");

  const parentNode = findNode(tree, parentId);
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

  const filteredDefs = useMemo(() => {
    if (query.trim()) return searchNodes(query).slice(0, 30);
    return commonNodeIds.map((id) => getNodeDefinition(id)).filter((d): d is NonNullable<typeof d> => !!d);
  }, [query]);

  const handleAddDef = (defId: string) => {
    addNode(parentId, defId);
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

  // ── Page/Component: HTML/shadcn (như V1) + Component có sẵn (thêm Instance) ──
  return (
    <div className="flex flex-col max-h-80">
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search node..." className="pl-7 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        {filteredComponents.length === 0 && filteredDefs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Không tìm thấy node nào</p>
        ) : (
          <>
            {filteredComponents.length > 0 && (
              <>
                {!query.trim() && (
                  <p className="text-[10px] font-medium text-muted-foreground px-2 pt-1 pb-0.5">My Components</p>
                )}
                {filteredComponents.map((c) => (
                  <NodeListRow key={c.id} title={c.name} iconName="Box" onClick={() => handleAddComponentInstance(c.id)} />
                ))}
              </>
            )}
            {filteredDefs.length > 0 && (
              <>
                {!query.trim() && filteredComponents.length > 0 && (
                  <p className="text-[10px] font-medium text-muted-foreground px-2 pt-2 pb-0.5">Hay dùng</p>
                )}
                {filteredDefs.map((def) => (
                  <NodeListRow key={def.id} title={def.title} iconName={def.icon} onClick={() => handleAddDef(def.id)} />
                ))}
              </>
            )}
          </>
        )}
      </div>

      <div className="p-2 border-t">
        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={onOpenBrowser}>
          Duyệt tất cả theo danh mục...
        </Button>
      </div>
    </div>
  );
}