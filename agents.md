Gần đủ. Đủ để làm toàn bộ v6.5 (chuẩn hóa `category`, gán `tier`, bổ sung icon). Chỉ còn thiếu một phần nhỏ về icon trong trình duyệt đầy đủ (mục 5 bên dưới).

Một phát hiện tốt từ `add-node-browser.tsx`: nó đã lọc bằng `canContain(parentDef, kind, def)` nên `parentOnly` và `allowedChildIds` của v6.1 **đã có tác dụng ở đây**, không cần vá thêm.

# v6.5: Chuẩn hóa category, tier, icon

## 1. `node-definition.types.ts`: thêm category "Feedback"

```ts
export type NodeCategory =
  | "Layout" | "Typography" | "Form" | "List" | "Media"
  | "Navigation" | "Overlay" | "Data Display"
  | "Feedback"   // 👈 mới: Alert, Toast, Progress, Skeleton
  | "Templates" | "System";
```

## 2. Sửa category cho 8 node

Chỉ cần đổi giá trị `category` trên đúng các dòng này:

| Node | Từ | Sang | Lý do |
|---|---|---|---|
| `html.label` | Typography | **Form** | Label đi cùng input |
| `shadcn.label` | Typography | **Form** | Như trên |
| `html.separator` | Media | **Layout** | Là đường phân cách bố cục |
| `shadcn.separator` | Media | **Layout** | Như trên |
| `shadcn.alert` | Data Display | **Feedback** | Là thông báo |
| `shadcn.toast` | Overlay | **Feedback** | Như trên |
| `shadcn.progress` | Data Display | **Feedback** | Trạng thái tải |
| `shadcn.skeleton` | Data Display | **Feedback** | Như trên |

Trong `add-node-browser.tsx`, thêm `"Feedback"` vào `CATEGORIES`:

```ts
const CATEGORIES: NodeCategory[] = [
  "Layout", "Typography", "Form", "List", "Media",
  "Navigation", "Overlay", "Data Display", "Feedback", "Templates",
];
```

## 3. Gán `tier` cho cả 65 node cũ (không sửa từng dòng)

Chỉ đổi dòng `.map` cuối mỗi file registry. Node nào đã ghi `tier` rõ (Tabs, Card, Dialog...) giữ nguyên, các node còn lại mặc định là `element`.

**`html-nodes.ts`:**

```ts
export const htmlNodes: NodeDefinition[] = rawHtmlNodes.map((d) => ({
  ...d,
  tier: d.tier ?? "element",
  nodeKind: "html",
}));
```

**`shadcn-nodes.ts`:**

```ts
export const shadcnNodes: NodeDefinition[] = [...rawShadcnNodes, ...clusterRawNodes].map((d) => ({
  ...d,
  tier: d.tier ?? "element",
  nodeKind: "shadcn" as const,
  version: 1,
}));
```

Thêm riêng `tier: "component"` cho `shadcn.tooltip` (vì nó đã có nút mẫu bên trong từ v6.4):

```ts
{ id: "shadcn.tooltip", title: "Tooltip", category: "Overlay", tier: "component", ... }
```

Các node con của cụm (có `parentOnly`) cũng nhận `element` mặc định. Không sao, vì ở v6.8 mình sẽ **loại mọi node có `parentOnly` khỏi 3 tab tầng**, chỉ để chúng hiện theo node cha đang chọn.

## 4. `node-icons.ts`: icon cho node con của cụm

Thêm 4 icon vào import:

```ts
import { /* ...giữ nguyên các icon cũ... */ X, Check, Rows3, GripVertical } from "lucide-react";
```

Thêm bảng ngoại lệ và quy tắc theo hậu tố. Đặt sau `NODE_ICONS`, thay hàm `getNodeIcon`:

```ts
const PART_ICONS: Record<string, LucideIcon> = {
  "shadcn.alert-dialog-cancel": X,
  "shadcn.alert-dialog-action": Check,
  "shadcn.breadcrumb-item": LinkIcon,
  "shadcn.breadcrumb-page": Type,
  "shadcn.breadcrumb-separator": ChevronsRight,
  "shadcn.menubar-menu": Menu,
  "shadcn.tabs-list": AlignJustify,
  "shadcn.tabs-trigger": Tag,
  "shadcn.tabs-content": Square,
  "shadcn.accordion-item": Square,
  "shadcn.accordion-trigger": ChevronDown,
  "shadcn.accordion-content": Square,
  "shadcn.collapsible-trigger": ChevronDown,
  "shadcn.collapsible-content": Square,
  "shadcn.resizable-panel": Square,
  "shadcn.resizable-handle": GripVertical,
  "shadcn.table-header": PanelTop,
  "shadcn.table-body": Rows3,
  "shadcn.table-row": Rows3,
  "shadcn.table-head": Tag,
  "shadcn.table-cell": Square,
};

// Hậu tố chung cho các phần của cụm overlay/menu
const SUFFIX_ICONS: [string, LucideIcon][] = [
  ["-title", Heading2],
  ["-description", Pilcrow],
  ["-footer", PanelBottom],
  ["-separator", SeparatorHorizontal],
  ["-label", Tag],
  ["-link", LinkIcon],
  ["-item", Dot],
];

export function getNodeIcon(id: string): LucideIcon {
  const exact = NODE_ICONS[id] ?? PART_ICONS[id];
  if (exact) return exact;
  const hit = SUFFIX_ICONS.find(([suffix]) => id.endsWith(suffix));
  return hit ? hit[1] : Box;
}
```

Bảng `PART_ICONS` đứng trước quy tắc hậu tố nên `breadcrumb-item` và `accordion-item` không bị `-item → Dot` đè lên. Từ nay node cụm mới thêm vào cũng tự có icon hợp lý nhờ hậu tố, không cần sửa file này mỗi lần.

## 5. Còn một lỗi nhỏ ở trình duyệt đầy đủ

`add-node-browser.tsx` đang truyền `iconName={def.icon}`, mà `def.icon` **không node nào có** (không định nghĩa trong registry). Nên các dòng trong trình duyệt đầy đủ có khả năng chỉ hiện icon mặc định, khác với lưới nhanh đã có icon đúng. Để sửa chính xác mình cần xem **`node-list-row.tsx`** (không biết nó nhận `iconName` kiểu chuỗi rồi tự tra, hay nhận được component). Việc này thuộc v6.8, nên bạn gửi lúc đó cũng được.

## Kiểm tra: mốc MVP+

1. Build không lỗi TypeScript (`"Feedback"` được chấp nhận trong `NodeCategory`).
2. Trình duyệt đầy đủ (`Duyệt tất cả theo danh mục...`): thấy mục **Feedback** chứa Alert, Toast, Progress, Skeleton. Alert và Separator không còn nằm sai chỗ.
3. Chọn `Tabs`: lưới nhanh hiện ô **Tabs List** và **Tab Content** với icon riêng. Chọn `Table Row`: hiện **Table Head** và **Table Cell**.
4. Chọn `Page`: không thấy node con nào lẫn vào (Tab, Menu Item, Table Cell...).
5. Thêm lần lượt Tabs, Accordion, Table, Dialog, Breadcrumb vào một trang: mọi cụm đều có nội dung mẫu, sửa chữ được, mở **Code** ra JSX đúng.

Qua được 5 bước này là bạn chạm **mốc MVP+** của kế hoạch v6: node cũ đã hoàn thiện nội dung, phân loại sạch, có tier. Từ đây có thể dừng để dùng thử, hoặc tiếp tục **v6.6** (35 node HTML mới). Với v6.6 mình không cần xem thêm file nào nữa, vì renderer HTML hiện dựa trên `containerEntry`/`textTagEntry` nên mỗi node chỉ thêm một dòng định nghĩa và một dòng renderer. Bạn báo kết quả v6.5, rồi mình làm tiếp.

# v6.6: 34 node HTML mới

Bản này thêm 34 node HTML mới, chia 4 nhóm:

- **Chữ**: h4, h5, h6, strong, em, small, mark, code, kbd, blockquote, pre, address, time.
- **Cụm**: form, fieldset, figure, details, table, dl.
- **Phần con của cụm**: legend, figcaption, summary, thead, tbody, tr, th, td, dt, dd.
- **Còn lại**: hr, video, audio, iframe, progress.

Mình tách thành 2 file mới như ở v6.3, nên các file cũ chỉ sửa vài dòng. Không cần cài thêm gì vì tất cả đều là thẻ HTML thuần.

## 1. File mới `core/registry/html-extra-nodes.ts`

```ts
import { NodeDefinition, NodeCategory } from "@/core/types/node-definition.types";

type RawDef = Omit<NodeDefinition, "nodeKind">;

// Node lá có chữ
const text = (
  name: string, title: string, category: NodeCategory, defaultText: string,
  tags: string[] = [], multiline = false, extra: Partial<RawDef> = {}
): RawDef => ({
  id: `html.${name}`, title, category, tags: [name, ...tags], canHaveChildren: false,
  defaultProps: { text: defaultText },
  propsSchema: [{ key: "text", label: "Nội dung", inputType: multiline ? "textarea" : "text" }],
  ...extra,
});

// Node chứa con
const box = (
  name: string, title: string, category: NodeCategory,
  tags: string[] = [], extra: Partial<RawDef> = {}
): RawDef => ({
  id: `html.${name}`, title, category, tags: [name, ...tags], canHaveChildren: true,
  defaultProps: {}, propsSchema: [], ...extra,
});

// Ô bảng: viền mỏng để nhìn thấy trên canvas
const cellStyle = { padding: 2, borderWidth: 1 as const, borderColor: "zinc-300" };

export const htmlExtraRawNodes: RawDef[] = [
  // ── Typography ──
  text("h4", "Heading 4", "Typography", "Heading 4", ["heading", "title"]),
  text("h5", "Heading 5", "Typography", "Heading 5", ["heading", "title"]),
  text("h6", "Heading 6", "Typography", "Heading 6", ["heading", "title"]),
  text("strong", "Bold", "Typography", "Chữ đậm", ["bold", "strong"]),
  text("em", "Italic", "Typography", "Chữ nghiêng", ["italic", "emphasis"]),
  text("small", "Small", "Typography", "Chữ nhỏ", ["small", "note"]),
  text("mark", "Highlight", "Typography", "Chữ nổi bật", ["highlight", "mark"]),
  text("code", "Code", "Typography", "console.log()", ["code", "inline"]),
  text("kbd", "Keyboard", "Typography", "Ctrl + K", ["keyboard", "shortcut"]),
  text("blockquote", "Quote", "Typography", "Một câu trích dẫn đáng nhớ.", ["quote", "blockquote"], true),
  text("pre", "Preformatted", "Typography", "dòng 1\ndòng 2", ["code", "block", "pre"], true),
  text("address", "Address", "Typography", "123 Đường ABC\nHà Nội", ["address", "contact"], true),
  {
    id: "html.time", title: "Time", category: "Typography", tags: ["time", "date"],
    canHaveChildren: false,
    defaultProps: { text: "15/10/2026", dateTime: "2026-10-15" },
    propsSchema: [
      { key: "text", label: "Nội dung hiển thị", inputType: "text" },
      { key: "dateTime", label: "Giá trị (YYYY-MM-DD)", inputType: "text" },
    ],
  },

  // ── Form: form, fieldset ──
  box("form", "Form", "Form", ["form", "submit"], {
    tier: "component",
    defaultChildren: [
      { defId: "html.label", props: { text: "Email" } },
      { defId: "html.input", props: { placeholder: "email@example.com", type: "email" } },
      { defId: "html.button", props: { text: "Gửi" } },
    ],
  }),
  box("fieldset", "Fieldset", "Form", ["form", "group"], {
    tier: "component",
    defaultChildren: [
      { defId: "html.legend" },
      { defId: "html.input", props: { placeholder: "Nhập nội dung..." } },
    ],
  }),
  text("legend", "Legend", "Form", "Thông tin cá nhân", [], false, { parentOnly: ["html.fieldset"] }),

  // ── Media: figure ──
  box("figure", "Figure", "Media", ["figure", "image", "caption"], {
    tier: "component",
    defaultChildren: [{ defId: "html.img" }, { defId: "html.figcaption" }],
  }),
  text("figcaption", "Figcaption", "Media", "Chú thích ảnh", [], false, { parentOnly: ["html.figure"] }),

  // ── Layout: details, hr ──
  box("details", "Details", "Layout", ["details", "toggle", "collapse"], {
    tier: "component",
    defaultChildren: [
      { defId: "html.summary" },
      { defId: "html.p", props: { text: "Nội dung ẩn, bấm tiêu đề để mở." } },
    ],
  }),
  text("summary", "Summary", "Layout", "Bấm để xem thêm", [], false, { parentOnly: ["html.details"] }),
  {
    id: "html.hr", title: "Horizontal Rule", category: "Layout", tags: ["hr", "divider", "line"],
    canHaveChildren: false, defaultProps: {}, propsSchema: [],
  },

  // ── List: dl ──
  box("dl", "Description List", "List", ["description", "glossary"], {
    tier: "component",
    allowedChildIds: ["html.dt", "html.dd"],
    defaultStyle: { direction: "flex-col", gap: 1 },
    defaultChildren: [
      { defId: "html.dt", props: { text: "Thuật ngữ 1" } },
      { defId: "html.dd", props: { text: "Giải thích cho thuật ngữ 1." } },
      { defId: "html.dt", props: { text: "Thuật ngữ 2" } },
      { defId: "html.dd", props: { text: "Giải thích cho thuật ngữ 2." } },
    ],
  }),
  text("dt", "Term", "List", "Thuật ngữ", [], false, { parentOnly: ["html.dl"] }),
  text("dd", "Definition", "List", "Giải thích", [], false, { parentOnly: ["html.dl"] }),

  // ── Data Display: table ──
  box("table", "Table (HTML)", "Data Display", ["table", "grid", "data"], {
    tier: "component",
    allowedChildIds: ["html.thead", "html.tbody"],
    defaultStyle: { width: "full" },
    defaultChildren: [
      { defId: "html.thead", children: [
        { defId: "html.tr", children: [1, 2, 3].map((i) => ({ defId: "html.th", props: { text: `Cột ${i}` } })) },
      ]},
      { defId: "html.tbody", children: [1, 2].map((r) => ({
        defId: "html.tr",
        children: [1, 2, 3].map((c) => ({ defId: "html.td", props: { text: `Ô ${r}.${c}` } })),
      }))},
    ],
  }),
  box("thead", "Table Head Group", "Data Display", ["thead"], { parentOnly: ["html.table"], allowedChildIds: ["html.tr"] }),
  box("tbody", "Table Body Group", "Data Display", ["tbody"], { parentOnly: ["html.table"], allowedChildIds: ["html.tr"] }),
  box("tr", "Table Row (HTML)", "Data Display", ["tr", "row"], {
    parentOnly: ["html.thead", "html.tbody"],
    allowedChildIds: ["html.th", "html.td"],
    defaultChildren: [1, 2, 3].map((i) => ({ defId: "html.td", props: { text: `Ô ${i}` } })),
  }),
  text("th", "Header Cell", "Data Display", "Tiêu đề", ["th", "cell"], false, {
    parentOnly: ["html.tr"],
    defaultStyle: { ...cellStyle, fontWeight: "semibold", textAlign: "left" },
  }),
  text("td", "Cell", "Data Display", "Ô", ["td", "cell"], false, {
    parentOnly: ["html.tr"],
    defaultStyle: cellStyle,
  }),

  // ── Media: video, audio, iframe ──
  {
    id: "html.video", title: "Video", category: "Media", tags: ["video", "media", "player"],
    canHaveChildren: false,
    defaultProps: { src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4", controls: true },
    propsSchema: [
      { key: "src", label: "Đường dẫn video", inputType: "text" },
      { key: "controls", label: "Hiện điều khiển", inputType: "checkbox" },
    ],
  },
  {
    id: "html.audio", title: "Audio", category: "Media", tags: ["audio", "media", "sound", "player"],
    canHaveChildren: false,
    defaultProps: { src: "https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3", controls: true },
    propsSchema: [
      { key: "src", label: "Đường dẫn audio", inputType: "text" },
      { key: "controls", label: "Hiện điều khiển", inputType: "checkbox" },
    ],
  },
  {
    id: "html.iframe", title: "Iframe", category: "Media", tags: ["iframe", "embed", "website"],
    canHaveChildren: false,
    defaultProps: { src: "https://example.com", title: "Trang nhúng" },
    propsSchema: [
      { key: "src", label: "Đường dẫn trang", inputType: "text" },
      { key: "title", label: "Tiêu đề (accessibility)", inputType: "text" },
    ],
  },

  // ── Feedback: progress ──
  {
    id: "html.progress", title: "Progress (HTML)", category: "Feedback", tags: ["progress", "loading", "bar"],
    canHaveChildren: false,
    defaultProps: { value: 50, max: 100 },
    propsSchema: [
      { key: "value", label: "Giá trị", inputType: "number" },
      { key: "max", label: "Tối đa", inputType: "number" },
    ],
  },
];
```

