import type { DefaultChildSpec, NodeCategory, NodeDefinition } from "@/core/types/node-definition.types";

type RawDef = Omit<NodeDefinition, "nodeKind">;

export const D = (count: number, create: (index: number) => DefaultChildSpec) =>
  Array.from({ length: count }, (_, index) => create(index + 1));
export const p = (text: string): DefaultChildSpec => ({ defId: "html.p", props: { text } });

export const txt = (
  id: string,
  title: string,
  parent: string | string[],
  text: string,
  category: NodeCategory
): RawDef => ({
  id,
  title,
  category,
  tags: [title.toLowerCase(), "shadcn"],
  canHaveChildren: false,
  defaultProps: { text },
  propsSchema: [{ key: "text", label: "Nội dung", inputType: "text" }],
  parentOnly: Array.isArray(parent) ? parent : [parent],
});

export const box = (
  id: string,
  title: string,
  parent: string | string[],
  category: NodeCategory,
  extra: Partial<RawDef> = {}
): RawDef => ({
  id,
  title,
  category,
  tags: [title.toLowerCase(), "shadcn"],
  canHaveChildren: true,
  defaultProps: {},
  propsSchema: [],
  parentOnly: Array.isArray(parent) ? parent : [parent],
  ...extra,
});

export const leaf = (
  id: string,
  title: string,
  parent: string,
  category: NodeCategory,
  extra: Partial<RawDef> = {}
): RawDef => ({
  id,
  title,
  category,
  tags: [title.toLowerCase(), "shadcn"],
  canHaveChildren: false,
  defaultProps: {},
  propsSchema: [],
  parentOnly: [parent],
  ...extra,
});

export const overlay = (
  id: string,
  title: string,
  category: NodeCategory,
  triggerText: string,
  children: DefaultChildSpec[],
  extra: Partial<RawDef> = {}
): RawDef => ({
  id,
  title,
  category,
  tier: "component",
  tags: [title.toLowerCase(), "overlay", "shadcn"],
  canHaveChildren: true,
  defaultProps: { triggerText },
  propsSchema: [{ key: "triggerText", label: "Text nút mở", inputType: "text" }],
  defaultChildren: children,
  ...extra,
});

