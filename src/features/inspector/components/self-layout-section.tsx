"use client";

import { TreeNode } from "@/core/types/builder.types";
import { StyleProps } from "@/core/types/style.types";
import { useStyleField } from "../hooks/use-style-field";
import { StyleField } from "./style-field";
import { cn } from "@/core/utils/cn";

const ALIGN_SELF_OPTIONS: { value: NonNullable<StyleProps["alignSelf"]>; label: string }[] = [
  { value: "self-auto", label: "Auto" },
  { value: "self-start", label: "Start" },
  { value: "self-center", label: "Center" },
  { value: "self-end", label: "End" },
  { value: "self-stretch", label: "Stretch" },
];

export function SelfLayoutSection({ node }: { node: TreeNode }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">Self Layout</h4>
      <p className="text-[10px] text-muted-foreground -mt-2">
        Cách node này tự xử sự khi nằm trong 1 Container khác, độc lập với Layout của node.
      </p>
      <StyleField label="Align Self" showClear={hasOverride("alignSelf")} onClear={() => clearOverride("alignSelf")}>
        <div className="flex flex-wrap gap-1">
          {ALIGN_SELF_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setValue("alignSelf", option.value)}
              className={cn(
                "border rounded px-2 py-1 text-xs",
                getValue("alignSelf") === option.value && "bg-primary/10 border-primary text-primary"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </StyleField>
      <div className="grid grid-cols-2 gap-2">
        <StyleField label="Grow" showClear={hasOverride("flexGrow")} onClear={() => clearOverride("flexGrow")}>
          <div className="flex gap-1">
            {[0, 1].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue("flexGrow", value as 0 | 1)}
                className={cn(
                  "flex-1 border rounded py-1 text-xs",
                  getValue("flexGrow") === value && "bg-primary/10 border-primary text-primary"
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </StyleField>
        <StyleField label="Shrink" showClear={hasOverride("flexShrink")} onClear={() => clearOverride("flexShrink")}>
          <div className="flex gap-1">
            {[0, 1].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue("flexShrink", value as 0 | 1)}
                className={cn(
                  "flex-1 border rounded py-1 text-xs",
                  getValue("flexShrink") === value && "bg-primary/10 border-primary text-primary"
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </StyleField>
      </div>
    </div>
  );
}
