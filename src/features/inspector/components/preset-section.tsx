"use client";

import { useState } from "react";
import { ChevronRight, RotateCcw } from "lucide-react";
import type { TreeNode } from "@/core/types/builder.types";
import { useBuilderStore } from "@/core/store/builder-store";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { STYLE_PRESETS } from "@/core/registry/style-presets";
import { cn } from "@/core/utils/cn";
import {
  PRESET_GROUPS,
  relevantPresetGroups,
  type PresetGroupId,
} from "../constants/inspector-groups";

export function PresetSection({ node }: { node: TreeNode }) {
  const applyStylePreset = useBuilderStore((state) => state.applyStylePreset);
  const [lastApplied, setLastApplied] = useState<string | null>(null);

  const relevant = relevantPresetGroups(getNodeDefinition(node.type));
  const [openIds, setOpenIds] = useState<Set<PresetGroupId>>(() => new Set(relevant));

  const known = new Set(Object.keys(STYLE_PRESETS));
  const groups = PRESET_GROUPS
    .map((group) => ({ ...group, names: group.names.filter((name) => known.has(name)) }))
    .filter((group) => group.names.length > 0);
  const used = new Set(groups.flatMap((group) => group.names));
  const leftover = Object.keys(STYLE_PRESETS).filter((name) => !used.has(name));
  if (leftover.length > 0) groups.push({ id: "other", label: "Khác", names: leftover });

  const rank = (id: PresetGroupId) => {
    const index = relevant.indexOf(id);
    return index === -1 ? 999 : index;
  };
  const sorted = [...groups].sort((a, b) => rank(a.id) - rank(b.id));

  const toggle = (id: PresetGroupId) =>
    setOpenIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const apply = (name: string | null) => {
    if (!window.confirm("Áp preset sẽ thay toàn bộ style của node (mọi breakpoint và trạng thái). Tiếp tục?")) {
      return;
    }
    applyStylePreset(node.id, name);
    setLastApplied(name ?? "default");
  };

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((group) => {
        const isOpen = openIds.has(group.id);
        const isRelevant = relevant.includes(group.id);

        return (
          <div key={group.id} className="rounded-md border">
            <button
              type="button"
              onClick={() => toggle(group.id)}
              className="flex w-full items-center gap-1.5 px-2 py-1.5 text-left text-xs font-medium"
            >
              <ChevronRight className={cn("h-3 w-3 shrink-0 transition-transform", isOpen && "rotate-90")} />
              {group.label}
              <span className="font-normal text-muted-foreground">({group.names.length})</span>
              {isRelevant && (
                <span className="ml-auto rounded bg-primary/10 px-1.5 text-[10px] font-normal text-primary">
                  Gợi ý
                </span>
              )}
            </button>

            {isOpen && (
              <div className="flex flex-wrap gap-1 border-t px-2 py-2">
                {group.names.map((name) => (
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
    </div>
  );
}
