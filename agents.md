# v6.9: Blocks

Bản này không cần xem thêm file nào, và có 4 phần:

1. Mở rộng định dạng cây để block gắn được preset và style.
2. Kho 10 block có bộ kiểm tra tự động.
3. Action `addBlock` trong store.
4. Bật tab **Blocks** trong palette.

Block được chèn bằng đúng hàm dựng cây của v6.1, mỗi lần chèn cấp ID mới nên luôn là **bản sao độc lập**.

Mình nói trước một điểm: mình hứa "xem trước từng block" ở kế hoạch, nhưng bản này chỉ hiện **tên, mô tả và số node**. Ảnh xem trước thật cần dựng block bằng renderer của canvas, mà mình chưa thấy `component-renderer.tsx`. Việc này để bản sau.

## 1. Mở rộng `DefaultChildSpec`

**`node-definition.types.ts`**: thay interface `DefaultChildSpec`:

```ts
export interface DefaultChildSpec {
  defId: string;
  props?: Record<string, unknown>;
  preset?: string;                    // 👈 tên preset trong style-presets.ts
  style?: Record<string, unknown>;    // 👈 ghi đè lên base của preset
  children?: DefaultChildSpec[];
}
```

**`core/utils/build-node-tree.ts`**: thay toàn bộ:

```ts
import { TreeNode } from "@/core/types/builder.types";
import { DefaultChildSpec, NodeDefinition } from "@/core/types/node-definition.types";
import { NodeStyle, StyleProps } from "@/core/types/style.types";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { resolveDefaultStyle } from "@/core/registry/default-presets";
import { getStylePreset } from "@/core/registry/style-presets";

const MAX_DEPTH = 12; // block có thể sâu 7-8 cấp

function resolveSpecStyle(def: NodeDefinition, preset?: string, override?: Record<string, unknown>): NodeStyle {
  const presetStyle = getStylePreset(preset)?.style;
  const style: NodeStyle = presetStyle ? structuredClone(presetStyle) : resolveDefaultStyle(def);
  if (override) style.base = { ...style.base, ...(structuredClone(override) as Partial<StyleProps>) };
  return style;
}

function build(spec: DefaultChildSpec, depth: number): TreeNode | null {
  if (depth > MAX_DEPTH) return null;
  const def = getNodeDefinition(spec.defId);
  if (!def) return null;

  // children có khai báo (kể cả []) thì dùng đúng; không khai báo thì lấy nội dung mẫu của node
  const childSpecs = spec.children ?? def.defaultChildren ?? [];
  return {
    id: crypto.randomUUID(),
    type: spec.defId,
    props: { ...structuredClone(def.defaultProps), ...structuredClone(spec.props ?? {}) },
    style: resolveSpecStyle(def, spec.preset, spec.style),
    children: childSpecs.map((s) => build(s, depth + 1)).filter((n): n is TreeNode => n !== null),
  };
}

// Giữ chữ ký cũ để addNode và apply-ai-operations không phải sửa
export function buildNodeFromSpec(
  defId: string,
  overrideProps?: Record<string, unknown>,
  childSpecs?: DefaultChildSpec[],
  depth = 0
): TreeNode | null {
  return build({ defId, props: overrideProps, children: childSpecs }, depth);
}

export function buildNodeTree(spec: DefaultChildSpec): TreeNode | null {
  return build(spec, 0);
}
```

## 2. File mới `core/types/block.types.ts`

```ts
import { DefaultChildSpec } from "./node-definition.types";

export interface BlockDefinition {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  spec: DefaultChildSpec; // cây JSON thuần: lưu Supabase, chia sẻ, clone đều được
}
```

## 3. File mới `core/registry/blocks.ts`

