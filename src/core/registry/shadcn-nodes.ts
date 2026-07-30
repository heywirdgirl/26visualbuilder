// core/registry/shadcn-nodes.ts

import { NodeDefinition } from "@/core/types/node-definition.types";

import { containerDefaultStyle } from "./html-nodes";



type RawDef = Omit<NodeDefinition, "nodeKind">;


const rawShadcnNodes: RawDef[] = [
  // ── Essential ──
  { id: "shadcn.button", title: "Button", category: "Form", tags: ["form", "action", "button", "shadcn"], canHaveChildren: false, defaultProps: { text: "Button", variant: "default", size: "default" }, propsSchema: [
    { key: "text", label: "Nội dung", inputType: "text" },
    { key: "variant", label: "Variant", inputType: "select", options: ["default", "destructive", "outline", "secondary", "ghost", "link"] },
    { key: "size", label: "Size", inputType: "select", options: ["default", "sm", "lg", "icon"] },
  ]},
    { id: "shadcn.card", title: "Card", category: "Layout", tags: ["layout", "container", "panel", "card", "shadcn"], canHaveChildren: true, defaultProps: {},defaultStyle: containerDefaultStyle, propsSchema: [] },
  { id: "shadcn.input", title: "Input", category: "Form", tags: ["form", "input", "field", "shadcn"], canHaveChildren: false, defaultProps: { placeholder: "Nhập nội dung...", type: "text" }, propsSchema: [
    { key: "placeholder", label: "Placeholder", inputType: "text" },
    { key: "type", label: "Loại input", inputType: "select", options: ["text", "email", "password", "number"] },
  ]},
  { id: "shadcn.textarea", title: "Textarea", category: "Form", tags: ["form", "input", "multiline", "shadcn"], canHaveChildren: false, defaultProps: { placeholder: "Nhập nội dung..." }, propsSchema: [
    { key: "placeholder", label: "Placeholder", inputType: "text" },
  ]},
  { id: "shadcn.label", title: "Label", category: "Typography", tags: ["typography", "form", "label", "shadcn"], canHaveChildren: false, defaultProps: { text: "Label", htmlFor: "" }, propsSchema: [
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
  { id: "shadcn.separator", title: "Separator", category: "Media", tags: ["media", "divider", "line", "shadcn"], canHaveChildren: false, defaultProps: { orientation: "horizontal" }, propsSchema: [
    { key: "orientation", label: "Hướng", inputType: "select", options: ["horizontal", "vertical"] },
  ]},

  // ── Layout ──
  { id: "shadcn.scroll-area", title: "Scroll Area", category: "Layout", tags: ["layout", "scroll", "container", "shadcn"], canHaveChildren: true, defaultProps: { height: 300 }, propsSchema: [
    { key: "height", label: "Chiều cao (px)", inputType: "number" },
  ]},
  { id: "shadcn.tabs", title: "Tabs", category: "Navigation", tags: ["navigation", "tabs", "shadcn"], canHaveChildren: true, defaultProps: { defaultTab: "tab1" }, propsSchema: [
    { key: "defaultTab", label: "Tab mặc định", inputType: "text" },
  ]},
  { id: "shadcn.accordion", title: "Accordion", category: "Layout", tags: ["layout", "accordion", "collapsible", "shadcn"], canHaveChildren: true, defaultProps: {}, propsSchema: [] },
  { id: "shadcn.collapsible", title: "Collapsible", category: "Layout", tags: ["layout", "collapsible", "toggle", "shadcn"], canHaveChildren: true, defaultProps: { defaultOpen: false }, propsSchema: [
    { key: "defaultOpen", label: "Mở mặc định", inputType: "checkbox" },
  ]},
  { id: "shadcn.resizable", title: "Resizable", category: "Layout", tags: ["layout", "resizable", "panel", "shadcn"], canHaveChildren: true, defaultProps: { splitDirection: "horizontal" }, propsSchema: [
    { key: "direction", label: "Hướng chia", inputType: "select", options: ["horizontal", "vertical"] },
  ]},

  // ── Feedback ──
  { id: "shadcn.alert", title: "Alert", category: "Data Display", tags: ["feedback", "alert", "message", "shadcn"], canHaveChildren: false, defaultProps: { title: "Heads up!", description: "Thông báo quan trọng.", variant: "default" }, propsSchema: [
    { key: "title", label: "Tiêu đề", inputType: "text" },
    { key: "description", label: "Mô tả", inputType: "textarea" },
    { key: "variant", label: "Variant", inputType: "select", options: ["default", "destructive"] },
  ]},
  { id: "shadcn.alert-dialog", title: "Alert Dialog", category: "Overlay", tags: ["feedback", "dialog", "confirm", "shadcn"], canHaveChildren: true, defaultProps: { triggerText: "Open" }, propsSchema: [
    { key: "triggerText", label: "Text nút mở", inputType: "text" },
  ]},
  { id: "shadcn.dialog", title: "Dialog", category: "Overlay", tags: ["feedback", "dialog", "modal", "shadcn"], canHaveChildren: true, defaultProps: { triggerText: "Open" }, propsSchema: [
    { key: "triggerText", label: "Text nút mở", inputType: "text" },
  ]},
  { id: "shadcn.sheet", title: "Sheet", category: "Overlay", tags: ["feedback", "sheet", "drawer", "shadcn"], canHaveChildren: true, defaultProps: { triggerText: "Open", side: "right" }, propsSchema: [
    { key: "triggerText", label: "Text nút mở", inputType: "text" },
    { key: "side", label: "Hướng mở", inputType: "select", options: ["top", "right", "bottom", "left"] },
  ]},
  { id: "shadcn.popover", title: "Popover", category: "Overlay", tags: ["feedback", "popover", "shadcn"], canHaveChildren: true, defaultProps: { triggerText: "Open" }, propsSchema: [
    { key: "triggerText", label: "Text nút mở", inputType: "text" },
  ]},
  { id: "shadcn.tooltip", title: "Tooltip", category: "Overlay", tags: ["feedback", "tooltip", "hint", "shadcn"], canHaveChildren: true, defaultProps: { text: "Tooltip text" }, propsSchema: [
    { key: "text", label: "Nội dung tooltip", inputType: "text" },
  ]},
  { id: "shadcn.toast", title: "Toast", category: "Overlay", tags: ["feedback", "toast", "notification", "shadcn"], canHaveChildren: false, defaultProps: { title: "Thông báo", description: "" }, propsSchema: [
    { key: "title", label: "Tiêu đề", inputType: "text" },
    { key: "description", label: "Mô tả", inputType: "text" },
  ]},

  // ── Data ──
  { id: "shadcn.table", title: "Table", category: "Data Display", tags: ["data", "table", "grid", "shadcn"], canHaveChildren: true, defaultProps: {}, propsSchema: [] },
  { id: "shadcn.progress", title: "Progress", category: "Data Display", tags: ["data", "progress", "loading", "shadcn"], canHaveChildren: false, defaultProps: { value: 50 }, propsSchema: [
    { key: "value", label: "Giá trị (%)", inputType: "number" },
  ]},
  { id: "shadcn.skeleton", title: "Skeleton", category: "Data Display", tags: ["data", "skeleton", "loading", "placeholder", "shadcn"], canHaveChildren: false, defaultProps: { width: 100, height: 20 }, propsSchema: [
    { key: "width", label: "Chiều rộng (px)", inputType: "number" },
    { key: "height", label: "Chiều cao (px)", inputType: "number" },
  ]},

  // ── Navigation ──
  { id: "shadcn.breadcrumb", title: "Breadcrumb", category: "Navigation", tags: ["navigation", "breadcrumb", "path", "shadcn"], canHaveChildren: true, defaultProps: {}, propsSchema: [] },
  { id: "shadcn.pagination", title: "Pagination", category: "Navigation", tags: ["navigation", "pagination", "pages", "shadcn"], canHaveChildren: false, defaultProps: { totalPages: 5, currentPage: 1 }, propsSchema: [
    { key: "totalPages", label: "Tổng số trang", inputType: "number" },
    { key: "currentPage", label: "Trang hiện tại", inputType: "number" },
  ]},
  { id: "shadcn.navigation-menu", title: "Navigation Menu", category: "Navigation", tags: ["navigation", "menu", "shadcn"], canHaveChildren: true, defaultProps: {}, propsSchema: [] },
  { id: "shadcn.menubar", title: "Menubar", category: "Navigation", tags: ["navigation", "menubar", "shadcn"], canHaveChildren: true, defaultProps: {}, propsSchema: [] },

  // ── Overlay ──
  { id: "shadcn.dropdown-menu", title: "Dropdown Menu", category: "Overlay", tags: ["overlay", "dropdown", "menu", "shadcn"], canHaveChildren: true, defaultProps: { triggerText: "Menu" }, propsSchema: [
    { key: "triggerText", label: "Text nút mở", inputType: "text" },
  ]},
  { id: "shadcn.context-menu", title: "Context Menu", category: "Overlay", tags: ["overlay", "context", "right-click", "shadcn"], canHaveChildren: true, defaultProps: {}, propsSchema: [] },
  { id: "shadcn.hover-card", title: "Hover Card", category: "Overlay", tags: ["overlay", "hover", "preview", "shadcn"], canHaveChildren: true, defaultProps: { triggerText: "Hover" }, propsSchema: [
    { key: "triggerText", label: "Text kích hoạt", inputType: "text" },
  ]},
];


export const shadcnNodes: NodeDefinition[] = rawShadcnNodes.map((d) => ({ ...d, nodeKind: "shadcn",version: 1 }));