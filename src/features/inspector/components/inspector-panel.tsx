"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useActiveNode, useBuilderStore } from "@/core/store/builder-store";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { cn } from "@/core/utils/cn";
import type { ActiveState } from "@/core/utils/style-cascade";
import { BreakpointSwitcher } from "./breakpoint-switcher";
import { DynamicPropsForm } from "./dynamic-props-form";
import { PresetSection } from "./preset-section";
import { SchemaField } from "./schema-field";
import { getNodeKind } from "../constants/style-field-schema";
import {
  getGroupFields,
  getGroupKeys,
  getVisibleGroups,
  groupHasValue,
  type GroupId,
} from "../constants/inspector-groups";

const STATES: { id: ActiveState; label: string }[] = [
  { id: "normal", label: "Thường" },
  { id: "hover", label: "Hover" },
  { id: "focus", label: "Focus" },
  { id: "active", label: "Active" },
];

export function InspectorPanel() {
  const activeNode = useActiveNode();
  const setActiveNode = useBuilderStore((state) => state.setActiveNode);
  const editMode = useBuilderStore((state) => state.editMode);
  const activeState = useBuilderStore((state) => state.activeState);
  const setActiveState = useBuilderStore((state) => state.setActiveState);
  const [selectedId, setSelectedId] = useState<GroupId>("common");

  if (!editMode || !activeNode) return null;

  const def = getNodeDefinition(activeNode.type);
  const isInstance = def?.nodeKind === "component-instance";
  const kind = getNodeKind(def);
  const groups = getVisibleGroups(kind, (def?.propsSchema.length ?? 0) > 0);
  const current = groups.find((group) => group.id === selectedId) ?? groups[0];
  const fields = current ? getGroupFields(current, kind) : [];

  return (
    <div className="fixed top-4 right-4 w-80 bg-white/50 border rounded-lg shadow-lg flex flex-col z-[6000] max-h-[80vh]">
      <div className="sticky top-0 bg-white px-4 py-3 flex items-center justify-between border-b border-zinc-100">
        <span className="text-sm font-medium">{def?.title ?? activeNode.type}</span>
        <button
          type="button"
          onClick={() => setActiveNode(null)}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {isInstance ? (
        <p className="p-4 text-xs text-muted-foreground">
          Component Instance không sửa trực tiếp — chọn đúng Component gốc trong Components/ để sửa.
        </p>
      ) : (
        <div className="min-h-0 overflow-y-auto p-3 flex flex-col gap-3 bg-white/30 backdrop-blur-[2px]">
          <div className="flex rounded-md border p-0.5 text-[11px]">
            {STATES.map((state) => (
              <button
                key={state.id}
                type="button"
                onClick={() => setActiveState(state.id)}
                className={cn(
                  "flex-1 rounded px-1.5 py-1",
                  activeState === state.id ? "bg-sky-500 text-white" : "hover:bg-zinc-100"
                )}
              >
                {state.label}
              </button>
            ))}
          </div>

          {activeState === "normal" && <BreakpointSwitcher />}

          <div className="grid grid-cols-4 gap-1">
            {groups.map((group) => {
              const Icon = group.icon;
              const selected = group.id === current?.id;
              const hasValue =
                group.id !== "preset" && groupHasValue(activeNode.style, getGroupKeys(group, kind));
              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedId(group.id)}
                  className={cn(
                    "relative flex flex-col items-center gap-1 rounded-md p-2 text-[10px] transition-colors",
                    selected ? "ring-2 ring-sky-500 bg-sky-50" : "hover:bg-zinc-100"
                  )}
                >
                  <Icon className="size-4" />
                  <span className="w-full truncate text-center">{group.label}</span>
                  {hasValue && <span className="absolute right-1 top-1 size-1.5 rounded-full bg-sky-500" />}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 border-t pt-3">
            {current?.id === "preset" ? (
              <PresetSection key={activeNode.id} node={activeNode} />
            ) : current?.id === "content" ? (
              <DynamicPropsForm node={activeNode} />
            ) : (
              <>
                <h3 className="text-xs font-medium">{current?.label}</h3>
                {activeState !== "normal" && (
                  <p className="text-[10px] text-muted-foreground">
                    Đang chỉnh trạng thái <b>{activeState}</b>. Style này chỉ áp dụng khi trạng thái xảy ra.
                  </p>
                )}
                {fields.length === 0 && (
                  <p className="text-xs text-muted-foreground">Không có thuộc tính cho loại node này.</p>
                )}
                {fields.map((spec) => (
                  <SchemaField key={spec.key} node={activeNode} spec={spec} />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