```ts
import { BlockDefinition } from "@/core/types/block.types";
import { DefaultChildSpec } from "@/core/types/node-definition.types";
import { getNodeDefinition } from "./node-registry";
import { canContain } from "./node-rules";
import { getStylePreset } from "./style-presets";

type S = Record<string, unknown>;

// ── Helper dựng spec (children luôn khai báo → không lẫn nội dung mẫu của node) ──
const n = (defId: string, preset?: string, props?: S, children: DefaultChildSpec[] = [], style?: S): DefaultChildSpec =>
  ({ defId, preset, props, style, children });
const t = (defId: string, preset: string | undefined, text: string, style?: S) =>
  n(defId, preset, { text }, [], style);
const btn = (text: string, variant = "default", preset = "button-soft") =>
  n("shadcn.button", preset, { text, variant });
const link = (text: string) => n("html.a", "link", { href: "#" }, [t("html.span", undefined, text)]);
const icon = (name: string, size = 24, style?: S) => n("html.icon", undefined, { name, size }, [], style);
const head = (eyebrow: string, title: string, lead: string) =>
  n("html.div", "stack", undefined, [
    t("html.span", "eyebrow", eyebrow),
    t("html.h2", "heading-section", title),
    t("html.p", "text-lead", lead),
  ], { align: "items-center", textAlign: "center", gap: 2 });

// ── Thành phần dùng lại ──
const feature = (ic: string, title: string, desc: string) =>
  n("shadcn.card", "card", undefined, [
    icon(ic, 28, { textColor: "blue-500" }),
    t("html.h3", "heading-card", title),
    t("html.p", "text-muted", desc),
  ]);

const tier = (name: string, price: string, note: string, items: string[], featured = false) =>
  n("shadcn.card", featured ? "card-featured" : "card", undefined, [
    t("html.h3", "heading-card", name),
    t("html.p", "price", price),
    t("html.p", "text-muted", note),
    n("html.ul", "list", undefined, items.map((i) =>
      n("html.li", "list-item", undefined, [icon("Check", 16, { textColor: "blue-500" }), t("html.span", undefined, i)])
    )),
    btn(featured ? "Chọn gói này" : "Bắt đầu", "default", "button-block"),
  ]);

const quote = (text: string, name: string, role: string, fallback: string) =>
  n("shadcn.card", "card", undefined, [
    t("html.p", "text-body", `“${text}”`),
    n("html.div", "row", undefined, [
      n("shadcn.avatar", undefined, { src: "", fallback }),
      n("html.div", "stack", undefined, [
        t("html.p", undefined, name, { fontWeight: "semibold", textColor: "zinc-900" }),
        t("html.p", "text-muted", role),
      ], { gap: 0 }),
    ]),
  ]);

const field = (label: string, placeholder: string, type: string) =>
  n("html.div", "stack", undefined, [
    t("shadcn.label", "label", label),
    n("shadcn.input", undefined, { placeholder, type }),
  ], { gap: 2 });

const stat = (value: string, label: string) =>
  n("html.div", "stack", undefined, [
    t("html.h2", "heading-section", value),
    t("html.p", "text-muted", label),
  ], { align: "items-center", textAlign: "center", gap: 1 });

const faqItem = (q: string, a: string) =>
  n("shadcn.accordion-item", undefined, undefined, [
    n("shadcn.accordion-trigger", undefined, { text: q }),
    n("shadcn.accordion-content", undefined, undefined, [t("html.p", "text-body", a)]),
  ]);

const col = (title: string, items: string[]) =>
  n("html.div", "stack", undefined, [
    t("html.p", undefined, title, { fontWeight: "semibold", textColor: "zinc-900" }),
    n("html.ul", "list", undefined, items.map((i) => n("html.li", "list-item", undefined, [link(i)]))),
  ], { gap: 3 });

// ══ 10 BLOCK ══
export const BLOCK_CATEGORY_ORDER = ["Điều hướng", "Mở đầu", "Nội dung", "Biểu mẫu", "Chân trang"];

export const BLOCKS: BlockDefinition[] = [
  {
    id: "block.navbar", title: "Navbar", category: "Điều hướng",
    description: "Thanh điều hướng: logo, 3 liên kết, nút đăng nhập.",
    tags: ["navbar", "header", "menu", "nav"],
    spec: n("html.header", "navbar", undefined, [
      t("html.span", "heading-card", "Brand"),
      n("html.nav", "row", undefined, [link("Trang chủ"), link("Tính năng"), link("Bảng giá")], { gap: 6 }),
      btn("Đăng nhập"),
    ]),
  },
  {
    id: "block.hero", title: "Hero", category: "Mở đầu",
    description: "Tiêu đề lớn, mô tả và 2 nút hành động ở giữa.",
    tags: ["hero", "landing", "banner", "headline"],
    spec: n("html.section", "hero", undefined, [
      t("html.span", "eyebrow", "Mới ra mắt"),
      t("html.h1", "heading-hero", "Xây dựng giao diện nhanh hơn bao giờ hết"),
      t("html.p", "text-lead", "Một câu mô tả ngắn gọn giá trị sản phẩm của bạn, rõ ràng và dễ hiểu."),
      n("html.div", "row", undefined, [btn("Bắt đầu ngay"), btn("Tìm hiểu thêm", "outline")],
        { justify: "justify-center", flexWrap: "flex-wrap" }),
    ]),
  },
  {
    id: "block.features", title: "Tính năng", category: "Nội dung",
    description: "Tiêu đề mục và lưới 3 thẻ tính năng có icon.",
    tags: ["features", "grid", "benefits", "cards"],
    spec: n("html.section", "section", undefined, [
      head("Tính năng", "Mọi thứ bạn cần", "Những điểm nổi bật giúp sản phẩm khác biệt."),
      n("html.div", "grid-3", undefined, [
        feature("Zap", "Nhanh chóng", "Hoạt động mượt mà, tải trang gần như tức thì."),
        feature("ShieldCheck", "An toàn", "Dữ liệu được bảo vệ ở mọi bước."),
        feature("Sparkles", "Dễ dùng", "Giao diện trực quan, không cần hướng dẫn."),
      ]),
    ]),
  },
  {
    id: "block.pricing", title: "Bảng giá", category: "Nội dung",
    description: "3 gói giá, gói giữa được làm nổi bật.",
    tags: ["pricing", "plans", "tiers", "price"],
    spec: n("html.section", "section", undefined, [
      head("Bảng giá", "Chọn gói phù hợp", "Nâng cấp hoặc hủy bất cứ lúc nào."),
      n("html.div", "grid-3", undefined, [
        tier("Starter", "$9", "Cho cá nhân", ["1 dự án", "Hỗ trợ email"]),
        tier("Pro", "$19", "Cho nhóm đang lớn", ["10 dự án", "Hỗ trợ ưu tiên", "Phân tích nâng cao"], true),
        tier("Business", "$49", "Cho doanh nghiệp", ["Không giới hạn dự án", "Quản lý thành viên", "SLA 99.9%"]),
      ]),
    ]),
  },
  {
    id: "block.testimonials", title: "Đánh giá", category: "Nội dung",
    description: "3 thẻ nhận xét khách hàng có ảnh đại diện.",
    tags: ["testimonials", "reviews", "quotes", "social proof"],
    spec: n("html.section", "section", undefined, [
      head("Khách hàng nói gì", "Được tin dùng mỗi ngày", "Phản hồi thật từ những người đã sử dụng."),
      n("html.div", "grid-3", undefined, [
        quote("Sản phẩm giúp nhóm mình tiết kiệm rất nhiều thời gian.", "Nguyễn An", "Product Manager", "NA"),
        quote("Dễ dùng, đẹp và đúng thứ mình cần.", "Trần Bình", "Designer", "TB"),
        quote("Hỗ trợ nhiệt tình, cập nhật liên tục.", "Lê Chi", "Founder", "LC"),
      ]),
    ]),
  },
  {
    id: "block.stats", title: "Số liệu", category: "Nội dung",
    description: "Hàng 4 con số nổi bật kèm nhãn.",
    tags: ["stats", "numbers", "metrics", "counter"],
    spec: n("html.section", "section", undefined, [
      n("html.div", "grid-4", undefined, [
        stat("10K+", "Người dùng"), stat("50+", "Quốc gia"), stat("99.9%", "Uptime"), stat("24/7", "Hỗ trợ"),
      ]),
    ]),
  },
  {
    id: "block.cta", title: "Kêu gọi hành động", category: "Mở đầu",
    description: "Khối nền tối với tiêu đề, mô tả và một nút.",
    tags: ["cta", "call to action", "banner", "signup"],
    spec: n("html.div", "card-dark", undefined, [
      t("html.h2", undefined, "Sẵn sàng bắt đầu?", { fontSize: "3xl", fontWeight: "bold", textColor: "white" }),
      t("html.p", undefined, "Tạo tài khoản miễn phí chỉ trong vài giây.", { textColor: "zinc-300" }),
      btn("Dùng thử miễn phí", "secondary"),
    ], { align: "items-center", textAlign: "center", paddingY: 12 }),
  },
  {
    id: "block.faq", title: "Câu hỏi thường gặp", category: "Nội dung",
    description: "Tiêu đề và danh sách hỏi đáp dạng accordion.",
    tags: ["faq", "questions", "accordion", "help"],
    spec: n("html.section", "section", undefined, [
      head("FAQ", "Câu hỏi thường gặp", "Không thấy câu trả lời bạn cần? Hãy liên hệ chúng tôi."),
      n("shadcn.accordion", undefined, undefined, [
        faqItem("Tôi có thể dùng thử miễn phí không?", "Có, bạn được dùng thử đầy đủ tính năng trong 14 ngày."),
        faqItem("Tôi có thể hủy bất cứ lúc nào?", "Có, hủy trong phần cài đặt tài khoản, không mất phí."),
        faqItem("Có hỗ trợ xuất hóa đơn không?", "Có, hóa đơn được gửi tự động qua email mỗi kỳ."),
        faqItem("Dữ liệu của tôi có an toàn không?", "Dữ liệu được mã hóa khi lưu trữ và khi truyền tải."),
      ]),
    ]),
  },
  {
    id: "block.login", title: "Form đăng nhập", category: "Biểu mẫu",
    description: "Thẻ đăng nhập: email, mật khẩu, nút gửi.",
    tags: ["login", "signin", "form", "auth"],
    spec: n("shadcn.card", "card", undefined, [
      t("html.h2", "heading-section", "Đăng nhập"),
      t("html.p", "text-muted", "Nhập email và mật khẩu để tiếp tục."),
      field("Email", "email@example.com", "email"),
      field("Mật khẩu", "••••••••", "password"),
      btn("Đăng nhập", "default", "button-block"),
      t("html.p", "text-muted", "Chưa có tài khoản? Đăng ký"),
    ], { maxWidth: "md" }),
  },
  {
    id: "block.footer", title: "Footer", category: "Chân trang",
    description: "Chân trang 4 cột, đường kẻ và dòng bản quyền.",
    tags: ["footer", "links", "bottom", "copyright"],
    spec: n("html.footer", "footer", undefined, [
      n("html.div", "grid-4", undefined, [
        n("html.div", "stack", undefined, [
          t("html.h3", "heading-card", "Brand"),
          t("html.p", "text-muted", "Mô tả ngắn về thương hiệu của bạn."),
        ], { gap: 2 }),
        col("Sản phẩm", ["Tính năng", "Bảng giá", "Cập nhật"]),
        col("Công ty", ["Giới thiệu", "Tuyển dụng", "Liên hệ"]),
        col("Hỗ trợ", ["Trung tâm trợ giúp", "Điều khoản", "Bảo mật"]),
      ]),
      n("shadcn.separator"),
      t("html.p", "text-muted", "© 2026 Brand. Mọi quyền được bảo lưu."),
    ]),
  },
];

export function getBlock(id: string): BlockDefinition | undefined {
  return BLOCKS.find((b) => b.id === id);
}

export function searchBlocks(query: string): BlockDefinition[] {
  const q = query.trim().toLowerCase();
  if (!q) return BLOCKS;
  return BLOCKS.filter((b) =>
    [b.title, b.description, b.category, ...b.tags].some((s) => s.toLowerCase().includes(q))
  );
}

export function countSpecNodes(spec: DefaultChildSpec): number {
  return 1 + (spec.children ?? []).reduce((sum, c) => sum + countSpecNodes(c), 0);
}

// ── Kiểm tra block lúc dev: bắt lỗi gõ sai id, preset, hoặc đặt sai cha-con ──
function validate(spec: DefaultChildSpec, parentId: string | undefined, path: string, out: string[]) {
  const def = getNodeDefinition(spec.defId);
  if (!def) return void out.push(`${path}: node "${spec.defId}" không tồn tại`);
  if (spec.preset && !getStylePreset(spec.preset)) out.push(`${path}: preset "${spec.preset}" không tồn tại`);
  if (!def.canHaveChildren && (spec.children?.length ?? 0) > 0) out.push(`${path}: "${spec.defId}" là node lá nhưng có con`);
  const parentDef = parentId ? getNodeDefinition(parentId) : undefined;
  if (parentDef && !canContain(parentDef, def.nodeKind, def)) out.push(`${path}: "${parentId}" không được chứa "${spec.defId}"`);
  (spec.children ?? []).forEach((c, i) => validate(c, spec.defId, `${path} > ${c.defId}[${i}]`, out));
}

if (process.env.NODE_ENV !== "production") {
  const problems: string[] = [];
  BLOCKS.forEach((b) => validate(b.spec, undefined, b.id, problems));
  if (problems.length) console.warn("[blocks] Phát hiện lỗi trong định nghĩa block:\n" + problems.join("\n"));
}
```