## 2. `html-nodes.ts`: sửa dòng cuối

```ts
import { htmlExtraRawNodes } from "./html-extra-nodes";

export const htmlNodes: NodeDefinition[] = [...rawHtmlNodes, ...htmlExtraRawNodes].map((d) => ({
  ...d,
  tier: d.tier ?? "element",
  nodeKind: "html",
}));
```

(`html-extra-nodes.ts` không import ngược lại file này, nên không bị vòng phụ thuộc.)

## 3. `cluster-renderers.tsx`: thêm `export` cho 3 helper

Chỉ thêm từ khóa `export` trước ba hàm đã có từ v6.3:

```tsx
export function textEntry(...) { ... }
export function boxEntry(...) { ... }
export function leafEntry(...) { ... }
```

## 4. File mới `features/canvas-preview/constants/html-extra-renderers.tsx`

```tsx
import React from "react";
import type { RendererEntry } from "./renderer-map";
import { textEntry, boxEntry, leafEntry } from "./cluster-renderers";
import { cn } from "@/core/utils/cn";
import { escapeAttr } from "@/core/utils/escape-jsx-text";
import { TreeNode } from "@/core/types/builder.types";

const prop = (node: TreeNode, key: string, fallback = "") =>
  String((node.props as Record<string, unknown>)[key] ?? fallback);
const classAttr = (c: string) => (c ? ` className="${escapeAttr(c)}"` : "");

// Không thêm class nền → code xuất ra khớp đúng canvas
const t = (tag: string) => textEntry(tag, tag, "");
const b = (tag: string) => boxEntry(tag, tag, "");

export const htmlExtraRenderers: Record<string, RendererEntry> = {
  // ══ Typography ══
  "html.h4": t("h4"), "html.h5": t("h5"), "html.h6": t("h6"),
  "html.strong": t("strong"), "html.em": t("em"), "html.small": t("small"),
  "html.mark": t("mark"), "html.code": t("code"), "html.kbd": t("kbd"),
  "html.blockquote": t("blockquote"), "html.address": t("address"),

  // pre: JSX làm mất xuống dòng, nên xuất bằng chuỗi JSON
  "html.pre": {
    jsxTagName: "pre",
    render: (node, _c, className) => (
      <pre data-node-id={node.id} className={className}>{prop(node, "text")}</pre>
    ),
    toJsx: (node, _c, className, pad) =>
      `${pad}<pre${classAttr(className)}>{${JSON.stringify(prop(node, "text"))}}</pre>`,
  },
  "html.time": {
    jsxTagName: "time",
    render: (node, _c, className) => (
      <time data-node-id={node.id} dateTime={prop(node, "dateTime")} className={className}>
        {prop(node, "text")}
      </time>
    ),
  },

  // ══ Form ══
  "html.form": {
    jsxTagName: "form",
    render: (node, children, className) => (
      <form data-node-id={node.id} className={className} onSubmit={(e) => e.preventDefault()}>
        {children}
      </form>
    ),
  },
  "html.fieldset": b("fieldset"),
  "html.legend": t("legend"),

  // ══ Media ══
  "html.figure": b("figure"),
  "html.figcaption": t("figcaption"),
  "html.video": {
    jsxTagName: "video",
    render: (node, _c, className) => (
      <video data-node-id={node.id} src={prop(node, "src")} controls={!!(node.props as { controls?: boolean }).controls} className={className} />
    ),
  },
  "html.audio": {
    jsxTagName: "audio",
    render: (node, _c, className) => (
      <audio data-node-id={node.id} src={prop(node, "src")} controls={!!(node.props as { controls?: boolean }).controls} className={className} />
    ),
  },
  // Canvas bọc div để bấm chọn được (iframe nuốt click); code xuất ra là <iframe> thật
  "html.iframe": {
    jsxTagName: "iframe",
    render: (node, _c, className) => (
      <div data-node-id={node.id} className={cn("h-64 w-full overflow-hidden rounded-md border", className)}>
        <iframe src={prop(node, "src")} title={prop(node, "title", "iframe")} className="pointer-events-none h-full w-full" />
      </div>
    ),
    toJsx: (node, _c, className, pad) =>
      `${pad}<iframe src="${escapeAttr(prop(node, "src"))}" title="${escapeAttr(prop(node, "title", "iframe"))}" className="${escapeAttr(cn("h-64 w-full", className))}" />`,
  },

  // ══ Layout ══
  "html.details": {
    jsxTagName: "details",
    // Canvas luôn mở để sửa nội dung bên trong
    render: (node, children, className) => (
      <details data-node-id={node.id} open className={className}>{children}</details>
    ),
  },
  "html.summary": t("summary"),
  "html.hr": leafEntry("hr", "hr", ""),

  // ══ List ══
  "html.dl": b("dl"),
  "html.dt": t("dt"),
  "html.dd": t("dd"),

  // ══ Table (HTML) ══
  "html.table": {
    jsxTagName: "table",
    render: (node, children, className) => (
      <table data-node-id={node.id} className={cn("border-collapse", className)}>{children}</table>
    ),
    toJsx: (_n, childrenJsx, className, pad) =>
      `${pad}<table className="${escapeAttr(cn("border-collapse", className))}">\n${childrenJsx}\n${pad}</table>`,
  },
  "html.thead": b("thead"),
  "html.tbody": b("tbody"),
  "html.tr": b("tr"),
  "html.th": t("th"),
  "html.td": t("td"),

  // ══ Feedback ══
  "html.progress": {
    jsxTagName: "progress",
    render: (node, _c, className) => (
      <progress data-node-id={node.id} value={Number(prop(node, "value", "0"))} max={Number(prop(node, "max", "100")) || 100} className={className} />
    ),
  },
};
```

