// src/features/inspector/components/preset-section.tsx

"use client";

import { useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import { TreeNode } from "@/core/types/builder.types";
import { NodeDefinition } from "@/core/types/node-definition.types";
import { useBuilderStore } from "@/core/store/builder-store";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { STYLE_PRESETS } from "@/core/registry/style-presets";
import { SectionShell } from "./section-shell";
import { cn } from "@/core/utils/cn";

type GroupId = "layout" | "surface" | "text" | "action" | "media" | "other";

const GROUPS: { id: GroupId; label: string; names: string[] }[] = [
  { id: "layout", label: "Layout", names: ["page-container", "section", "hero", "box", "stack", "stack-lg", "row", "row-between", "row-wrap", "grid-2", "grid-3", "grid-4", "navbar", "footer", "list", "list-item"] },
  { id: "surface", label: "Surface", names: ["card", "card-featured", "card-dark", "card-glass", "surface-muted"] },
  { id: "text", label: "Text", names: ["heading-hero", "heading-section", "heading-card", "text-lead", "text-body", "text-muted", "price", "eyebrow", "label", "link"] },
  { id: "action", label: "Action", names: ["button-primary", "button-block", "button-accent", "button-soft", "badge-pill"] },
  { id: "media", label: "Media & Form", names: ["image-cover", "input-field"] },
];

// Ngoại lệ theo defId — các node lá thuộc "Data Display" và <a> (có children nhưng thực chất là link)
// không phân loại đúng được bằng canHaveChildren/category.
const RELEVANT_OVERRIDES: Record<string, GroupId[]> = {
  "html.a": ["text", "action"],
  "shadcn.badge": ["action", "text"],
  "shadcn.avatar": ["media"],
  "shadcn.alert": ["surface", "text"],
};

function relevantGroupIds(def: NodeDefinition | undefined): GroupId[] {
  if (!def) return ["layout"];
  const override = RELEVANT_OVERRIDES[def.id];
  if (override) return override;
  if (def.canHaveChildren) return ["layout", "surface"];
  if (def.category === "Typography") return ["text"];
  if (def.category === "Media") return ["media"];
  if (def.category === "Form") return def.tags.includes("action") ? ["action"] : ["media"];
  return ["surface"];
}

export function PresetSection({ node }: { node: TreeNode }) {
  const applyStylePreset = useBuilderStore((s) => s.applyStylePreset);
  const [lastApplied, setLastApplied] = useState<string | null>(null);

  const def = getNodeDefinition(node.type);
  const relevant = relevantGroupIds(def);

  // Trạng thái mở ban đầu = các nhóm liên quan. Component được gắn key = node.id ở InspectorPanel
  // nên đổi node là khởi tạo lại, không giữ trạng thái mở/đóng của node trước.
  const [openIds, setOpenIds] = useState<Set<GroupId>>(() => new Set(relevant));

  // Preset mới chưa xếp vào nhóm nào tự rơi vào "Khác" — thêm preset không bao giờ bị ẩn.
  const known = new Set(Object.keys(STYLE_PRESETS));
  const groups = GROUPS.map((g) => ({ ...g, names: g.names.filter((n) => known.has(n)) })).filter((g) => g.names.length > 0);
  const used = new Set(groups.flatMap((g) => g.names));
  const leftover = Object.keys(STYLE_PRESETS).filter((n) => !used.has(n));
  if (leftover.length > 0) groups.push({ id: "other", label: "Khác", names: leftover });

  // Nhóm liên quan lên đầu theo đúng thứ tự trong `relevant`; các nhóm còn lại giữ thứ tự cũ (sort ổn định).
  const rank = (id: GroupId) => {
    const i = relevant.indexOf(id);
    return i === -1 ? 999 : i;
  };
  const sorted = [...groups].sort((a, b) => rank(a.id) - rank(b.id));

  const toggle = (id: GroupId) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const apply = (name: string | null) => {
    applyStylePreset(node.id, name);
    setLastApplied(name ?? "default");
  };

  return (
    <SectionShell title="Preset" defaultOpen>
      <div className="flex flex-col gap-1.5">
        {sorted.map((g) => {
          const isOpen = openIds.has(g.id);
          const isRelevant = relevant.includes(g.id);

          return (
            <div key={g.id} className="rounded-md border">
              <button
                type="button"
                onClick={() => toggle(g.id)}
                className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-xs font-medium"
              >
                <ChevronRight className={cn("h-3 w-3 shrink-0 transition-transform", isOpen && "rotate-90")} />
                {g.label}
                <span className="font-normal text-muted-foreground">({g.names.length})</span>
                {isRelevant && (
                  <span className="ml-auto rounded bg-primary/10 px-1.5 text-[10px] font-normal text-primary">Gợi ý</span>
                )}
              </button>

              {isOpen && (
                <div className="flex flex-wrap gap-1 border-t px-2 py-2">
                  {g.names.map((name) => (
                    <button
                      key={name}
                      type="button"
                      title={STYLE_PRESETS[name].description}
                      onClick={() => apply(name)}
                      className={cn(
                        "rounded border px-2 py-1 text-xs hover:bg-muted",
                        lastApplied === name && "border-primary bg-primary/10 text-primary"
                      )}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {lastApplied && (
        <p className="text-[10px] text-muted-foreground">
          Đã áp dụng: <b>{lastApplied}</b>
          {STYLE_PRESETS[lastApplied]
            ? ` — ${STYLE_PRESETS[lastApplied].description}`
            : " — preset mặc định của loại node này"}
        </p>
      )}

      <button
        type="button"
        onClick={() => apply(null)}
        className="flex items-center gap-1.5 self-start text-xs text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="h-3 w-3" />
        Reset về mặc định
      </button>

      <p className="text-[10px] text-muted-foreground">
        Áp preset sẽ thay toàn bộ style của node này (mọi breakpoint). Dùng Reset để quay về mặc định.
      </p>
    </SectionShell>
  );
}