Nếu `maxWidth: "md"` bị `STYLE_PROP_KEYS` hoặc `styleToClasses` bỏ qua (login card dãn full màn hình), kiểm tra danh sách giá trị `maxWidth` trong `style.types.ts` rồi đổi cho khớp (preset `page-container` đang dùng `"6xl"`).

## 4. `builder-store.ts`

Thêm import:

```ts
import { getBlock } from "@/core/registry/blocks";
import { buildNodeTree } from "@/core/utils/build-node-tree";
```

Thêm vào interface `BuilderState`, cạnh `addNode`:

```ts
  addBlock: (parentId: string, blockId: string) => void;
```

Thêm action, ngay sau `addNode`:

```ts
  addBlock: (parentId, blockId) =>
    set((state) => {
      const block = getBlock(blockId);
      const rootDef = block ? getNodeDefinition(block.spec.defId) : undefined;
      if (!block || !rootDef) return {};

      const newTree = structuredClone(state.tree);
      const parent = findNode(newTree, parentId);
      if (!parent) return {};
      const parentDef = getNodeDefinition(parent.type);
      if (!parentDef || !canContain(parentDef, rootDef.nodeKind, rootDef)) return {};

      const node = buildNodeTree(block.spec); // ID mới hoàn toàn → bản sao độc lập
      if (!node) return {};
      parent.children.push(node);
      return { tree: newTree }; // giữ nguyên node đang chọn để thêm block tiếp không bị lồng vào nhau
    }),
```