Phần xuất code của `time`, `video`, `audio`, `progress`, `fieldset`, `details` dùng đường generic của `json-to-jsx.ts` (gom `dateTime`, `src`, `controls={true}`, `value={50}` từ `propsSchema`), nên không cần `toJsx`.

## 5. `renderer-map.tsx`: thêm 2 dòng

```tsx
import { htmlExtraRenderers } from "./html-extra-renderers";
```

Cuối object `rendererMap`, cạnh `...clusterRenderers`:

```tsx
  ...clusterRenderers,
  ...htmlExtraRenderers,
};
```

## 6. `node-icons.ts`

Thêm vào import lucide:

```ts
Heading4, Heading5, Heading6, Bold, Italic, Highlighter, Code, Keyboard, Quote,
FileCode, MapPin, Clock, Minus, ClipboardList, Frame, Captions, ChevronRight,
NotebookText, Video, AudioLines, Globe, ALargeSmall,
```

Thêm vào `NODE_ICONS`:

```ts
  "html.h4": Heading4, "html.h5": Heading5, "html.h6": Heading6,
  "html.strong": Bold, "html.em": Italic, "html.small": ALargeSmall,
  "html.mark": Highlighter, "html.code": Code, "html.kbd": Keyboard,
  "html.blockquote": Quote, "html.pre": FileCode, "html.address": MapPin, "html.time": Clock,
  "html.form": ClipboardList, "html.fieldset": Frame, "html.legend": Tag,
  "html.figure": Image, "html.figcaption": Captions,
  "html.details": ChevronsDownUp, "html.summary": ChevronRight, "html.hr": Minus,
  "html.dl": NotebookText, "html.dt": Tag, "html.dd": Dot,
  "html.table": Table, "html.thead": PanelTop, "html.tbody": Rows3, "html.tr": Rows3,
  "html.th": Tag, "html.td": Square,
  "html.video": Video, "html.audio": AudioLines, "html.iframe": Globe, "html.progress": Loader,
```