export const clusterRawNodes: RawDef[] = [
  {
    id: "shadcn.tabs",
    title: "Tabs",
    category: "Navigation",
    tier: "component",
    tags: ["navigation", "tabs", "shadcn"],
    canHaveChildren: true,
    defaultProps: {},
    propsSchema: [],
    allowedChildIds: ["shadcn.tabs-list", "shadcn.tabs-content"],
    defaultChildren: [
      {
        defId: "shadcn.tabs-list",
        children: [
          { defId: "shadcn.tabs-trigger", props: { text: "Tab 1" } },
          { defId: "shadcn.tabs-trigger", props: { text: "Tab 2" } },
        ],
      },
      { defId: "shadcn.tabs-content", children: [{ defId: "html.p", props: { text: "Nội dung của Tab 1." } }] },
      { defId: "shadcn.tabs-content", children: [{ defId: "html.p", props: { text: "Nội dung của Tab 2." } }] },
    ],
  },
  {
    id: "shadcn.tabs-list",
    title: "Tabs List",
    category: "Navigation",
    tags: ["tabs"],
    canHaveChildren: true,
    defaultProps: {},
    propsSchema: [],
    parentOnly: ["shadcn.tabs"],
    allowedChildIds: ["shadcn.tabs-trigger"],
  },
  {
    id: "shadcn.tabs-trigger",
    title: "Tab",
    category: "Navigation",
    tags: ["tabs", "trigger"],
    canHaveChildren: false,
    defaultProps: { text: "Tab mới" },
    propsSchema: [{ key: "text", label: "Tiêu đề tab", inputType: "text" }],
    parentOnly: ["shadcn.tabs-list"],
  },
  {
    id: "shadcn.tabs-content",
    title: "Tab Content",
    category: "Navigation",
    tags: ["tabs", "content"],
    canHaveChildren: true,
    defaultProps: {},
    defaultStyle: { direction: "flex-col", gap: 2, padding: 2 },
    propsSchema: [],
    parentOnly: ["shadcn.tabs"],
    defaultChildren: [{ defId: "html.p", props: { text: "Nội dung tab mới." } }],
  },
  {
    id: "shadcn.accordion",
    title: "Accordion",
    category: "Layout",
    tier: "component",
    tags: ["layout", "accordion", "collapsible", "shadcn"],
    canHaveChildren: true,
    defaultProps: {},
    propsSchema: [],
    allowedChildIds: ["shadcn.accordion-item"],
    defaultChildren: [1, 2, 3].map((index) => ({
      defId: "shadcn.accordion-item",
      children: [
        { defId: "shadcn.accordion-trigger", props: { text: `Câu hỏi ${index}` } },
        {
          defId: "shadcn.accordion-content",
          children: [{ defId: "html.p", props: { text: `Câu trả lời ${index}.` } }],
        },
      ],
    })),
  },
  {
    id: "shadcn.accordion-item",
    title: "Accordion Item",
    category: "Layout",
    tags: ["accordion", "item"],
    canHaveChildren: true,
    defaultProps: {},
    propsSchema: [],
    parentOnly: ["shadcn.accordion"],
    allowedChildIds: ["shadcn.accordion-trigger", "shadcn.accordion-content"],
    defaultChildren: [
      { defId: "shadcn.accordion-trigger", props: { text: "Tiêu đề mới" } },
      { defId: "shadcn.accordion-content", children: [{ defId: "html.p", props: { text: "Nội dung mới." } }] },
    ],
  },
  {
    id: "shadcn.accordion-trigger",
    title: "Accordion Trigger",
    category: "Layout",
    tags: ["accordion", "trigger"],
    canHaveChildren: false,
    defaultProps: { text: "Tiêu đề" },
    propsSchema: [{ key: "text", label: "Tiêu đề", inputType: "text" }],
    parentOnly: ["shadcn.accordion-item"],
  },
  {
    id: "shadcn.accordion-content",
    title: "Accordion Content",
    category: "Layout",
    tags: ["accordion", "content"],
    canHaveChildren: true,
    defaultProps: {},
    defaultStyle: { direction: "flex-col", gap: 2 },
    propsSchema: [],
    parentOnly: ["shadcn.accordion-item"],
  },
  overlay("shadcn.dialog", "Dialog", "Overlay", "Mở hộp thoại", [
    { defId: "shadcn.dialog-title" },
    { defId: "shadcn.dialog-description" },
    { defId: "shadcn.dialog-footer", children: [{ defId: "shadcn.button", props: { text: "Lưu thay đổi" } }] },
  ]),
  txt("shadcn.dialog-title", "Dialog Title", "shadcn.dialog", "Tiêu đề hộp thoại", "Overlay"),
  txt("shadcn.dialog-description", "Dialog Description", "shadcn.dialog", "Mô tả ngắn cho hộp thoại này.", "Overlay"),
  box("shadcn.dialog-footer", "Dialog Footer", "shadcn.dialog", "Overlay"),

  overlay("shadcn.alert-dialog", "Alert Dialog", "Overlay", "Xóa", [
    { defId: "shadcn.alert-dialog-title" },
    { defId: "shadcn.alert-dialog-description" },
    {
      defId: "shadcn.alert-dialog-footer",
      children: [{ defId: "shadcn.alert-dialog-cancel" }, { defId: "shadcn.alert-dialog-action" }],
    },
  ]),
  txt("shadcn.alert-dialog-title", "Alert Title", "shadcn.alert-dialog", "Bạn có chắc chắn?", "Overlay"),
  txt(
    "shadcn.alert-dialog-description",
    "Alert Description",
    "shadcn.alert-dialog",
    "Hành động này không thể hoàn tác.",
    "Overlay"
  ),
  box("shadcn.alert-dialog-footer", "Alert Footer", "shadcn.alert-dialog", "Overlay"),
  txt("shadcn.alert-dialog-cancel", "Alert Cancel", "shadcn.alert-dialog-footer", "Hủy", "Overlay"),
  txt("shadcn.alert-dialog-action", "Alert Action", "shadcn.alert-dialog-footer", "Tiếp tục", "Overlay"),

  overlay("shadcn.sheet", "Sheet", "Overlay", "Mở panel", [
    { defId: "shadcn.sheet-title" },
    { defId: "shadcn.sheet-description" },
    p("Nội dung panel."),
  ], {
    defaultProps: { triggerText: "Mở panel", side: "right" },
    propsSchema: [
      { key: "triggerText", label: "Text nút mở", inputType: "text" },
      { key: "side", label: "Hướng mở", inputType: "select", options: ["top", "right", "bottom", "left"] },
    ],
  }),
  txt("shadcn.sheet-title", "Sheet Title", "shadcn.sheet", "Tiêu đề panel", "Overlay"),
  txt("shadcn.sheet-description", "Sheet Description", "shadcn.sheet", "Mô tả ngắn cho panel.", "Overlay"),

  overlay("shadcn.popover", "Popover", "Overlay", "Mở popover", [p("Nội dung popover.")]),
  overlay("shadcn.hover-card", "Hover Card", "Overlay", "Rê chuột vào đây", [p("Thông tin xem trước.")]),

  overlay("shadcn.dropdown-menu", "Dropdown Menu", "Overlay", "Menu", [
    { defId: "shadcn.dropdown-menu-label", props: { text: "Tài khoản" } },
    { defId: "shadcn.dropdown-menu-item", props: { text: "Hồ sơ" } },
    { defId: "shadcn.dropdown-menu-item", props: { text: "Cài đặt" } },
    { defId: "shadcn.dropdown-menu-separator" },
    { defId: "shadcn.dropdown-menu-item", props: { text: "Đăng xuất" } },
  ], {
    allowedChildIds: ["shadcn.dropdown-menu-label", "shadcn.dropdown-menu-item", "shadcn.dropdown-menu-separator"],
  }),
  txt("shadcn.dropdown-menu-label", "Menu Label", "shadcn.dropdown-menu", "Nhóm", "Overlay"),
  txt("shadcn.dropdown-menu-item", "Menu Item", "shadcn.dropdown-menu", "Mục mới", "Overlay"),
  leaf("shadcn.dropdown-menu-separator", "Menu Separator", "shadcn.dropdown-menu", "Overlay"),

  overlay("shadcn.context-menu", "Context Menu", "Overlay", "Chuột phải vào đây", [
    { defId: "shadcn.context-menu-item", props: { text: "Sao chép" } },
    { defId: "shadcn.context-menu-item", props: { text: "Dán" } },
    { defId: "shadcn.context-menu-separator" },
    { defId: "shadcn.context-menu-item", props: { text: "Xóa" } },
  ], {
    allowedChildIds: ["shadcn.context-menu-label", "shadcn.context-menu-item", "shadcn.context-menu-separator"],
  }),
  txt("shadcn.context-menu-label", "Context Label", "shadcn.context-menu", "Nhóm", "Overlay"),
  txt("shadcn.context-menu-item", "Context Item", "shadcn.context-menu", "Mục mới", "Overlay"),
  leaf("shadcn.context-menu-separator", "Context Separator", "shadcn.context-menu", "Overlay"),

  {
    id: "shadcn.menubar",
    title: "Menubar",
    category: "Navigation",
    tier: "component",
    tags: ["navigation", "menubar", "shadcn"],
    canHaveChildren: true,
    defaultProps: {},
    propsSchema: [],
    allowedChildIds: ["shadcn.menubar-menu"],
    defaultChildren: [
      {
        defId: "shadcn.menubar-menu",
        props: { title: "Tệp" },
        children: [
          { defId: "shadcn.menubar-item", props: { text: "Mới" } },
          { defId: "shadcn.menubar-item", props: { text: "Mở" } },
          { defId: "shadcn.menubar-separator" },
          { defId: "shadcn.menubar-item", props: { text: "Thoát" } },
        ],
      },
      {
        defId: "shadcn.menubar-menu",
        props: { title: "Chỉnh sửa" },
        children: [
          { defId: "shadcn.menubar-item", props: { text: "Hoàn tác" } },
          { defId: "shadcn.menubar-item", props: { text: "Làm lại" } },
        ],
      },
    ],
  },
  box("shadcn.menubar-menu", "Menubar Menu", "shadcn.menubar", "Navigation", {
    defaultProps: { title: "Menu" },
    propsSchema: [{ key: "title", label: "Tiêu đề menu", inputType: "text" }],
    allowedChildIds: ["shadcn.menubar-item", "shadcn.menubar-separator"],
    defaultChildren: [{ defId: "shadcn.menubar-item", props: { text: "Mục mới" } }],
  }),
  txt("shadcn.menubar-item", "Menubar Item", "shadcn.menubar-menu", "Mục mới", "Navigation"),
  leaf("shadcn.menubar-separator", "Menubar Separator", "shadcn.menubar-menu", "Navigation"),

  {
    id: "shadcn.breadcrumb",
    title: "Breadcrumb",
    category: "Navigation",
    tier: "component",
    tags: ["navigation", "breadcrumb", "path", "shadcn"],
    canHaveChildren: true,
    defaultProps: {},
    propsSchema: [],
    allowedChildIds: ["shadcn.breadcrumb-item", "shadcn.breadcrumb-page", "shadcn.breadcrumb-separator"],
    defaultChildren: [
      { defId: "shadcn.breadcrumb-item", props: { text: "Trang chủ", href: "/" } },
      { defId: "shadcn.breadcrumb-separator" },
      { defId: "shadcn.breadcrumb-item", props: { text: "Sản phẩm", href: "#" } },
      { defId: "shadcn.breadcrumb-separator" },
      { defId: "shadcn.breadcrumb-page", props: { text: "Chi tiết" } },
    ],
  },
  {
    ...txt("shadcn.breadcrumb-item", "Breadcrumb Link", "shadcn.breadcrumb", "Liên kết", "Navigation"),
    defaultProps: { text: "Liên kết", href: "#" },
    propsSchema: [
      { key: "text", label: "Nội dung", inputType: "text" },
      { key: "href", label: "Đường dẫn (href)", inputType: "text" },
    ],
  },
  txt("shadcn.breadcrumb-page", "Breadcrumb Page", "shadcn.breadcrumb", "Trang hiện tại", "Navigation"),
  leaf("shadcn.breadcrumb-separator", "Breadcrumb Separator", "shadcn.breadcrumb", "Navigation"),

  {
    id: "shadcn.navigation-menu",
    title: "Navigation Menu",
    category: "Navigation",
    tier: "component",
    tags: ["navigation", "menu", "shadcn"],
    canHaveChildren: true,
    defaultProps: {},
    propsSchema: [],
    allowedChildIds: ["shadcn.navigation-menu-link"],
    defaultChildren: [
      { defId: "shadcn.navigation-menu-link", props: { text: "Trang chủ" } },
      { defId: "shadcn.navigation-menu-link", props: { text: "Giới thiệu" } },
      { defId: "shadcn.navigation-menu-link", props: { text: "Liên hệ" } },
    ],
  },
  {
    ...txt("shadcn.navigation-menu-link", "Nav Link", "shadcn.navigation-menu", "Liên kết", "Navigation"),
    defaultProps: { text: "Liên kết", href: "#" },
    propsSchema: [
      { key: "text", label: "Nội dung", inputType: "text" },
      { key: "href", label: "Đường dẫn (href)", inputType: "text" },
    ],
  },

  {
    id: "shadcn.table",
    title: "Table",
    category: "Data Display",
    tier: "component",
    tags: ["data", "table", "grid", "shadcn"],
    canHaveChildren: true,
    defaultProps: {},
    propsSchema: [],
    allowedChildIds: ["shadcn.table-header", "shadcn.table-body"],
    defaultChildren: [
      {
        defId: "shadcn.table-header",
        children: [
          {
            defId: "shadcn.table-row",
            children: D(3, (index) => ({ defId: "shadcn.table-head", props: { text: `Cột ${index}` } })),
          },
        ],
      },
      {
        defId: "shadcn.table-body",
        children: D(3, (row) => ({
          defId: "shadcn.table-row",
          children: D(3, (column) => ({ defId: "shadcn.table-cell", props: { text: `Ô ${row}.${column}` } })),
        })),
      },
    ],
  },
  box("shadcn.table-header", "Table Header", "shadcn.table", "Data Display", {
    allowedChildIds: ["shadcn.table-row"],
  }),
  box("shadcn.table-body", "Table Body", "shadcn.table", "Data Display", {
    allowedChildIds: ["shadcn.table-row"],
  }),
  box("shadcn.table-row", "Table Row", ["shadcn.table-header", "shadcn.table-body"], "Data Display", {
    allowedChildIds: ["shadcn.table-head", "shadcn.table-cell"],
    defaultChildren: D(3, (index) => ({ defId: "shadcn.table-cell", props: { text: `Ô ${index}` } })),
  }),
  txt("shadcn.table-head", "Table Head", "shadcn.table-row", "Tiêu đề", "Data Display"),
  txt("shadcn.table-cell", "Table Cell", "shadcn.table-row", "Ô", "Data Display"),

  {
    id: "shadcn.collapsible",
    title: "Collapsible",
    category: "Layout",
    tier: "component",
    tags: ["layout", "collapsible", "toggle", "shadcn"],
    canHaveChildren: true,
    defaultProps: { defaultOpen: true },
    propsSchema: [{ key: "defaultOpen", label: "Mở mặc định", inputType: "checkbox" }],
    allowedChildIds: ["shadcn.collapsible-trigger", "shadcn.collapsible-content"],
    defaultChildren: [
      { defId: "shadcn.collapsible-trigger" },
      { defId: "shadcn.collapsible-content", children: [p("Nội dung có thể thu gọn.")] },
    ],
  },
  txt("shadcn.collapsible-trigger", "Collapsible Trigger", "shadcn.collapsible", "Xem thêm", "Layout"),
  box("shadcn.collapsible-content", "Collapsible Content", "shadcn.collapsible", "Layout"),

  {
    id: "shadcn.resizable",
    title: "Resizable",
    category: "Layout",
    tier: "component",
    tags: ["layout", "resizable", "panel", "shadcn"],
    canHaveChildren: true,
    defaultProps: { direction: "horizontal" },
    propsSchema: [
      { key: "direction", label: "Hướng chia", inputType: "select", options: ["horizontal", "vertical"] },
    ],
    allowedChildIds: ["shadcn.resizable-panel", "shadcn.resizable-handle"],
    defaultChildren: [
      { defId: "shadcn.resizable-panel", children: [p("Panel 1")] },
      { defId: "shadcn.resizable-handle" },
      { defId: "shadcn.resizable-panel", children: [p("Panel 2")] },
    ],
  },
  box("shadcn.resizable-panel", "Resizable Panel", "shadcn.resizable", "Layout", {
    defaultProps: { defaultSize: 50 },
    propsSchema: [{ key: "defaultSize", label: "Kích thước (%)", inputType: "number" }],
    defaultStyle: { direction: "flex-col", gap: 2, padding: 4 },
  }),
  leaf("shadcn.resizable-handle", "Resizable Handle", "shadcn.resizable", "Layout"),
];