FAQ có Accordion nên `normalizeClusterValues` (v6.2) tự gán `item-1, item-2...` sau khi chèn.

## 5. File mới `features/node-palette/constants/block-icons.ts`

```ts
import {
  PanelTop, Rocket, LayoutGrid, BadgeDollarSign, MessageSquareQuote,
  LogIn, Hash, Megaphone, CircleHelp, PanelBottom, Blocks, type LucideIcon,
} from "lucide-react";

const BLOCK_ICONS: Record<string, LucideIcon> = {
  "block.navbar": PanelTop,
  "block.hero": Rocket,
  "block.features": LayoutGrid,
  "block.pricing": BadgeDollarSign,
  "block.testimonials": MessageSquareQuote,
  "block.stats": Hash,
  "block.cta": Megaphone,
  "block.faq": CircleHelp,
  "block.login": LogIn,
  "block.footer": PanelBottom,
};

export function getBlockIcon(id: string): LucideIcon {
  return BLOCK_ICONS[id] ?? Blocks;
}
```

Nếu bản lucide của bạn thiếu `CircleHelp`, dùng `HelpCircle`.

## 6. `palette-data.ts`: thay toàn bộ

```ts
import { NodeDefinition, NodeCategory, NodeTier } from "@/core/types/node-definition.types";
import { BlockDefinition } from "@/core/types/block.types";
import { searchNodes, getNodeDefinition } from "@/core/registry/node-registry";
import { canContain } from "@/core/registry/node-rules";
import { BLOCK_CATEGORY_ORDER, searchBlocks } from "@/core/registry/blocks";
import { commonNodeIds } from "../constants/common-node-ids";

export const CATEGORY_ORDER: NodeCategory[] = [
  "Layout", "Typography", "Form", "List", "Media",
  "Navigation", "Overlay", "Data Display", "Feedback", "Templates",
];

export interface PaletteGroup { key: string; label: string; defs: NodeDefinition[] }
export interface BlockGroup { key: string; label: string; blocks: BlockDefinition[] }

export interface PaletteData {
  sealed: boolean;
  parts: NodeDefinition[];
  searchResults: NodeDefinition[];
  element: PaletteGroup[];
  component: PaletteGroup[];
  blockResults: BlockDefinition[];
  blockGroups: BlockGroup[];
  counts: { element: number; component: number; block: number };
}

export function buildPaletteData(parentDef: NodeDefinition | undefined, query: string): PaletteData {
  const q = query.trim();
  const allowed = (d: NodeDefinition) =>
    !!parentDef &&
    (d.nodeKind === "html" || d.nodeKind === "shadcn") &&
    canContain(parentDef, d.nodeKind, d);

  const defs = searchNodes(q).filter(allowed);
  const parts = defs.filter((d) => d.parentOnly);
  const normal = defs.filter((d) => !d.parentOnly);
  const tierOf = (d: NodeDefinition): NodeTier => d.tier ?? "element";

  const build = (tier: NodeTier): PaletteGroup[] => {
    const groups: PaletteGroup[] = [];
    if (!q) {
      const common = commonNodeIds
        .map((id) => getNodeDefinition(id))
        .filter((d): d is NodeDefinition => !!d && allowed(d) && !d.parentOnly && tierOf(d) === tier);
      if (common.length) groups.push({ key: "__common", label: "Hay dùng", defs: common });
    }
    const byCat = new Map<string, NodeDefinition[]>();
    for (const d of normal.filter((x) => tierOf(x) === tier)) {
      if (!byCat.has(d.category)) byCat.set(d.category, []);
      byCat.get(d.category)!.push(d);
    }
    const ordered = [
      ...CATEGORY_ORDER.filter((c) => byCat.has(c)),
      ...[...byCat.keys()].filter((c) => !CATEGORY_ORDER.includes(c as NodeCategory)),
    ];
    ordered.forEach((c) => groups.push({ key: c, label: c, defs: byCat.get(c)! }));
    return groups;
  };

  // Block chỉ hiện nếu node gốc của block được phép nằm trong cha đang chọn
  const blockResults = searchBlocks(q).filter((b) => {
    const rootDef = getNodeDefinition(b.spec.defId);
    return !!parentDef && !!rootDef && canContain(parentDef, rootDef.nodeKind, rootDef);
  });
  const blockGroups = BLOCK_CATEGORY_ORDER
    .map((c) => ({ key: c, label: c, blocks: blockResults.filter((b) => b.category === c) }))
    .filter((g) => g.blocks.length > 0);

  return {
    sealed: !!parentDef?.allowedChildIds,
    parts,
    searchResults: defs,
    element: build("element"),
    component: build("component"),
    blockResults,
    blockGroups,
    counts: {
      element: normal.filter((d) => tierOf(d) === "element").length,
      component: normal.filter((d) => tierOf(d) === "component").length,
      block: blockResults.length,
    },
  };
}
```