Nếu v6.5 bạn đã để `Rows3` trong import, đừng thêm lần hai.

## 7. `default-presets.ts`: style mặc định cho vài node

```ts
  "html.h4": "heading-card",
  "html.small": "text-muted",
  "html.form": "stack",
  "html.fieldset": "stack",
  "html.figure": "stack",
  "html.details": "stack",
  "html.dl": "list",
```

Không đặt preset cho `table`, `thead`, `tbody`, `tr`, `th`, `td`. Các preset kiểu `stack` thêm `flex flex-col`, làm vỡ bố cục bảng (mất `display: table`). `table` chỉ nhận `width: full`, còn `th` và `td` có viền riêng như đã khai báo trong định nghĩa.

## Kiểm tra sau v6.6

1. Mở trình duyệt đầy đủ: các mục Typography, Form, Media, List, Data Display, Feedback dài ra rõ rệt. Search "table" thấy cả `Table` (shadcn) lẫn `Table (HTML)`.
2. Thêm **Table (HTML)**: 1 dòng tiêu đề, 2 dòng dữ liệu, có viền. Chọn `Table Body Group`, thêm `Table Row (HTML)`, ra dòng mới 3 ô.
3. Thêm **Form**: có label, ô email và nút Gửi. Bấm Enter trong ô nhập không làm tải lại trang.
4. Thêm **Details** và **Figure**: palette chỉ hiện đúng Summary hoặc Figcaption khi chọn node cha tương ứng.
5. Thêm **Iframe**: bấm vào chọn được node. Một số trang không cho nhúng, nên bạn đổi `src` nếu thấy trống.
6. Mở **Code**: `Pre` giữ nguyên xuống dòng, `Table` ra `className="border-collapse ..."`, `Time` ra `dateTime="..."`.

## Còn tồn đọng

- Đợt 1 mình bỏ `br` và `option`: `br` vô nghĩa trong bố cục flex của builder, còn `option` thuộc về `html.select`, vốn chưa nhận node con. Nếu bạn muốn `html.select` có danh sách lựa chọn như bản shadcn thì nhắn mình, đó là việc nhỏ.
- `ai-registry-summary.ts` có thể liệt kê node cho AI. Mình chưa thấy file này. Nếu nó đọc thẳng registry, AI sẽ thấy cả node con (`th`, `td`, `summary`...) và có thể thử thêm sai chỗ. Gửi file này lúc làm v6.8 hoặc sau v6.7 là kịp.

Bạn chạy thử và báo kết quả. Bản tiếp theo là **v6.7**: 18 node shadcn mới (slider, toggle, toggle-group, calendar, carousel, command, drawer, input-otp, aspect-ratio, spinner, kbd, empty, chart, sidebar...). Phần này nặng hơn v6.6 vì mỗi node cần cài thêm file `components/ui/*` (một số kéo theo thư viện như `embla-carousel`, `cmdk`, `vaul`, `recharts`). Mình sẽ đưa sẵn danh sách lệnh cài và chia làm 2 đợt để bạn dừng được giữa chừng.