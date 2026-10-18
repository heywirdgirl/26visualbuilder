import React from "react";
import { Loader2 } from "lucide-react";
import type { RendererEntry } from "./renderer-map";
import { boxEntry, classAttr, prop } from "./cluster-renderers";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/core/utils/cn";
import { escapeAttr, escapeJsxText } from "@/core/utils/escape-jsx-text";
import type { TreeNode } from "@/core/types/builder.types";

const num = (node: TreeNode, key: string, fallback: number) => {
  const value = Number(prop(node, key, String(fallback)));
  return Number.isFinite(value) ? value : fallback;
};

const ratioParts = (node: TreeNode): [number, number] => {
  const [width, height] = prop(node, "ratio", "16/9").split("/").map(Number);
  return width > 0 && height > 0 ? [width, height] : [16, 9];
};

type Variant = "default" | "outline";

export const shadcnExtraRenderers: Record<string, RendererEntry> = {
  "shadcn.slider": {
    jsxTagName: "Slider",
    importStatement: `import { Slider } from "@/components/ui/slider";`,
    render: (node, _children, className) => {
      const value = num(node, "value", 50);
      const max = num(node, "max", 100);
      const step = num(node, "step", 1) || 1;
      return (
        <Slider
          key={`${value}-${max}-${step}`}
          data-node-id={node.id}
          defaultValue={[value]}
          max={max}
          step={step}
          className={className}
        />
      );
    },
    toJsx: (node, _children, className, pad) =>
      `${pad}<Slider defaultValue={[${num(node, "value", 50)}]} max={${num(node, "max", 100)}} step={${num(node, "step", 1) || 1}}${classAttr(className)} />`,
  },
  "shadcn.toggle": {
    jsxTagName: "Toggle",
    importStatement: `import { Toggle } from "@/components/ui/toggle";`,
    render: (node, _children, className) => (
      <Toggle
        data-node-id={node.id}
        variant={prop(node, "variant", "outline") as Variant}
        size={prop(node, "size", "default") as "default" | "sm" | "lg"}
        className={className}
      >
        {prop(node, "text")}
      </Toggle>
    ),
  },
  "shadcn.toggle-group": {
    jsxTagName: "ToggleGroup",
    importStatement: `import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";`,
    render: (node, children, className) => {
      const variant = prop(node, "variant", "outline") as Variant;
      return prop(node, "type", "single") === "multiple" ? (
        <ToggleGroup key="multiple" type="multiple" variant={variant} data-node-id={node.id} className={className}>
          {children}
        </ToggleGroup>
      ) : (
        <ToggleGroup key="single" type="single" variant={variant} data-node-id={node.id} className={className}>
          {children}
        </ToggleGroup>
      );
    },
    toJsx: (node, childrenJsx, className, pad) =>
      `${pad}<ToggleGroup type="${escapeAttr(prop(node, "type", "single"))}" variant="${escapeAttr(prop(node, "variant", "outline"))}"${classAttr(className)}>\n${childrenJsx}\n${pad}</ToggleGroup>`,
  },
  "shadcn.toggle-group-item": {
    jsxTagName: "ToggleGroupItem",
    render: (node, _children, className) => (
      <ToggleGroupItem data-node-id={node.id} value={prop(node, "value", "item-1")} className={className}>
        {prop(node, "text")}
      </ToggleGroupItem>
    ),
    toJsx: (node, _children, className, pad) =>
      `${pad}<ToggleGroupItem value="${escapeAttr(prop(node, "value", "item-1"))}"${classAttr(className)}>${escapeJsxText(prop(node, "text"))}</ToggleGroupItem>`,
  },
  "shadcn.aspect-ratio": {
    jsxTagName: "AspectRatio",
    importStatement: `import { AspectRatio } from "@/components/ui/aspect-ratio";`,
    render: (node, children, className) => {
      const [width, height] = ratioParts(node);
      return (
        <AspectRatio data-node-id={node.id} ratio={width / height} className={className}>
          {children}
        </AspectRatio>
      );
    },
    toJsx: (node, childrenJsx, className, pad) => {
      const [width, height] = ratioParts(node);
      return `${pad}<AspectRatio ratio={${width} / ${height}}${classAttr(className)}>\n${childrenJsx}\n${pad}</AspectRatio>`;
    },
  },
  "shadcn.spinner": {
    jsxTagName: "Loader2",
    importStatement: `import { Loader2 } from "lucide-react";`,
    render: (node, _children, className) => (
      <Loader2 data-node-id={node.id} size={num(node, "size", 24)} className={cn("animate-spin", className)} />
    ),
    toJsx: (node, _children, className, pad) =>
      `${pad}<Loader2 size={${num(node, "size", 24)}} className="${escapeAttr(cn("animate-spin", className))}" />`,
  },
  "shadcn.empty": boxEntry("div", "div", ""),
};