## 7. `palette-sections.tsx`

**Thêm import** `import { cn } ...` đã có. Thêm component `BlockCard` (đặt dưới `PaletteTile`):

```tsx
export function BlockCard({
  title, description, Icon, nodeCount, selected, onClick,
}: {
  title: string; description: string; Icon: LucideIcon;
  nodeCount: number; selected?: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button" onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-1 rounded-md border bg-background p-2 text-left hover:bg-accent active:bg-accent",
        selected && "border-primary bg-primary/10"
      )}
    >
      <div className="flex w-full items-center gap-1.5">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-xs font-medium">{title}</span>
        <span className="ml-auto shrink-0 text-[9px] text-muted-foreground">{nodeCount} node</span>
      </div>
      <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">{description}</p>
    </button>
  );
}
```

**Sửa `PaletteTabs`:** bỏ khóa Blocks, đếm đủ 3 tầng:

```tsx
const TABS: { id: NodeTier; label: string }[] = [
  { id: "element", label: "Elements" },
  { id: "component", label: "Components" },
  { id: "block", label: "Blocks" },
];

export function PaletteTabs({
  value, onChange, counts,
}: {
  value: NodeTier; onChange: (t: NodeTier) => void;
  counts: { element: number; component: number; block: number };
}) {
  return (
    <div className="flex gap-1 border-b px-2 py-1.5">
      {TABS.map((t) => (
        <button
          key={t.id} type="button" onClick={() => onChange(t.id)}
          className={cn(
            "flex-1 rounded-md px-2 py-1 text-xs",
            value === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
          )}
        >
          {t.label}
          <span className="ml-1 opacity-60">{counts[t.id]}</span>
        </button>
      ))}
    </div>
  );
}
```

