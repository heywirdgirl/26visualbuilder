// core/registry/shadcn-nodes.ts

import { NodeDefinition } from "@/core/types/node-definition.types";

import { containerDefaultStyle } from "./html-nodes";
import { clusterRawNodes } from "./shadcn-cluster-nodes";



type RawDef = Omit<NodeDefinition, "nodeKind">;


const rawShadcnNodes: RawDef[] = [
  // ── Essential ──
  { id: "shadcn.button", title: "Button", category: "Form", tags: ["form", "action", "button", "shadcn"], canHaveChildren: false, defaultProps: { text: "Button", variant: "default", size: "default" }, propsSchema: [
    { key: "text", label: "Nội dung", inputType: "text" },
    { key: "variant", label: "Variant", inputType: "select", options: ["default", "destructive", "outline", "secondary", "ghost", "link"] },
    { key: "size", label: "Size", inputType: "select", options: ["default", "sm", "lg", "icon"] },
  ]},
  {
    id: "shadcn.card",
    title: "Card",
    category: "Layout",
    tags: ["layout", "container", "panel", "card", "shadcn"],
    canHaveChildren: true,
    defaultProps: {},
    defaultStyle: containerDefaultStyle,
    propsSchema: [],
    defaultChildren: [
      { defId: "html.h3", props: { text: "Card Title" } },
      { defId: "html.p", props: { text: "Mô tả ngắn cho nội dung card." } },
      { defId: "shadcn.button", props: { text: "Xem thêm" } },
    ],
  },
  { id: "shadcn.input", title: "Input", category: "Form", tags: ["form", "input", "field", "shadcn"], canHaveChildren: false, defaultProps: { placeholder: "Nhập nội dung...", type: "text" }, propsSchema: [
    { key: "placeholder", label: "Placeholder", inputType: "text" },
    { key: "type", label: "Loại input", inputType: "select", options: ["text", "email", "password", "number"] },
  ]},
  { id: "shadcn.textarea", title: "Textarea", category: "Form", tags: ["form", "input", "multiline", "shadcn"], canHaveChildren: false, defaultProps: { placeholder: "Nhập nội dung..." }, propsSchema: [
    { key: "placeholder", label: "Placeholder", inputType: "text" },
  ]},
  { id: "shadcn.label", title: "Label", category: "Form", tags: ["typography", "form", "label", "shadcn"], canHaveChildren: false, defaultProps: { text: "Label", htmlFor: "" }, propsSchema: [
    { key: "text", label: "Nội dung", inputType: "text" },
    { key: "htmlFor", label: "Gắn với (for)", inputType: "text" },
  ]},
  { id: "shadcn.checkbox", title: "Checkbox", category: "Form", tags: ["form", "checkbox", "toggle", "shadcn"], canHaveChildren: false, defaultProps: { label: "Checkbox", checked: false }, propsSchema: [
    { key: "label", label: "Nội dung", inputType: "text" },
    { key: "checked", label: "Đã chọn", inputType: "checkbox" },
  ]},
  { id: "shadcn.radio-group", title: "Radio Group", category: "Form", tags: ["form", "radio", "choice", "shadcn"], canHaveChildren: false, defaultProps: { options: "Option 1, Option 2" }, propsSchema: [
    { key: "options", label: "Các lựa chọn (phân tách bằng dấu phẩy)", inputType: "text" },
  ]},
  { id: "shadcn.switch", title: "Switch", category: "Form", tags: ["form", "switch", "toggle", "shadcn"], canHaveChildren: false, defaultProps: { label: "Switch", checked: false }, propsSchema: [
    { key: "label", label: "Nội dung", inputType: "text" },
    { key: "checked", label: "Đã chọn", inputType: "checkbox" },
  ]},
  { id: "shadcn.select", title: "Select", category: "Form", tags: ["form", "dropdown", "select", "shadcn"], canHaveChildren: false, defaultProps: { placeholder: "Chọn...", options: "Option 1, Option 2" }, propsSchema: [
    { key: "placeholder", label: "Placeholder", inputType: "text" },
    { key: "options", label: "Các lựa chọn (phân tách bằng dấu phẩy)", inputType: "text" },
  ]},
  { id: "shadcn.badge", title: "Badge", category: "Data Display", tags: ["data", "badge", "tag", "shadcn"], canHaveChildren: false, defaultProps: { text: "Badge", variant: "default" }, propsSchema: [
    { key: "text", label: "Nội dung", inputType: "text" },
    { key: "variant", label: "Variant", inputType: "select", options: ["default", "secondary", "destructive", "outline"] },
  ]},
  { id: "shadcn.avatar", title: "Avatar", category: "Data Display", tags: ["data", "avatar", "user", "shadcn"], canHaveChildren: false, defaultProps: { src: "", fallback: "CN" }, propsSchema: [
    { key: "src", label: "Đường dẫn ảnh", inputType: "text" },
    { key: "fallback", label: "Chữ viết tắt (fallback)", inputType: "text" },
  ]},
  { id: "shadcn.separator", title: "Separator", category: "Layout", tags: ["media", "divider", "line", "shadcn"], canHaveChildren: false, defaultProps: { orientation: "horizontal" }, propsSchema: [
    { key: "orientation", label: "Hướng", inputType: "select", options: ["horizontal", "vertical"] },
  ]},

  // ── Layout ──
  { id: "shadcn.scroll-area", title: "Scroll Area", category: "Layout", tags: ["layout", "scroll", "container", "shadcn"], canHaveChildren: true, defaultProps: { height: 140 },
    defaultChildren: [1, 2, 3, 4, 5, 6].map((n) => ({ defId: "html.p", props: { text: `Dòng nội dung ${n}` } })),
    propsSchema: [
    { key: "height", label: "Chiều cao (px)", inputType: "number" },
  ]},

  // ── Feedback ──
  { id: "shadcn.alert", title: "Alert", category: "Feedback", tags: ["feedback", "alert", "message", "shadcn"], canHaveChildren: false, defaultProps: { title: "Heads up!", description: "Thông báo quan trọng.", variant: "default" }, propsSchema: [
    { key: "title", label: "Tiêu đề", inputType: "text" },
    { key: "description", label: "Mô tả", inputType: "textarea" },
    { key: "variant", label: "Variant", inputType: "select", options: ["default", "destructive"] },
  ]},
  { id: "shadcn.tooltip", title: "Tooltip", category: "Overlay", tier: "component", tags: ["feedback", "tooltip", "hint", "shadcn"], canHaveChildren: true, defaultProps: { text: "Tooltip text" },
    defaultChildren: [{ defId: "shadcn.button", props: { text: "Rê chuột vào đây" } }],
    propsSchema: [
    { key: "text", label: "Nội dung tooltip", inputType: "text" },
  ]},
  { id: "shadcn.toast", title: "Toast", category: "Feedback", tags: ["feedback", "toast", "notification", "shadcn"], canHaveChildren: false, defaultProps: { title: "Thông báo", description: "" }, propsSchema: [
    { key: "title", label: "Tiêu đề", inputType: "text" },
    { key: "description", label: "Mô tả", inputType: "text" },
  ]},

  // ── Data ──
  { id: "shadcn.progress", title: "Progress", category: "Feedback", tags: ["data", "progress", "loading", "shadcn"], canHaveChildren: false, defaultProps: { value: 50 }, propsSchema: [
    { key: "value", label: "Giá trị (%)", inputType: "number" },
  ]},
  { id: "shadcn.skeleton", title: "Skeleton", category: "Feedback", tags: ["data", "skeleton", "loading", "placeholder", "shadcn"], canHaveChildren: false, defaultProps: { width: 100, height: 20 }, propsSchema: [
    { key: "width", label: "Chiều rộng (px)", inputType: "number" },
    { key: "height", label: "Chiều cao (px)", inputType: "number" },
  ]},

  // ── Navigation ──
  { id: "shadcn.pagination", title: "Pagination", category: "Navigation", tags: ["navigation", "pagination", "pages", "shadcn"], canHaveChildren: false, defaultProps: { totalPages: 5, currentPage: 1 }, propsSchema: [
    { key: "totalPages", label: "Tổng số trang", inputType: "number" },
    { key: "currentPage", label: "Trang hiện tại", inputType: "number" },
  ]},

  // ── Overlay ──
];

export const shadcnNodes: NodeDefinition[] = [...rawShadcnNodes, ...clusterRawNodes].map((def) => ({
  ...def,
  tier: def.tier ?? "element",
  nodeKind: "shadcn" as const,
  version: 1,
}));