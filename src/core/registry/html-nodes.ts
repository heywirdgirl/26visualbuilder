
// core/registry/html-nodes.ts

import { NodeDefinition } from "@/core/types/node-definition.types";

export const containerDefaults = { direction: "flex-col", gap: 4, padding: 4 };

export const htmlNodes: NodeDefinition[] = [
  // ── Layout ──
  { id: "html.div", title: "Div", category: "Layout", tags: ["layout", "container", "flex", "div"], canHaveChildren: true, defaultProps: containerDefaults, propsSchema: [] },
  { id: "html.section", title: "Section", category: "Layout", tags: ["layout", "container", "section"], canHaveChildren: true, defaultProps: containerDefaults, propsSchema: [] },
  { id: "html.main", title: "Main", category: "Layout", tags: ["layout", "container", "main", "content"], canHaveChildren: true, defaultProps: containerDefaults, propsSchema: [] },
  { id: "html.header", title: "Header", category: "Layout", tags: ["layout", "container", "header", "top"], canHaveChildren: true, defaultProps: containerDefaults, propsSchema: [] },
  { id: "html.footer", title: "Footer", category: "Layout", tags: ["layout", "container", "footer", "bottom"], canHaveChildren: true, defaultProps: containerDefaults, propsSchema: [] },
  { id: "html.aside", title: "Aside", category: "Layout", tags: ["layout", "container", "aside", "sidebar"], canHaveChildren: true, defaultProps: containerDefaults, propsSchema: [] },
  { id: "html.article", title: "Article", category: "Layout", tags: ["layout", "container", "article", "content"], canHaveChildren: true, defaultProps: containerDefaults, propsSchema: [] },

  // ── Typography ──
  { id: "html.h1", title: "Heading 1", category: "Typography", tags: ["typography", "heading", "title", "h1"], canHaveChildren: false, defaultProps: { text: "Heading 1" }, propsSchema: [{ key: "text", label: "Nội dung", inputType: "text" }] },
  { id: "html.h2", title: "Heading 2", category: "Typography", tags: ["typography", "heading", "title", "h2"], canHaveChildren: false, defaultProps: { text: "Heading 2" }, propsSchema: [{ key: "text", label: "Nội dung", inputType: "text" }] },
  { id: "html.h3", title: "Heading 3", category: "Typography", tags: ["typography", "heading", "title", "h3"], canHaveChildren: false, defaultProps: { text: "Heading 3" }, propsSchema: [{ key: "text", label: "Nội dung", inputType: "text" }] },
  { id: "html.p", title: "Paragraph", category: "Typography", tags: ["typography", "paragraph", "text"], canHaveChildren: false, defaultProps: { text: "Đoạn văn bản" }, propsSchema: [{ key: "text", label: "Nội dung", inputType: "textarea" }] },
  { id: "html.span", title: "Span", category: "Typography", tags: ["typography", "text", "inline"], canHaveChildren: false, defaultProps: { text: "Span text" }, propsSchema: [{ key: "text", label: "Nội dung", inputType: "text" }] },
  { id: "html.label", title: "Label (HTML)", category: "Typography", tags: ["typography", "form", "label"], canHaveChildren: false, defaultProps: { text: "Label", htmlFor: "" }, propsSchema: [{ key: "text", label: "Nội dung", inputType: "text" }, { key: "htmlFor", label: "Gắn với (for)", inputType: "text" }] },

  // ── Form ──
  { id: "html.button", title: "Button (HTML)", category: "Form", tags: ["form", "action", "button", "click"], canHaveChildren: false, defaultProps: { text: "Button" }, propsSchema: [{ key: "text", label: "Nội dung", inputType: "text" }] },
  { id: "html.input", title: "Input (HTML)", category: "Form", tags: ["form", "input", "field", "textbox"], canHaveChildren: false, defaultProps: { placeholder: "Nhập nội dung...", type: "text" }, propsSchema: [{ key: "placeholder", label: "Placeholder", inputType: "text" }, { key: "type", label: "Loại input", inputType: "select", options: ["text", "email", "password", "number"] }] },
  { id: "html.textarea", title: "Textarea (HTML)", category: "Form", tags: ["form", "input", "multiline", "textbox"], canHaveChildren: false, defaultProps: { placeholder: "Nhập nội dung..." }, propsSchema: [{ key: "placeholder", label: "Placeholder", inputType: "text" }] },
  { id: "html.select", title: "Select", category: "Form", tags: ["form", "dropdown", "select", "picker"], canHaveChildren: false, defaultProps: { placeholder: "Chọn..." }, propsSchema: [{ key: "placeholder", label: "Placeholder", inputType: "text" }] },
  { id: "html.checkbox", title: "Checkbox (HTML)", category: "Form", tags: ["form", "checkbox", "toggle"], canHaveChildren: false, defaultProps: { label: "Checkbox", checked: false }, propsSchema: [{ key: "label", label: "Nội dung", inputType: "text" }, { key: "checked", label: "Đã chọn", inputType: "checkbox" }] },
  { id: "html.radio", title: "Radio", category: "Form", tags: ["form", "radio", "choice"], canHaveChildren: false, defaultProps: { label: "Radio", checked: false }, propsSchema: [{ key: "label", label: "Nội dung", inputType: "text" }, { key: "checked", label: "Đã chọn", inputType: "checkbox" }] },
  { id: "html.switch", title: "Switch (HTML)", category: "Form", tags: ["form", "switch", "toggle"], canHaveChildren: false, defaultProps: { label: "Switch", checked: false }, propsSchema: [{ key: "label", label: "Nội dung", inputType: "text" }, { key: "checked", label: "Đã chọn", inputType: "checkbox" }] },

  // ── List ──
  { id: "html.ul", title: "Unordered List", category: "List", tags: ["list", "unordered", "container"], canHaveChildren: true, defaultProps: { direction: "flex-col", gap: 1 }, propsSchema: [] },
  { id: "html.ol", title: "Ordered List", category: "List", tags: ["list", "ordered", "container"], canHaveChildren: true, defaultProps: { direction: "flex-col", gap: 1 }, propsSchema: [] },
  { id: "html.li", title: "List Item", category: "List", tags: ["list", "item", "container"], canHaveChildren: true, defaultProps: { direction: "flex-row", gap: 2 }, propsSchema: [] },

  // ── Media ──
  { id: "html.img", title: "Image", category: "Media", tags: ["media", "image", "picture"], canHaveChildren: false, defaultProps: { src: "https://placehold.co/150", alt: "Hình ảnh" }, propsSchema: [{ key: "src", label: "Đường dẫn ảnh", inputType: "text" }, { key: "alt", label: "Alt text", inputType: "text" }] },
  { id: "html.icon", title: "Icon", category: "Media", tags: ["media", "icon", "lucide"], canHaveChildren: false, defaultProps: { name: "Star", size: 24 }, propsSchema: [{ key: "name", label: "Tên icon (lucide)", inputType: "text" }, { key: "size", label: "Kích thước", inputType: "number" }] },
  { id: "html.separator", title: "Separator (HTML)", category: "Media", tags: ["media", "divider", "line", "separator"], canHaveChildren: false, defaultProps: { orientation: "horizontal" }, propsSchema: [{ key: "orientation", label: "Hướng", inputType: "select", options: ["horizontal", "vertical"] }] },

  // ── Navigation ──
  { id: "html.nav", title: "Nav", category: "Navigation", tags: ["navigation", "menu", "container"], canHaveChildren: true, defaultProps: { direction: "flex-row", gap: 4 }, propsSchema: [] },
  { id: "html.a", title: "Link", category: "Navigation", tags: ["navigation", "link", "anchor"], canHaveChildren: true, defaultProps: { direction: "flex-row", gap: 1, href: "#" }, propsSchema: [{ key: "href", label: "Đường dẫn (href)", inputType: "text" }] },
];