## 8. `quick-add-dropdown.tsx`: 5 chỗ

**a) Import thêm:**

```tsx
import { BlockCard } from "./palette-sections";   // gộp vào import palette-sections hiện có
import { getBlockIcon } from "../constants/block-icons";
import { countSpecNodes } from "@/core/registry/blocks";
import { BlockDefinition } from "@/core/types/block.types";
```

**b) Cạnh các `useBuilderStore` khác:**

```tsx
  const addBlock = useBuilderStore((s) => s.addBlock);
```

**c) Cạnh `handleAddDef`:**

```tsx
  const handleAddBlock = (blockId: string) => {
    addBlock(parentId, blockId);
    onClose();
  };
```

**d) Cạnh `defTile` trong phần render:**

```tsx
  const blockCard = (b: BlockDefinition) => (
    <BlockCard
      key={b.id} title={b.title} description={b.description}
      Icon={getBlockIcon(b.id)} nodeCount={countSpecNodes(b.spec)}
      onClick={() => handleAddBlock(b.id)}
    />
  );
```

**e) Thay nhánh `searching`** (khối `{searching ? ( ... ) : ( ... )}`: phần đầu tiên, trước dấu `:`):

```tsx
        {searching ? (
          projectTiles.length + data.searchResults.length + data.blockResults.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Không tìm thấy node nào</p>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-1">
                {projectTiles}
                {data.searchResults.map(defTile)}
              </div>
              {data.blockResults.length > 0 && (
                <PaletteSection label="Block" count={data.blockResults.length}>
                  <div className="grid grid-cols-2 gap-1.5">{data.blockResults.map(blockCard)}</div>
                </PaletteSection>
              )}
            </>
          )
        ) : (
```

