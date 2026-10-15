// features/node-palette/components/quick-add-dropdown.tsx

"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Folder, FileText, PackagePlus, Box, type LucideIcon } from "lucide-react";
import {
  useBuilderStore,
  findNode,
  useComponentList,
  useAncestorComponentId,
  getReachableComponentIds,
} from "@/core/store/builder-store";
import { searchNodes, getNodeDefinition } from "@/core/registry/node-registry";
import { getNodeIcon } from "../constants/node-icons";
import { commonNodeIds } from "../constants/common-node-ids";

function slugify(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function NodeTile({
  title,
  Icon,
  onClick,
}: {
  title: string;
  Icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-14 flex-col items-center justify-center gap-1 rounded-md border bg-background px-1 hover:bg-accent active:bg-accent"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="w-full truncate text-center text-[10px] leading-tight">{title}</span>
    </button>
  );
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

  const groupedDefs = useMemo(() => {
    const q = query.trim();
    const defs = searchNodes(q).filter(
      (def) => def.nodeKind === "html" || def.nodeKind === "shadcn"
    );
    const groups = new Map<string, typeof defs>();
    const commonIds = new Set<string>();

    if (!q) {
      const common = commonNodeIds
        .map((id) => getNodeDefinition(id))
        .filter(
          (def): def is NonNullable<typeof def> =>
            !!def && (def.nodeKind === "html" || def.nodeKind === "shadcn")
        );
      if (common.length) {
        groups.set("Hay dùng", common);
        common.forEach((def) => commonIds.add(def.id));
      }
    }

    for (const def of defs) {
      if (commonIds.has(def.id)) continue;
      const category = def.category ?? "Khác";
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category)?.push(def);
    }

    return Array.from(groups.entries());
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
    <div className="flex w-full max-h-[70vh] flex-col">
      <div className="p-2 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search node..." className="pl-7 h-8 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-2">
        {filteredComponents.length === 0 && groupedDefs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Không tìm thấy node nào</p>
        ) : (
          <>
            {filteredComponents.length > 0 && (
              <section>
                <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  My Components
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {filteredComponents.map((component) => (
                    <NodeTile
                      key={component.id}
                      title={component.name}
                      Icon={Box}
                      onClick={() => handleAddComponentInstance(component.id)}
                    />
                  ))}
                </div>
              </section>
            )}
            {groupedDefs.map(([category, defs]) => (
              <section key={category}>
                <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {category}
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {defs.map((def) => (
                    <NodeTile
                      key={def.id}
                      title={def.title}
                      Icon={getNodeIcon(def.id)}
                      onClick={() => handleAddDef(def.id)}
                    />
                  ))}
                </div>
              </section>
            ))}
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