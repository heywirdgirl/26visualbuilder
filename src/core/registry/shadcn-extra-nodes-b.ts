import type { NodeDefinition } from "@/core/types/node-definition.types";
import { box, leaf, overlay, p, txt } from "./shadcn-cluster-nodes";

type RawDef = Omit<NodeDefinition, "nodeKind">;

export const extraRawNodesB: RawDef[] = [
  {
    id: "shadcn.input-otp",
    title: "Input OTP",
    category: "Form",
    tags: ["form", "otp", "code", "verify", "pin", "shadcn"],
    canHaveChildren: false,
    defaultProps: { length: "6", split: true },
    propsSchema: [
      { key: "length", label: "Số ký tự", inputType: "select", options: ["4", "6", "8"] },
      { key: "split", label: "Chia 2 nhóm", inputType: "checkbox" },
    ],
  },
  {
    id: "shadcn.calendar",
    title: "Calendar",
    category: "Data Display",
    tags: ["data", "calendar", "date", "picker", "shadcn"],
    canHaveChildren: false,
    defaultProps: { showOutsideDays: true },
    propsSchema: [
      { key: "showOutsideDays", label: "Hiện ngày tháng khác", inputType: "checkbox" },
    ],
  },
  {
    id: "shadcn.carousel",
    title: "Carousel",
    category: "Media",
    tier: "component",
    tags: ["media", "carousel", "slider", "slides", "gallery", "shadcn"],
    canHaveChildren: true,
    defaultProps: {},
    propsSchema: [],
    allowedChildIds: ["shadcn.carousel-item"],
    defaultChildren: [1, 2, 3].map((index) => ({
      defId: "shadcn.carousel-item",
      children: [
        {
          defId: "shadcn.card",
          children: [{ defId: "html.h3", props: { text: `Slide ${index}` } }],
        },
      ],
    })),
  },
  box("shadcn.carousel-item", "Carousel Slide", "shadcn.carousel", "Media", {
    defaultStyle: { direction: "flex-col", gap: 2 },
    defaultChildren: [
      { defId: "shadcn.card", children: [{ defId: "html.h3", props: { text: "Slide mới" } }] },
    ],
  }),
  {
    id: "shadcn.command",
    title: "Command",
    category: "Navigation",
    tier: "component",
    tags: ["navigation", "command", "search", "palette", "combobox", "shadcn"],
    canHaveChildren: true,
    defaultProps: {},
    propsSchema: [],
    allowedChildIds: ["shadcn.command-input", "shadcn.command-list"],
    defaultChildren: [
      { defId: "shadcn.command-input" },
      {
        defId: "shadcn.command-list",
        children: [
          {
            defId: "shadcn.command-group",
            props: { heading: "Gợi ý" },
            children: [
              { defId: "shadcn.command-item", props: { text: "Lịch" } },
              { defId: "shadcn.command-item", props: { text: "Tìm emoji" } },
              { defId: "shadcn.command-item", props: { text: "Máy tính" } },
            ],
          },
          { defId: "shadcn.command-separator" },
          {
            defId: "shadcn.command-group",
            props: { heading: "Cài đặt" },
            children: [
              { defId: "shadcn.command-item", props: { text: "Hồ sơ" } },
              { defId: "shadcn.command-item", props: { text: "Thanh toán" } },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "shadcn.command-input",
    title: "Command Input",
    category: "Navigation",
    tags: ["command", "input"],
    canHaveChildren: false,
    defaultProps: { placeholder: "Gõ lệnh hoặc tìm kiếm..." },
    propsSchema: [{ key: "placeholder", label: "Placeholder", inputType: "text" }],
    parentOnly: ["shadcn.command"],
  },
  box("shadcn.command-list", "Command List", "shadcn.command", "Navigation", {
    allowedChildIds: ["shadcn.command-group", "shadcn.command-empty", "shadcn.command-separator"],
  }),
  txt("shadcn.command-empty", "Command Empty", "shadcn.command-list", "Không tìm thấy kết quả.", "Navigation"),
  box("shadcn.command-group", "Command Group", "shadcn.command-list", "Navigation", {
    defaultProps: { heading: "Nhóm" },
    propsSchema: [{ key: "heading", label: "Tiêu đề nhóm", inputType: "text" }],
    allowedChildIds: ["shadcn.command-item"],
    defaultChildren: [{ defId: "shadcn.command-item", props: { text: "Mục mới" } }],
  }),
  txt("shadcn.command-item", "Command Item", "shadcn.command-group", "Mục mới", "Navigation"),
  leaf("shadcn.command-separator", "Command Separator", "shadcn.command-list", "Navigation"),
  overlay("shadcn.drawer", "Drawer", "Overlay", "Mở drawer", [
    {
      defId: "shadcn.drawer-header",
      children: [{ defId: "shadcn.drawer-title" }, { defId: "shadcn.drawer-description" }],
    },
    p("Nội dung drawer."),
    {
      defId: "shadcn.drawer-footer",
      children: [{ defId: "shadcn.button", props: { text: "Xác nhận" } }],
    },
  ]),
  box("shadcn.drawer-header", "Drawer Header", "shadcn.drawer", "Overlay", {
    allowedChildIds: ["shadcn.drawer-title", "shadcn.drawer-description"],
    defaultChildren: [{ defId: "shadcn.drawer-title" }, { defId: "shadcn.drawer-description" }],
  }),
  txt("shadcn.drawer-title", "Drawer Title", "shadcn.drawer-header", "Tiêu đề drawer", "Overlay"),
  txt("shadcn.drawer-description", "Drawer Description", "shadcn.drawer-header", "Mô tả ngắn cho drawer.", "Overlay"),
  box("shadcn.drawer-footer", "Drawer Footer", "shadcn.drawer", "Overlay"),
];