**f) Thay biểu thức** `{!data.sealed && tab === "block" ? null : !data.sealed && groups.map(...)}` bằng:

```tsx
            {!data.sealed && tab === "block" &&
              data.blockGroups.map((g) => (
                <PaletteSection key={g.key} label={g.label} count={g.blocks.length}>
                  <div className="grid grid-cols-2 gap-1.5">{g.blocks.map(blockCard)}</div>
                </PaletteSection>
              ))}

            {!data.sealed && tab !== "block" &&
              groups.map((g, i) => (
                <PaletteSection
                  key={g.key} label={g.label} count={g.defs.length}
                  open={isOpen(g.key, i)} onToggle={() => toggle(g.key, i)}
                >
                  <div className="grid grid-cols-4 gap-1">{g.defs.map(defTile)}</div>
                </PaletteSection>
              ))}
```

## 9. `add-node-browser.tsx`: 4 chỗ

**a) Import thêm:**

```tsx
import { BlockCard } from "./palette-sections";   // gộp vào import palette-sections hiện có
import { getBlockIcon } from "../constants/block-icons";
import { countSpecNodes } from "@/core/registry/blocks";
import { BlockDefinition } from "@/core/types/block.types";
```

**b) Mở rộng `Selection` và thêm `addBlock`:**

```tsx
type Selection =
  | { kind: "definition"; id: string }
  | { kind: "component"; id: string }
  | { kind: "block"; id: string };
```

```tsx
  const addBlock = useBuilderStore((s) => s.addBlock);
```

**c) Sửa `handleAdd`:**

```tsx
    if (selection.kind === "definition") {
      addNode(parentId, selection.id);
    } else if (selection.kind === "block") {
      addBlock(parentId, selection.id);
    } else {
      // ...nhánh component giữ nguyên
    }
```

**d) Thêm `blockRow` cạnh `defRow`, rồi sửa 2 chỗ render:**

