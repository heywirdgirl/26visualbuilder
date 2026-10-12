"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { TreeNode } from "@/core/types/builder.types";
import { useBuilderStore } from "@/core/store/builder-store";
import { STYLE_PRESETS } from "@/core/registry/style-presets";
import { SectionShell } from "./section-shell";

const GROUPS: { label: string; names: string[] }[] = [
  { label: "Layout", names: ["page-container", "section", "hero", "box", "stack", "stack-lg", "row", "row-between", "row-wrap", "grid-2", "grid-3", "grid-4", "navbar", "footer", "list", "list-item"] },
  { label: "Surface", names: ["card", "card-featured", "card-dark", "card-glass", "surface-muted"] },
  { label: "Text", names: ["heading-hero", "heading-section", "heading-card", "text-lead", "text-body", "text-muted", "price", "eyebrow", "label", "link"] },
  { label: "Action", names: ["button-primary", "button-block", "button-accent", "button-soft", "badge-pill"] },
  { label: "Media & Form", names: ["image-cover", "input-field"] },
];

export function PresetSection({ node }: { node: TreeNode }) {
  const applyStylePreset = useBuilderStore((s) => s.applyStylePreset);
  const [lastApplied, setLastApplied] = useState<string | null>(null);

  const known = new Set(Object.keys(STYLE_PRESETS));
  const groups = GROUPS.map((group) => ({
    ...group,
    names: group.names.filter((name) => known.has(name)),
  })).filter((group) => group.names.length > 0);
  const used = new Set(groups.flatMap((group) => group.names));
  const others = Object.keys(STYLE_PRESETS).filter((name) => !used.has(name));
  if (others.length > 0) groups.push({ label: "Khác", names: others });

  const apply = (name: string | null) => {
    applyStylePreset(node.id, name);
    setLastApplied(name ?? "default");
  };

  return (
    <SectionShell title="Preset" defaultOpen>
      <select
        value=""
        onChange={(event) => event.target.value && apply(event.target.value)}
        className="border rounded px-2 py-1"
      >
        <option value="">— Chọn preset —</option>
        {groups.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.names.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </optgroup>
        ))}
      </select>

      {lastApplied && (
        <p className="text-[10px] text-muted-foreground">
          Đã áp dụng: <b>{lastApplied}</b>
          {STYLE_PRESETS[lastApplied] ? ` — ${STYLE_PRESETS[lastApplied].description}` : " — preset mặc định của loại node này"}
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