```tsx
  const blockRow = (b: BlockDefinition) => (
    <BlockCard
      key={b.id} title={b.title} description={b.description}
      Icon={getBlockIcon(b.id)} nodeCount={countSpecNodes(b.spec)}
      selected={selection?.kind === "block" && selection.id === b.id}
      onClick={() => setSelection({ kind: "block", id: b.id })}
    />
  );
```

Trong nhánh `searching`, thêm điều kiện và render block:

```tsx
                filteredComponents.length + data.searchResults.length + data.blockResults.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">Không tìm thấy node nào</p>
                ) : (
                  <>
                    {projectRows(filteredComponents)}
                    {data.searchResults.map(defRow)}
                    {data.blockResults.length > 0 && (
                      <PaletteSection label="Block" count={data.blockResults.length}>
                        <div className="flex flex-col gap-1.5">{data.blockResults.map(blockRow)}</div>
                      </PaletteSection>
                    )}
                  </>
                )
```

Và thay dòng `{!data.sealed && tab !== "block" && groups.map(...)}` bằng:

```tsx
                  {!data.sealed && tab === "block" &&
                    data.blockGroups.map((g) => (
                      <PaletteSection key={g.key} label={g.label} count={g.blocks.length}>
                        <div className="flex flex-col gap-1.5">{g.blocks.map(blockRow)}</div>
                      </PaletteSection>
                    ))}
                  {!data.sealed && tab !== "block" &&
                    groups.map((g, i) => (
                      <PaletteSection
                        key={g.key} label={g.label} count={g.defs.length}
                        open={isOpen(g.key, i)} onToggle={() => toggle(g.key, i)}
                      >
                        <div className="pl-2">{g.defs.map(defRow)}</div>
                      </PaletteSection>
                    ))}
```

## Kiểm tra sau v6.9

1. Mở console khi chạy `pnpm dev`: **không có** dòng `[blocks] Phát hiện lỗi...`. Nếu có, nó chỉ đúng block và đường dẫn node bị sai.
2. Chọn **Page**, bấm `+`, tab **Blocks**: 3 nhóm (Điều hướng, Mở đầu, Nội dung...) hiện 2 cột, mỗi thẻ có icon, số node và mô tả.
3. Chèn **Navbar**, **Hero**, **Bảng giá**, **Footer** lần lượt: trang ra đúng bố cục, 3 gói giá thành lưới, gói giữa có viền xanh.
4. Chèn **FAQ**: bấm mở/đóng từng câu hỏi được, thêm một `Accordion Item` thì có câu thứ 5.
5. Chèn **Hero** hai lần rồi sửa chữ ở bản đầu: bản thứ hai **không đổi theo**. Đó là bản sao độc lập.
6. Chọn **Tabs** rồi bấm `+`: không có tab Blocks, vì Tabs không nhận block.
7. Chọn `Div` rồi chèn **Login**: thẻ nằm gọn trong Div.
8. Gõ "pricing" vào ô tìm: ra block Bảng giá kèm nhãn nhóm "Block".
9. Mở **Code**: mỗi block xuất ra JSX hợp lệ, có đủ `import` Accordion, Avatar, Card, Button...
10. **Lưu rồi mở lại project**: block vẫn đủ (block chỉ là node thường trong cây).

## Hạn chế cần biết

- **AI chưa biết Block.** Gõ "thêm trang chủ" thì AI vẫn tự ghép từng node. Cho AI gọi block được thì cần thêm danh sách block vào prompt và một loại thao tác mới, đáng làm riêng.
- **Block hardcode:** 10 block do bạn kiểm soát, đúng như bạn chốt. Muốn thêm block mới chỉ cần thêm một mục vào mảng `BLOCKS`, bộ kiểm tra dev sẽ bắt lỗi ngay.
- **Khoảng cách và font** dựa trên preset hiện có. Nếu muốn khác thì sửa `style-presets.ts`, mọi block đổi theo.

## Tổng kết v6

Bạn đã có đủ 3 tầng:

| Tầng | Số lượng |
|---|---|
| Elements | khoảng 60+ node lẻ |
| Components | khoảng 30 cụm có nội dung mẫu |
| Blocks | 10 block ghép sẵn |
