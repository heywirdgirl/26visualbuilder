# v6.1: Hạ tầng

Mình đã đủ file để làm v6.1. Có 4 phần cần sửa, và 1 lỗi hiện có trong `addNode`.

## Lỗi cần sửa ngay

`addNode` hiện chỉ dựng con **một cấp**: `buildChildNode` tạo `children: []` và bỏ qua `defaultChildren` của chính node con. Vì vậy Tabs → TabsList → TabsTrigger sẽ không bao giờ sinh đủ. Phải làm đệ quy.

## 1. `node-definition.types.ts`

```ts
export type NodeTier = "element" | "component" | "block";

// Con của defaultChildren có thể lồng tiếp (đệ quy)
export interface DefaultChildSpec {
  defId: string;
  props?: Record<string, unknown>;
  children?: DefaultChildSpec[];
}

export interface NodeDefinition {
  id: string;
  title: string;
  category: NodeCategory;
  nodeKind: NodeKind;
  version?: number;
  tags: string[];
  canHaveChildren: boolean;
  defaultProps: Record<string, unknown>;
  defaultStyle?: Partial<StyleProps>;
  propsSchema: PropMeta[];
  defaultChildren?: DefaultChildSpec[];   // 👈 đổi kiểu
  icon?: string;

  tier?: NodeTier;                         // 👈 mới, mặc định "element"
  parentOnly?: string[];                   // 👈 mới: chỉ hiện/thêm được khi cha có id nằm trong danh sách
  allowedChildIds?: string[];              // 👈 mới: nếu có, cha chỉ nhận đúng các id này
}
```

## 2. `node-rules.ts`

Thay `canContain` bằng bản nhận thêm `childDef`, để kiểm tra `parentOnly` và `allowedChildIds`:

```ts
export function canContain(
  parentDef: NodeDefinition,
  childNodeKind: NodeKind,
  childDef?: NodeDefinition
): boolean {
  if (!getAllowedChildKinds(parentDef).includes(childNodeKind)) return false;

  // Cha giới hạn danh sách con (vd TabsList chỉ nhận TabsTrigger)
  if (parentDef.allowedChildIds && childDef) {
    if (!parentDef.allowedChildIds.includes(childDef.id)) return false;
  }

  // Con chỉ được đặt vào cha chỉ định (vd TabsTrigger chỉ vào TabsList)
  if (childDef?.parentOnly && !childDef.parentOnly.includes(parentDef.id)) return false;

  return true;
}

// Dùng cho palette: node này có được hiện khi đang chọn `parentDef` không
export function isVisibleInPalette(childDef: NodeDefinition, parentDef: NodeDefinition): boolean {
  if (!childDef.parentOnly) return true;
  return childDef.parentOnly.includes(parentDef.id);
}
```

Các lời gọi `canContain(parentDef, def.nodeKind)` cũ vẫn chạy được vì tham số thứ 3 là tùy chọn. Nhưng nên truyền thêm `def` ở `addNode`, `indentNode`, `outdentNode` (xem phần 3).

Lưu ý: node có `parentOnly` thì **không được tự xuất hiện ở cấp Page** nữa. Đây là điều mình muốn.

## 3. `builder-store.ts`

**Thay `buildChildNode` bằng bản đệ quy** (và đổi tên cho rõ):

```ts
import { DefaultChildSpec } from "@/core/types/node-definition.types";

const MAX_DEPTH = 8; // chặn defaultChildren tự tham chiếu vòng

function buildNodeFromSpec(
  defId: string,
  overrideProps?: Record<string, unknown>,
  childSpecs?: DefaultChildSpec[],
  depth = 0
): TreeNode | null {
  if (depth > MAX_DEPTH) return null;
  const def = getNodeDefinition(defId);
  if (!def) return null;

  // spec lồng nhau (từ block) ưu tiên hơn defaultChildren của định nghĩa
  const specs = childSpecs ?? def.defaultChildren ?? [];

  return {
    id: crypto.randomUUID(),
    type: defId,
    props: { ...structuredClone(def.defaultProps), ...structuredClone(overrideProps ?? {}) },
    style: resolveDefaultStyle(def),
    children: specs
      .map((s) => buildNodeFromSpec(s.defId, s.props, s.children, depth + 1))
      .filter((n): n is TreeNode => n !== null),
  };
}

// Dùng cho Blocks (v6.9) và addNode: dựng cả nhánh từ 1 spec
export function buildNodeTree(spec: DefaultChildSpec): TreeNode | null {
  return buildNodeFromSpec(spec.defId, spec.props, spec.children);
}
```

**Sửa `addNode`:**

```ts
addNode: (parentId, defId) =>
  set((state) => {
    const def = getNodeDefinition(defId);
    if (!def) return {};

    const newTree = structuredClone(state.tree);
    const parent = findNode(newTree, parentId);
    if (!parent) return {};

    const parentDef = getNodeDefinition(parent.type);
    if (!parentDef || !canContain(parentDef, def.nodeKind, def)) return {};

    const newNode = buildNodeFromSpec(defId);
    if (!newNode) return {};

    parent.children.push(newNode);
    return { tree: newTree };
  }),
```

**Sửa `indentNode` và `outdentNode`**, đổi dòng kiểm tra thành:

```ts
// indentNode
if (!movingDef || !prevDef || !canContain(prevDef, movingDef.nodeKind, movingDef)) return {};

// outdentNode
if (!movingNode || !movingDef || !grandparentDef || !canContain(grandparentDef, movingDef.nodeKind, movingDef))
  return {};
```

**`moveNode` (lên/xuống) không cần sửa**, vì chỉ đổi thứ tự trong cùng cha.

## 4. Liên kết `value` giữa cha và con (Tabs, Accordion)

Đây là điểm cần chốt trước khi sang v6.2. Mình đề xuất **mỗi cặp Trigger/Content dùng chung một `value` sinh tự động lúc thêm**, lưu trong `props`:

```ts
// ví dụ sẽ dùng ở v6.3
{ defId: "shadcn.tabs-trigger", props: { value: "tab1", text: "Tab 1" } },
{ defId: "shadcn.tabs-content", props: { value: "tab1" }, children: [...] }
```

Khi người dùng thêm tab thứ 3, `value` mặc định `"tab1"` sẽ **trùng**. Cách xử lý đơn giản và đủ dùng: thêm vào `addNode` một bước **chống trùng `value` trong cùng cha**:

```ts
// ngay trước parent.children.push(newNode) trong addNode
if (typeof newNode.props.value === "string") {
  const taken = new Set(
    parent.children.map((c) => (c.props as { value?: string }).value).filter(Boolean)
  );
  const base = newNode.props.value.replace(/\d+$/, "") || "item";
  let n = 1;
  while (taken.has(`${base}${n}`)) n++;
  newNode.props.value = `${base}${n}`;
}
```

Cách này chỉ **đảm bảo không trùng**. Việc người dùng phải đặt Trigger và Content cùng `value` thủ công là hạn chế. Ở v6.3 mình sẽ giải quyết gọn hơn bằng cách cho `tabs-content` tự ghép theo **thứ tự** với `tabs-trigger` ở renderer, nên người dùng không cần quan tâm `value`. Bạn thấy hướng nào ổn thì nói mình.

## Kiểm tra sau v6.1

1. Build không lỗi TypeScript (`defaultChildren` đổi kiểu, `canContain` thêm tham số).
2. `shadcn.card` vẫn thêm ra h3 + p như cũ.
3. Thêm `Div` vào Page vẫn bình thường.

## Cần xem thêm trước v6.2

- `core/registry/default-presets.ts` và `style-presets.ts`: `resolveDefaultStyle` đang được import mà mình chưa thấy. Chỉ cần nếu node con cần style riêng.
- `core/registry/system-nodes.ts`: để chắc 4 node hệ thống không bị ảnh hưởng bởi `tier`.

Bạn áp dụng v6.1 xong, báo kết quả, rồi gửi `renderer-map.tsx`, `json-to-jsx.ts`, `ui-dependencies.ts` để làm v6.2.


# v6.2: Renderer + export cho node con của cụm

## Hướng giải quyết phần liên kết `value`

Mình chọn cách này để người dùng **không phải quan tâm tới `value`**: Trigger và Content ghép với nhau **theo thứ tự**. Một hàm chuẩn hóa tự gán `tab-1, tab-2...` vào `props.value` mỗi khi cây đổi. Nhờ vậy renderer, code export và dữ liệu lưu đều chỉ đọc `props.value`, không phải sửa `json-to-jsx.ts`.

## 1. File mới `core/utils/normalize-cluster-values.ts`

```ts
import { TreeNode } from "@/core/types/builder.types";

function collectFixes(node: TreeNode, fixes: Map<string, string>) {
  const assign = (list: TreeNode[], prefix: string) =>
    list.forEach((n, i) => {
      const v = `${prefix}-${i + 1}`;
      if ((n.props as { value?: string }).value !== v) fixes.set(n.id, v);
    });

  if (node.type === "shadcn.tabs") {
    const triggers = node.children
      .filter((c) => c.type === "shadcn.tabs-list")
      .flatMap((l) => l.children.filter((t) => t.type === "shadcn.tabs-trigger"));
    const contents = node.children.filter((c) => c.type === "shadcn.tabs-content");
    assign(triggers, "tab");
    assign(contents, "tab");
  }

  if (node.type === "shadcn.accordion") {
    assign(node.children.filter((c) => c.type === "shadcn.accordion-item"), "item");
  }

  node.children.forEach((c) => collectFixes(c, fixes));
}

function applyFixes(node: TreeNode, fixes: Map<string, string>) {
  const v = fixes.get(node.id);
  if (v) node.props = { ...node.props, value: v };
  node.children.forEach((c) => applyFixes(c, fixes));
}

// Trả về cây mới nếu có node cần sửa value, null nếu đã chuẩn (tránh lặp vô hạn).
export function normalizeClusterValues(tree: TreeNode): TreeNode | null {
  const fixes = new Map<string, string>();
  collectFixes(tree, fixes);
  if (fixes.size === 0) return null;
  const next = structuredClone(tree);
  applyFixes(next, fixes);
  return next;
}
```

## 2. `builder-store.ts`

Thêm import, rồi đặt đoạn này **ngay sau** `export const useBuilderStore = create<...>(...)`:

```ts
import { normalizeClusterValues } from "@/core/utils/normalize-cluster-values";

useBuilderStore.subscribe((state, prev) => {
  if (state.tree === prev.tree) return;
  const fixed = normalizeClusterValues(state.tree);
  if (fixed) useBuilderStore.setState({ tree: fixed });
});
```

Đoạn "chống trùng `value`" mình đề xuất ở v6.1 giờ **không cần nữa**, bạn có thể xóa.

## 3. `renderer-map.tsx`

**Import thêm:**

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
```

**Helper**, đặt cạnh `placeholderEntry`:

```tsx
const classAttr = (c: string) => (c ? ` className="${escapeAttr(c)}"` : "");
const valueOf = (node: TreeNode, fallback: string) =>
  String((node.props as { value?: string }).value ?? fallback);

// Đếm trigger để remount khi thêm/xóa tab (tránh kẹt ở tab đã bị xóa)
const countTabTriggers = (node: TreeNode) =>
  node.children
    .filter((c) => c.type === "shadcn.tabs-list")
    .reduce((n, l) => n + l.children.length, 0);
```

**Thay 2 dòng** `"shadcn.tabs": placeholderEntry("Tabs")` và `"shadcn.accordion": placeholderEntry("Accordion")` bằng:

```tsx
  // ══ shadcn — Tabs (cụm) ══
  "shadcn.tabs": {
    jsxTagName: "Tabs",
    importStatement: `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";`,
    render: (node, children, className) => (
      <Tabs key={countTabTriggers(node)} data-node-id={node.id} defaultValue="tab-1" className={className}>
        {children}
      </Tabs>
    ),
    toJsx: (_node, childrenJsx, className, pad) =>
      `${pad}<Tabs defaultValue="tab-1"${classAttr(className)}>\n${childrenJsx}\n${pad}</Tabs>`,
  },
  "shadcn.tabs-list": {
    jsxTagName: "TabsList",
    render: (node, children, className) => (
      <TabsList data-node-id={node.id} className={className}>{children}</TabsList>
    ),
  },
  "shadcn.tabs-trigger": {
    jsxTagName: "TabsTrigger",
    render: (node, _children, className) => {
      const props = node.props as { text: string };
      return (
        <TabsTrigger data-node-id={node.id} value={valueOf(node, "tab-1")} className={className}>
          {props.text}
        </TabsTrigger>
      );
    },
    toJsx: (node, _c, className, pad) => {
      const props = node.props as { text: string };
      return `${pad}<TabsTrigger value="${escapeAttr(valueOf(node, "tab-1"))}"${classAttr(className)}>${escapeJsxText(props.text)}</TabsTrigger>`;
    },
  },
  "shadcn.tabs-content": {
    jsxTagName: "TabsContent",
    render: (node, children, className) => (
      <TabsContent data-node-id={node.id} value={valueOf(node, "tab-1")} className={className}>
        {children}
      </TabsContent>
    ),
    toJsx: (node, childrenJsx, className, pad) =>
      `${pad}<TabsContent value="${escapeAttr(valueOf(node, "tab-1"))}"${classAttr(className)}>\n${childrenJsx}\n${pad}</TabsContent>`,
  },

  // ══ shadcn — Accordion (cụm) ══
  "shadcn.accordion": {
    jsxTagName: "Accordion",
    importStatement: `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";`,
    render: (node, children, className) => (
      <Accordion
        key={node.children.length}
        data-node-id={node.id}
        type="single"
        collapsible
        defaultValue="item-1"
        className={className}
      >
        {children}
      </Accordion>
    ),
    toJsx: (_node, childrenJsx, className, pad) =>
      `${pad}<Accordion type="single" collapsible defaultValue="item-1"${classAttr(className)}>\n${childrenJsx}\n${pad}</Accordion>`,
  },
  "shadcn.accordion-item": {
    jsxTagName: "AccordionItem",
    render: (node, children, className) => (
      <AccordionItem data-node-id={node.id} value={valueOf(node, "item-1")} className={className}>
        {children}
      </AccordionItem>
    ),
    toJsx: (node, childrenJsx, className, pad) =>
      `${pad}<AccordionItem value="${escapeAttr(valueOf(node, "item-1"))}"${classAttr(className)}>\n${childrenJsx}\n${pad}</AccordionItem>`,
  },
  "shadcn.accordion-trigger": {
    jsxTagName: "AccordionTrigger",
    render: (node, _children, className) => {
      const props = node.props as { text: string };
      return <AccordionTrigger data-node-id={node.id} className={className}>{props.text}</AccordionTrigger>;
    },
  },
  "shadcn.accordion-content": {
    jsxTagName: "AccordionContent",
    render: (node, children, className) => (
      <AccordionContent data-node-id={node.id} className={className}>{children}</AccordionContent>
    ),
  },
```

`accordion-trigger` và `accordion-content` dùng được đường dẫn generic của `json-to-jsx.ts` (một cái có `text`, một cái là container), nên không cần `toJsx`. Chỉ `import` ở node gốc là đủ, vì `collectImports` gom theo Set.

## 4. `ui-dependencies.ts`

```ts
  "shadcn.tabs": ["tabs"],
  "shadcn.tabs-list": ["tabs"],
  "shadcn.tabs-trigger": ["tabs"],
  "shadcn.tabs-content": ["tabs"],
  "shadcn.accordion": ["accordion"],
  "shadcn.accordion-item": ["accordion"],
  "shadcn.accordion-trigger": ["accordion"],
  "shadcn.accordion-content": ["accordion"],
```

Sửa luôn comment cuối file: Tabs và Accordion không còn là placeholder.

## 5. Định nghĩa node (làm khuôn cho v6.3)

Trong `shadcn-nodes.ts`, **thay 2 dòng** `shadcn.tabs` và `shadcn.accordion` hiện có bằng khối này. Đây là phần của v6.3, mình đưa luôn Tabs và Accordion để bạn thử được ngay:

```ts
  {
    id: "shadcn.tabs", title: "Tabs", category: "Navigation", tier: "component",
    tags: ["navigation", "tabs", "shadcn"], canHaveChildren: true,
    defaultProps: {}, propsSchema: [],
    allowedChildIds: ["shadcn.tabs-list", "shadcn.tabs-content"],
    defaultChildren: [
      { defId: "shadcn.tabs-list", children: [
        { defId: "shadcn.tabs-trigger", props: { text: "Tab 1" } },
        { defId: "shadcn.tabs-trigger", props: { text: "Tab 2" } },
      ]},
      { defId: "shadcn.tabs-content", children: [{ defId: "html.p", props: { text: "Nội dung của Tab 1." } }] },
      { defId: "shadcn.tabs-content", children: [{ defId: "html.p", props: { text: "Nội dung của Tab 2." } }] },
    ],
  },
  { id: "shadcn.tabs-list", title: "Tabs List", category: "Navigation", tags: ["tabs"],
    canHaveChildren: true, defaultProps: {}, propsSchema: [],
    parentOnly: ["shadcn.tabs"], allowedChildIds: ["shadcn.tabs-trigger"] },
  { id: "shadcn.tabs-trigger", title: "Tab", category: "Navigation", tags: ["tabs", "trigger"],
    canHaveChildren: false, defaultProps: { text: "Tab mới" },
    propsSchema: [{ key: "text", label: "Tiêu đề tab", inputType: "text" }],
    parentOnly: ["shadcn.tabs-list"] },
  { id: "shadcn.tabs-content", title: "Tab Content", category: "Navigation", tags: ["tabs", "content"],
    canHaveChildren: true, defaultProps: {}, defaultStyle: { direction: "flex-col", gap: 2, padding: 2 },
    propsSchema: [], parentOnly: ["shadcn.tabs"],
    defaultChildren: [{ defId: "html.p", props: { text: "Nội dung tab mới." } }] },

  {
    id: "shadcn.accordion", title: "Accordion", category: "Layout", tier: "component",
    tags: ["layout", "accordion", "collapsible", "shadcn"], canHaveChildren: true,
    defaultProps: {}, propsSchema: [],
    allowedChildIds: ["shadcn.accordion-item"],
    defaultChildren: [1, 2, 3].map((n) => ({
      defId: "shadcn.accordion-item",
      children: [
        { defId: "shadcn.accordion-trigger", props: { text: `Câu hỏi ${n}` } },
        { defId: "shadcn.accordion-content", children: [{ defId: "html.p", props: { text: `Câu trả lời ${n}.` } }] },
      ],
    })),
  },
  { id: "shadcn.accordion-item", title: "Accordion Item", category: "Layout", tags: ["accordion", "item"],
    canHaveChildren: true, defaultProps: {}, propsSchema: [],
    parentOnly: ["shadcn.accordion"],
    allowedChildIds: ["shadcn.accordion-trigger", "shadcn.accordion-content"],
    defaultChildren: [
      { defId: "shadcn.accordion-trigger", props: { text: "Tiêu đề mới" } },
      { defId: "shadcn.accordion-content", children: [{ defId: "html.p", props: { text: "Nội dung mới." } }] },
    ] },
  { id: "shadcn.accordion-trigger", title: "Accordion Trigger", category: "Layout", tags: ["accordion", "trigger"],
    canHaveChildren: false, defaultProps: { text: "Tiêu đề" },
    propsSchema: [{ key: "text", label: "Tiêu đề", inputType: "text" }],
    parentOnly: ["shadcn.accordion-item"] },
  { id: "shadcn.accordion-content", title: "Accordion Content", category: "Layout", tags: ["accordion", "content"],
    canHaveChildren: true, defaultProps: {}, defaultStyle: { direction: "flex-col", gap: 2 },
    propsSchema: [], parentOnly: ["shadcn.accordion-item"] },
```

## 6. Lọc palette (vá nhỏ, chuẩn bị cho v6.8)

Nếu không lọc, các ô Tab/Accordion Item sẽ hiện khắp nơi và bấm không có tác dụng. Trong `quick-add-dropdown.tsx`, sửa `groupedDefs`:

```tsx
import { canContain } from "@/core/registry/node-rules";

const groupedDefs = useMemo(() => {
  const q = query.trim();
  const allowed = (d: NonNullable<ReturnType<typeof getNodeDefinition>>) =>
    (d.nodeKind === "html" || d.nodeKind === "shadcn") &&
    !!parentDef && canContain(parentDef, d.nodeKind, d);

  const defs = searchNodes(q).filter(allowed);
  const groups = new Map<string, typeof defs>();

  if (!q) {
    const common = commonNodeIds
      .map((id) => getNodeDefinition(id))
      .filter((d): d is NonNullable<typeof d> => !!d && allowed(d));
    if (common.length) groups.set("Hay dùng", common);
  }

  for (const d of defs) {
    const key = d.category ?? "Khác";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  }
  return Array.from(groups.entries());
}, [query, parentDef]);
```

Khi chọn `Tabs List`, palette chỉ còn ô **Tab**. Khi chọn `Tabs`, chỉ còn **Tabs List** và **Tab Content**.

## Kiểm tra sau v6.2

1. Thêm `Tabs` vào Page: có 2 tab, bấm qua lại được, nội dung đổi theo.
2. Chọn `Tabs List`, thêm một `Tab`, rồi chọn `Tabs` và thêm `Tab Content`: tab thứ 3 hoạt động, không cần đặt `value`.
3. Xóa một tab: không bị trống màn hình.
4. Mở **Code** và **Export**: ra `<Tabs defaultValue="tab-1">` với `value` khớp nhau, kèm `import ... from "@/components/ui/tabs"`.
5. Accordion: 3 mục, mục 1 mở sẵn.

## Hạn chế cần biết

- Chọn một node nằm trong tab chưa mở bằng cây bên trái thì canvas **chưa tự chuyển** sang tab đó. Bạn bấm vào tab để mở. Mình để việc tự chuyển tab cho bản sau (cần biết `activeNodeId` nằm trong tab nào).
- `Tab Content` rỗng sẽ không thấy trên canvas, nên mình đặt sẵn 1 đoạn `p` làm nội dung mặc định.

Bạn áp dụng xong báo kết quả. Nếu chạy ổn, v6.3 mình làm các cụm còn lại (Table, Dialog, Sheet, Dropdown, Breadcrumb...) theo đúng khuôn này. Lúc đó mình cần xem `components/ui/dialog.tsx` và `dropdown-menu.tsx` để chắc các sub-component đúng tên.

# v6.3: Cụm còn lại

Bản này làm các cụm: **Dialog, Alert Dialog, Sheet, Popover, Hover Card, Dropdown Menu, Context Menu, Menubar, Breadcrumb, Navigation Menu, Table, Collapsible, Resizable**. Mình gom luôn phần nội dung mẫu của chúng, nên một phần v6.4 đã xong ở đây.

Để bạn đỡ phải xóa sửa nhiều chỗ, mình đặt code vào **2 file mới** và chỉ sửa 3 chỗ nhỏ ở file cũ.

## Cài thêm trước

```bash
npx shadcn@latest add accordion collapsible sheet hover-card context-menu resizable
```

Cây thư mục README của bạn chưa có 6 file này (`resizable` kéo theo `react-resizable-panels`).

## Hướng làm cho overlay

Canvas của bạn nằm trong shadow root, còn Radix Dialog, Sheet, Popover, Dropdown... render qua Portal ra ngoài, mất style và còn chặn thao tác. Vì vậy:

- **Canvas**: vẽ "luôn mở" bằng `div` thường (giữ cách V1), để chọn và sửa node con thoải mái.
- **Code xuất ra**: sinh JSX shadcn thật (`<Dialog><DialogTrigger>...`).

## 1. File mới `core/registry/shadcn-cluster-nodes.ts`

```ts
import { NodeDefinition, NodeCategory, DefaultChildSpec } from "@/core/types/node-definition.types";

type RawDef = Omit<NodeDefinition, "nodeKind">;

const D = (n: number, f: (i: number) => DefaultChildSpec) =>
  Array.from({ length: n }, (_, i) => f(i + 1));
const p = (text: string): DefaultChildSpec => ({ defId: "html.p", props: { text } });

// Node con dạng chữ (leaf có text)
const txt = (id: string, title: string, parent: string | string[], text: string, category: NodeCategory): RawDef => ({
  id, title, category, tags: [title.toLowerCase(), "shadcn"], canHaveChildren: false,
  defaultProps: { text }, propsSchema: [{ key: "text", label: "Nội dung", inputType: "text" }],
  parentOnly: Array.isArray(parent) ? parent : [parent],
});
// Node con dạng chứa (container)
const box = (id: string, title: string, parent: string | string[], category: NodeCategory, extra: Partial<RawDef> = {}): RawDef => ({
  id, title, category, tags: [title.toLowerCase(), "shadcn"], canHaveChildren: true,
  defaultProps: {}, propsSchema: [], parentOnly: Array.isArray(parent) ? parent : [parent], ...extra,
});
// Node con không có nội dung (separator, handle)
const leaf = (id: string, title: string, parent: string, category: NodeCategory, extra: Partial<RawDef> = {}): RawDef => ({
  id, title, category, tags: [title.toLowerCase(), "shadcn"], canHaveChildren: false,
  defaultProps: {}, propsSchema: [], parentOnly: [parent], ...extra,
});
// Node gốc dạng overlay: trigger + content
const overlay = (
  id: string, title: string, category: NodeCategory, triggerText: string,
  children: DefaultChildSpec[], extra: Partial<RawDef> = {}
): RawDef => ({
  id, title, category, tier: "component", tags: [title.toLowerCase(), "overlay", "shadcn"],
  canHaveChildren: true, defaultProps: { triggerText },
  propsSchema: [{ key: "triggerText", label: "Text nút mở", inputType: "text" }],
  defaultChildren: children, ...extra,
});

export const clusterRawNodes: RawDef[] = [
  // ── Dialog ──
  overlay("shadcn.dialog", "Dialog", "Overlay", "Mở hộp thoại", [
    { defId: "shadcn.dialog-title" },
    { defId: "shadcn.dialog-description" },
    { defId: "shadcn.dialog-footer", children: [{ defId: "shadcn.button", props: { text: "Lưu thay đổi" } }] },
  ]),
  txt("shadcn.dialog-title", "Dialog Title", "shadcn.dialog", "Tiêu đề hộp thoại", "Overlay"),
  txt("shadcn.dialog-description", "Dialog Description", "shadcn.dialog", "Mô tả ngắn cho hộp thoại này.", "Overlay"),
  box("shadcn.dialog-footer", "Dialog Footer", "shadcn.dialog", "Overlay"),

  // ── Alert Dialog ──
  overlay("shadcn.alert-dialog", "Alert Dialog", "Overlay", "Xóa", [
    { defId: "shadcn.alert-dialog-title" },
    { defId: "shadcn.alert-dialog-description" },
    { defId: "shadcn.alert-dialog-footer", children: [
      { defId: "shadcn.alert-dialog-cancel" },
      { defId: "shadcn.alert-dialog-action" },
    ]},
  ]),
  txt("shadcn.alert-dialog-title", "Alert Title", "shadcn.alert-dialog", "Bạn có chắc chắn?", "Overlay"),
  txt("shadcn.alert-dialog-description", "Alert Description", "shadcn.alert-dialog", "Hành động này không thể hoàn tác.", "Overlay"),
  box("shadcn.alert-dialog-footer", "Alert Footer", "shadcn.alert-dialog", "Overlay"),
  txt("shadcn.alert-dialog-cancel", "Alert Cancel", "shadcn.alert-dialog-footer", "Hủy", "Overlay"),
  txt("shadcn.alert-dialog-action", "Alert Action", "shadcn.alert-dialog-footer", "Tiếp tục", "Overlay"),

  // ── Sheet ──
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

  // ── Popover / Hover Card ──
  overlay("shadcn.popover", "Popover", "Overlay", "Mở popover", [p("Nội dung popover.")]),
  overlay("shadcn.hover-card", "Hover Card", "Overlay", "Rê chuột vào đây", [p("Thông tin xem trước.")]),

  // ── Dropdown Menu ──
  overlay("shadcn.dropdown-menu", "Dropdown Menu", "Overlay", "Menu", [
    { defId: "shadcn.dropdown-menu-label", props: { text: "Tài khoản" } },
    { defId: "shadcn.dropdown-menu-item", props: { text: "Hồ sơ" } },
    { defId: "shadcn.dropdown-menu-item", props: { text: "Cài đặt" } },
    { defId: "shadcn.dropdown-menu-separator" },
    { defId: "shadcn.dropdown-menu-item", props: { text: "Đăng xuất" } },
  ], { allowedChildIds: ["shadcn.dropdown-menu-label", "shadcn.dropdown-menu-item", "shadcn.dropdown-menu-separator"] }),
  txt("shadcn.dropdown-menu-label", "Menu Label", "shadcn.dropdown-menu", "Nhóm", "Overlay"),
  txt("shadcn.dropdown-menu-item", "Menu Item", "shadcn.dropdown-menu", "Mục mới", "Overlay"),
  leaf("shadcn.dropdown-menu-separator", "Menu Separator", "shadcn.dropdown-menu", "Overlay"),

  // ── Context Menu ──
  overlay("shadcn.context-menu", "Context Menu", "Overlay", "Chuột phải vào đây", [
    { defId: "shadcn.context-menu-item", props: { text: "Sao chép" } },
    { defId: "shadcn.context-menu-item", props: { text: "Dán" } },
    { defId: "shadcn.context-menu-separator" },
    { defId: "shadcn.context-menu-item", props: { text: "Xóa" } },
  ], { allowedChildIds: ["shadcn.context-menu-label", "shadcn.context-menu-item", "shadcn.context-menu-separator"] }),
  txt("shadcn.context-menu-label", "Context Label", "shadcn.context-menu", "Nhóm", "Overlay"),
  txt("shadcn.context-menu-item", "Context Item", "shadcn.context-menu", "Mục mới", "Overlay"),
  leaf("shadcn.context-menu-separator", "Context Separator", "shadcn.context-menu", "Overlay"),

  // ── Menubar ──
  {
    id: "shadcn.menubar", title: "Menubar", category: "Navigation", tier: "component",
    tags: ["navigation", "menubar", "shadcn"], canHaveChildren: true,
    defaultProps: {}, propsSchema: [], allowedChildIds: ["shadcn.menubar-menu"],
    defaultChildren: [
      { defId: "shadcn.menubar-menu", props: { title: "Tệp" }, children: [
        { defId: "shadcn.menubar-item", props: { text: "Mới" } },
        { defId: "shadcn.menubar-item", props: { text: "Mở" } },
        { defId: "shadcn.menubar-separator" },
        { defId: "shadcn.menubar-item", props: { text: "Thoát" } },
      ]},
      { defId: "shadcn.menubar-menu", props: { title: "Chỉnh sửa" }, children: [
        { defId: "shadcn.menubar-item", props: { text: "Hoàn tác" } },
        { defId: "shadcn.menubar-item", props: { text: "Làm lại" } },
      ]},
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

  // ── Breadcrumb ──
  {
    id: "shadcn.breadcrumb", title: "Breadcrumb", category: "Navigation", tier: "component",
    tags: ["navigation", "breadcrumb", "path", "shadcn"], canHaveChildren: true,
    defaultProps: {}, propsSchema: [],
    allowedChildIds: ["shadcn.breadcrumb-item", "shadcn.breadcrumb-page", "shadcn.breadcrumb-separator"],
    defaultChildren: [
      { defId: "shadcn.breadcrumb-item", props: { text: "Trang chủ", href: "/" } },
      { defId: "shadcn.breadcrumb-separator" },
      { defId: "shadcn.breadcrumb-item", props: { text: "Sản phẩm", href: "#" } },
      { defId: "shadcn.breadcrumb-separator" },
      { defId: "shadcn.breadcrumb-page", props: { text: "Chi tiết" } },
    ],
  },
  txt("shadcn.breadcrumb-item", "Breadcrumb Link", "shadcn.breadcrumb", "Liên kết", "Navigation", ),
  txt("shadcn.breadcrumb-page", "Breadcrumb Page", "shadcn.breadcrumb", "Trang hiện tại", "Navigation"),
  leaf("shadcn.breadcrumb-separator", "Breadcrumb Separator", "shadcn.breadcrumb", "Navigation"),

  // ── Navigation Menu ──
  {
    id: "shadcn.navigation-menu", title: "Navigation Menu", category: "Navigation", tier: "component",
    tags: ["navigation", "menu", "shadcn"], canHaveChildren: true,
    defaultProps: {}, propsSchema: [], allowedChildIds: ["shadcn.navigation-menu-link"],
    defaultChildren: [
      { defId: "shadcn.navigation-menu-link", props: { text: "Trang chủ" } },
      { defId: "shadcn.navigation-menu-link", props: { text: "Giới thiệu" } },
      { defId: "shadcn.navigation-menu-link", props: { text: "Liên hệ" } },
    ],
  },

  // ── Table ──
  {
    id: "shadcn.table", title: "Table", category: "Data Display", tier: "component",
    tags: ["data", "table", "grid", "shadcn"], canHaveChildren: true,
    defaultProps: {}, propsSchema: [], allowedChildIds: ["shadcn.table-header", "shadcn.table-body"],
    defaultChildren: [
      { defId: "shadcn.table-header", children: [
        { defId: "shadcn.table-row", children: D(3, (i) => ({ defId: "shadcn.table-head", props: { text: `Cột ${i}` } })) },
      ]},
      { defId: "shadcn.table-body", children: D(3, (r) => ({
        defId: "shadcn.table-row",
        children: D(3, (c) => ({ defId: "shadcn.table-cell", props: { text: `Ô ${r}.${c}` } })),
      }))},
    ],
  },
  box("shadcn.table-header", "Table Header", "shadcn.table", "Data Display", { allowedChildIds: ["shadcn.table-row"] }),
  box("shadcn.table-body", "Table Body", "shadcn.table", "Data Display", { allowedChildIds: ["shadcn.table-row"] }),
  box("shadcn.table-row", "Table Row", ["shadcn.table-header", "shadcn.table-body"], "Data Display", {
    allowedChildIds: ["shadcn.table-head", "shadcn.table-cell"],
    defaultChildren: D(3, (i) => ({ defId: "shadcn.table-cell", props: { text: `Ô ${i}` } })),
  }),
  txt("shadcn.table-head", "Table Head", "shadcn.table-row", "Tiêu đề", "Data Display"),
  txt("shadcn.table-cell", "Table Cell", "shadcn.table-row", "Ô", "Data Display"),

  // ── Collapsible ──
  {
    id: "shadcn.collapsible", title: "Collapsible", category: "Layout", tier: "component",
    tags: ["layout", "collapsible", "toggle", "shadcn"], canHaveChildren: true,
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

  // ── Resizable ──
  {
    id: "shadcn.resizable", title: "Resizable", category: "Layout", tier: "component",
    tags: ["layout", "resizable", "panel", "shadcn"], canHaveChildren: true,
    defaultProps: { direction: "horizontal" },
    propsSchema: [{ key: "direction", label: "Hướng chia", inputType: "select", options: ["horizontal", "vertical"] }],
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
```

Lưu ý: dòng `txt("shadcn.breadcrumb-item", ...)` cần thêm `href`. Sau khi tạo `txt`, thêm hai thuộc tính này cho 2 node có link (cho gọn mình dùng spread):

```ts
// thay 2 dòng breadcrumb-item và navigation-menu-link bằng:
{ ...txt("shadcn.breadcrumb-item", "Breadcrumb Link", "shadcn.breadcrumb", "Liên kết", "Navigation"),
  defaultProps: { text: "Liên kết", href: "#" },
  propsSchema: [
    { key: "text", label: "Nội dung", inputType: "text" },
    { key: "href", label: "Đường dẫn (href)", inputType: "text" },
  ] },
{ ...txt("shadcn.navigation-menu-link", "Nav Link", "shadcn.navigation-menu", "Liên kết", "Navigation"),
  defaultProps: { text: "Liên kết", href: "#" },
  propsSchema: [
    { key: "text", label: "Nội dung", inputType: "text" },
    { key: "href", label: "Đường dẫn (href)", inputType: "text" },
  ] },
```

(Đặt `navigation-menu-link` ngay sau `navigation-menu` trong mảng.)

## 2. `shadcn-nodes.ts`: sửa phần cuối

Thay dòng `export const shadcnNodes ...` cuối file bằng:

```ts
import { clusterRawNodes } from "./shadcn-cluster-nodes";

// Định nghĩa trong cluster ghi đè bản cũ cùng id → không cần xóa tay các dòng cũ ngay
const clusterIds = new Set(clusterRawNodes.map((d) => d.id));

export const shadcnNodes: NodeDefinition[] = [
  ...rawShadcnNodes.filter((d) => !clusterIds.has(d.id)),
  ...clusterRawNodes,
].map((d) => ({ ...d, nodeKind: "shadcn", version: 1 }));
```

Đây cũng là chỗ sửa lỗi cũ của `shadcn.resizable` (`defaultProps.splitDirection` không khớp `propsSchema.direction`).

## 3. File mới `features/canvas-preview/constants/cluster-renderers.tsx`

```tsx
import React from "react";
import type { RendererEntry } from "./renderer-map";
import { cn } from "@/core/utils/cn";
import { escapeJsxText, escapeAttr } from "@/core/utils/escape-jsx-text";
import { TreeNode } from "@/core/types/builder.types";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink,
} from "@/components/ui/navigation-menu";

const classAttr = (c: string) => (c ? ` className="${escapeAttr(c)}"` : "");
const prop = (node: TreeNode, key: string, fallback = "") =>
  String((node.props as Record<string, unknown>)[key] ?? fallback);

// ── Helper dựng entry ──

function textEntry(jsxTagName: string, tag: string, base: string): RendererEntry {
  return {
    jsxTagName,
    render: (node, _c, className) =>
      React.createElement(tag, { "data-node-id": node.id, className: cn(base, className) }, prop(node, "text")),
  };
}

function boxEntry(jsxTagName: string, tag: string, base: string, importStatement?: string): RendererEntry {
  return {
    jsxTagName,
    importStatement,
    render: (node, children, className) =>
      React.createElement(tag, { "data-node-id": node.id, className: cn(base, className) }, children),
  };
}

function leafEntry(jsxTagName: string, tag: string, base: string): RendererEntry {
  return {
    jsxTagName,
    render: (node, _c, className) =>
      React.createElement(tag, { "data-node-id": node.id, className: cn(base, className) }),
  };
}

// Overlay: canvas vẽ "luôn mở" bằng div; code xuất ra là JSX shadcn thật.
function overlayEntry(o: {
  label: string; root: string; trigger: string; content: string; importStatement: string;
  contentAttrs?: (node: TreeNode) => string;
}): RendererEntry {
  return {
    jsxTagName: o.root,
    importStatement: o.importStatement,
    render: (node, children, className) => (
      <div data-node-id={node.id} className={cn("rounded-md border border-dashed border-muted-foreground/40 p-3", className)}>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded border bg-background px-3 py-1 text-sm">{prop(node, "triggerText", "Open")}</span>
          <span className="text-[10px] text-muted-foreground">{o.label} · xem trước (luôn mở)</span>
        </div>
        <div className="flex flex-col gap-2 rounded-md border bg-background p-3 shadow-sm">{children}</div>
      </div>
    ),
    toJsx: (node, childrenJsx, className, pad) => {
      const extra = o.contentAttrs?.(node) ?? "";
      const trig = escapeJsxText(prop(node, "triggerText", "Open"));
      return `${pad}<${o.root}>\n${pad}  <${o.trigger}>${trig}</${o.trigger}>\n${pad}  <${o.content}${extra}${classAttr(className)}>\n${childrenJsx}\n${pad}  </${o.content}>\n${pad}</${o.root}>`;
    },
  };
}

// ── Imports xuất code ──
const IMP = {
  dialog: `import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";`,
  alert: `import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";`,
  sheet: `import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";`,
  popover: `import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";`,
  hover: `import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";`,
  dropdown: `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";`,
  context: `import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuLabel, ContextMenuItem, ContextMenuSeparator } from "@/components/ui/context-menu";`,
  menubar: `import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarSeparator } from "@/components/ui/menubar";`,
  breadcrumb: `import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";`,
  navmenu: `import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";`,
  table: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";`,
  collapsible: `import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";`,
  resizable: `import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";`,
};

const MENU_ITEM = "rounded-sm px-2 py-1.5 text-sm";
const MENU_LABEL = "px-2 py-1.5 text-sm font-semibold";
const MENU_SEP = "my-1 h-px bg-border";

export const clusterRenderers: Record<string, RendererEntry> = {
  // ══ Dialog ══
  "shadcn.dialog": overlayEntry({ label: "Dialog", root: "Dialog", trigger: "DialogTrigger", content: "DialogContent", importStatement: IMP.dialog }),
  "shadcn.dialog-title": textEntry("DialogTitle", "h4", "text-lg font-semibold"),
  "shadcn.dialog-description": textEntry("DialogDescription", "p", "text-sm text-muted-foreground"),
  "shadcn.dialog-footer": boxEntry("DialogFooter", "div", "flex justify-end gap-2"),

  // ══ Alert Dialog ══
  "shadcn.alert-dialog": overlayEntry({ label: "Alert Dialog", root: "AlertDialog", trigger: "AlertDialogTrigger", content: "AlertDialogContent", importStatement: IMP.alert }),
  "shadcn.alert-dialog-title": textEntry("AlertDialogTitle", "h4", "text-lg font-semibold"),
  "shadcn.alert-dialog-description": textEntry("AlertDialogDescription", "p", "text-sm text-muted-foreground"),
  "shadcn.alert-dialog-footer": boxEntry("AlertDialogFooter", "div", "flex justify-end gap-2"),
  "shadcn.alert-dialog-cancel": textEntry("AlertDialogCancel", "span", "rounded-md border px-3 py-1.5 text-sm"),
  "shadcn.alert-dialog-action": textEntry("AlertDialogAction", "span", "rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"),

  // ══ Sheet ══
  "shadcn.sheet": overlayEntry({
    label: "Sheet", root: "Sheet", trigger: "SheetTrigger", content: "SheetContent", importStatement: IMP.sheet,
    contentAttrs: (n) => ` side="${escapeAttr(prop(n, "side", "right"))}"`,
  }),
  "shadcn.sheet-title": textEntry("SheetTitle", "h4", "text-lg font-semibold"),
  "shadcn.sheet-description": textEntry("SheetDescription", "p", "text-sm text-muted-foreground"),

  // ══ Popover / Hover Card ══
  "shadcn.popover": overlayEntry({ label: "Popover", root: "Popover", trigger: "PopoverTrigger", content: "PopoverContent", importStatement: IMP.popover }),
  "shadcn.hover-card": overlayEntry({ label: "Hover Card", root: "HoverCard", trigger: "HoverCardTrigger", content: "HoverCardContent", importStatement: IMP.hover }),

  // ══ Dropdown Menu ══
  "shadcn.dropdown-menu": overlayEntry({ label: "Dropdown", root: "DropdownMenu", trigger: "DropdownMenuTrigger", content: "DropdownMenuContent", importStatement: IMP.dropdown }),
  "shadcn.dropdown-menu-label": textEntry("DropdownMenuLabel", "div", MENU_LABEL),
  "shadcn.dropdown-menu-item": textEntry("DropdownMenuItem", "div", MENU_ITEM),
  "shadcn.dropdown-menu-separator": leafEntry("DropdownMenuSeparator", "div", MENU_SEP),

  // ══ Context Menu ══
  "shadcn.context-menu": overlayEntry({ label: "Context Menu", root: "ContextMenu", trigger: "ContextMenuTrigger", content: "ContextMenuContent", importStatement: IMP.context }),
  "shadcn.context-menu-label": textEntry("ContextMenuLabel", "div", MENU_LABEL),
  "shadcn.context-menu-item": textEntry("ContextMenuItem", "div", MENU_ITEM),
  "shadcn.context-menu-separator": leafEntry("ContextMenuSeparator", "div", MENU_SEP),

  // ══ Menubar ══
  "shadcn.menubar": boxEntry("Menubar", "div", "flex gap-4 rounded-md border p-1", IMP.menubar),
  "shadcn.menubar-menu": {
    jsxTagName: "MenubarMenu",
    render: (node, children, className) => (
      <div data-node-id={node.id} className={cn("flex flex-col gap-1", className)}>
        <span className="px-2 py-1 text-sm font-medium">{prop(node, "title", "Menu")}</span>
        <div className="flex min-w-32 flex-col rounded-md border bg-background p-1 shadow-sm">{children}</div>
      </div>
    ),
    toJsx: (node, childrenJsx, className, pad) =>
      `${pad}<MenubarMenu>\n${pad}  <MenubarTrigger>${escapeJsxText(prop(node, "title", "Menu"))}</MenubarTrigger>\n${pad}  <MenubarContent${classAttr(className)}>\n${childrenJsx}\n${pad}  </MenubarContent>\n${pad}</MenubarMenu>`,
  },
  "shadcn.menubar-item": textEntry("MenubarItem", "div", MENU_ITEM),
  "shadcn.menubar-separator": leafEntry("MenubarSeparator", "div", MENU_SEP),

  // ══ Breadcrumb ══
  "shadcn.breadcrumb": {
    jsxTagName: "Breadcrumb",
    importStatement: IMP.breadcrumb,
    render: (node, children, className) => (
      <Breadcrumb data-node-id={node.id} className={className}>
        <BreadcrumbList>{children}</BreadcrumbList>
      </Breadcrumb>
    ),
    toJsx: (_n, childrenJsx, _cls, pad) =>
      `${pad}<Breadcrumb>\n${pad}  <BreadcrumbList>\n${childrenJsx}\n${pad}  </BreadcrumbList>\n${pad}</Breadcrumb>`,
  },
  "shadcn.breadcrumb-item": {
    jsxTagName: "BreadcrumbItem",
    render: (node, _c, className) => (
      <BreadcrumbItem data-node-id={node.id}>
        <BreadcrumbLink href={prop(node, "href", "#")} className={className} onClick={(e) => e.preventDefault()}>
          {prop(node, "text")}
        </BreadcrumbLink>
      </BreadcrumbItem>
    ),
    toJsx: (node, _c, className, pad) =>
      `${pad}<BreadcrumbItem>\n${pad}  <BreadcrumbLink href="${escapeAttr(prop(node, "href", "#"))}"${classAttr(className)}>${escapeJsxText(prop(node, "text"))}</BreadcrumbLink>\n${pad}</BreadcrumbItem>`,
  },
  "shadcn.breadcrumb-page": {
    jsxTagName: "BreadcrumbItem",
    render: (node, _c, className) => (
      <BreadcrumbItem data-node-id={node.id}>
        <BreadcrumbPage className={className}>{prop(node, "text")}</BreadcrumbPage>
      </BreadcrumbItem>
    ),
    toJsx: (node, _c, className, pad) =>
      `${pad}<BreadcrumbItem>\n${pad}  <BreadcrumbPage${classAttr(className)}>${escapeJsxText(prop(node, "text"))}</BreadcrumbPage>\n${pad}</BreadcrumbItem>`,
  },
  "shadcn.breadcrumb-separator": {
    jsxTagName: "BreadcrumbSeparator",
    render: (node) => <BreadcrumbSeparator data-node-id={node.id} />,
  },

  // ══ Navigation Menu ══
  "shadcn.navigation-menu": {
    jsxTagName: "NavigationMenu",
    importStatement: IMP.navmenu,
    render: (node, children, className) => (
      <NavigationMenu data-node-id={node.id} className={className}>
        <NavigationMenuList>{children}</NavigationMenuList>
      </NavigationMenu>
    ),
    toJsx: (_n, childrenJsx, _cls, pad) =>
      `${pad}<NavigationMenu>\n${pad}  <NavigationMenuList>\n${childrenJsx}\n${pad}  </NavigationMenuList>\n${pad}</NavigationMenu>`,
  },
  "shadcn.navigation-menu-link": {
    jsxTagName: "NavigationMenuItem",
    render: (node, _c, className) => (
      <NavigationMenuItem data-node-id={node.id}>
        <NavigationMenuLink href={prop(node, "href", "#")} className={className} onClick={(e) => e.preventDefault()}>
          {prop(node, "text")}
        </NavigationMenuLink>
      </NavigationMenuItem>
    ),
    toJsx: (node, _c, className, pad) =>
      `${pad}<NavigationMenuItem>\n${pad}  <NavigationMenuLink href="${escapeAttr(prop(node, "href", "#"))}"${classAttr(className)}>${escapeJsxText(prop(node, "text"))}</NavigationMenuLink>\n${pad}</NavigationMenuItem>`,
  },

  // ══ Table ══
  "shadcn.table": {
    jsxTagName: "Table", importStatement: IMP.table,
    render: (node, children, className) => <Table data-node-id={node.id} className={className}>{children}</Table>,
  },
  "shadcn.table-header": {
    jsxTagName: "TableHeader",
    render: (node, children, className) => <TableHeader data-node-id={node.id} className={className}>{children}</TableHeader>,
  },
  "shadcn.table-body": {
    jsxTagName: "TableBody",
    render: (node, children, className) => <TableBody data-node-id={node.id} className={className}>{children}</TableBody>,
  },
  "shadcn.table-row": {
    jsxTagName: "TableRow",
    render: (node, children, className) => <TableRow data-node-id={node.id} className={className}>{children}</TableRow>,
  },
  "shadcn.table-head": {
    jsxTagName: "TableHead",
    render: (node, _c, className) => <TableHead data-node-id={node.id} className={className}>{prop(node, "text")}</TableHead>,
  },
  "shadcn.table-cell": {
    jsxTagName: "TableCell",
    render: (node, _c, className) => <TableCell data-node-id={node.id} className={className}>{prop(node, "text")}</TableCell>,
  },

  // ══ Collapsible (canvas luôn mở) ══
  "shadcn.collapsible": boxEntry("Collapsible", "div", "flex flex-col gap-2", IMP.collapsible),
  "shadcn.collapsible-trigger": textEntry("CollapsibleTrigger", "div", "cursor-pointer text-sm font-medium"),
  "shadcn.collapsible-content": boxEntry("CollapsibleContent", "div", "flex flex-col gap-2 border-l pl-3"),

  // ══ Resizable (canvas dùng flex, code xuất dùng react-resizable-panels) ══
  "shadcn.resizable": {
    jsxTagName: "ResizablePanelGroup",
    importStatement: IMP.resizable,
    render: (node, children, className) => (
      <div
        data-node-id={node.id}
        className={cn("flex min-h-24 rounded-md border", prop(node, "direction", "horizontal") === "vertical" ? "flex-col" : "flex-row", className)}
      >
        {children}
      </div>
    ),
  },
  "shadcn.resizable-panel": {
    jsxTagName: "ResizablePanel",
    render: (node, children, className) => (
      <div
        data-node-id={node.id}
        className={className}
        style={{ flex: `${Number(prop(node, "defaultSize", "50")) || 50} 1 0%` }}
      >
        {children}
      </div>
    ),
  },
  "shadcn.resizable-handle": leafEntry("ResizableHandle", "div", "shrink-0 basis-px bg-border"),
};
```

## 4. `renderer-map.tsx`: 2 chỗ

```tsx
import { clusterRenderers } from "./cluster-renderers";
```

Rồi ở **cuối** object `rendererMap`, ngay trước `};` đóng:

```tsx
  // ... các entry cũ ...

  ...clusterRenderers, // 👈 ghi đè placeholder/Table/Breadcrumb/NavMenu/Menubar cũ cùng key
};
```

Phải đặt cuối để thắng các key cũ. Các entry cũ thành mã chết, đến v6.5 mình dọn.

Bộ `import` Radix cho tabs và accordion của v6.2 giữ nguyên.

## 5. `ui-dependencies.ts`: thêm sau khai báo

```ts
const add = (ui: string[], ...ids: string[]) => ids.forEach((id) => { uiDependencies[id] = ui; });

add(["dialog"], "shadcn.dialog", "shadcn.dialog-title", "shadcn.dialog-description", "shadcn.dialog-footer");
add(["alert-dialog", "button"], "shadcn.alert-dialog", "shadcn.alert-dialog-title", "shadcn.alert-dialog-description",
  "shadcn.alert-dialog-footer", "shadcn.alert-dialog-cancel", "shadcn.alert-dialog-action");
add(["sheet"], "shadcn.sheet", "shadcn.sheet-title", "shadcn.sheet-description");
add(["popover"], "shadcn.popover");
add(["hover-card"], "shadcn.hover-card");
add(["dropdown-menu"], "shadcn.dropdown-menu", "shadcn.dropdown-menu-label", "shadcn.dropdown-menu-item", "shadcn.dropdown-menu-separator");
add(["context-menu"], "shadcn.context-menu", "shadcn.context-menu-label", "shadcn.context-menu-item", "shadcn.context-menu-separator");
add(["menubar"], "shadcn.menubar", "shadcn.menubar-menu", "shadcn.menubar-item", "shadcn.menubar-separator");
add(["breadcrumb"], "shadcn.breadcrumb", "shadcn.breadcrumb-item", "shadcn.breadcrumb-page", "shadcn.breadcrumb-separator");
add(["navigation-menu"], "shadcn.navigation-menu", "shadcn.navigation-menu-link");
add(["table"], "shadcn.table", "shadcn.table-header", "shadcn.table-body", "shadcn.table-row", "shadcn.table-head", "shadcn.table-cell");
add(["collapsible"], "shadcn.collapsible", "shadcn.collapsible-trigger", "shadcn.collapsible-content");
add(["resizable"], "shadcn.resizable", "shadcn.resizable-panel", "shadcn.resizable-handle");
```

`alert-dialog` kèm `button` vì `AlertDialogCancel/Action` dùng `buttonVariants`. Mình chưa thấy `collect-ui-dependencies.ts`, nên không chắc nó tự lấy phụ thuộc chéo giữa các file ui. Khai báo thẳng như trên là an toàn nhất.

## Kiểm tra sau v6.3

1. **Dialog** thêm vào Page: hiện nút trigger, tiêu đề, mô tả, footer có nút. Chọn Dialog thì palette có thêm Title/Description/Footer.
2. **Table**: 1 header + 3 dòng. Chọn `Table Body`, thêm `Table Row`, được dòng mới 3 ô.
3. **Breadcrumb**: 3 mục, 2 dấu phân cách. Chọn Breadcrumb thì palette chỉ có Link/Page/Separator.
4. **Menubar**: 2 menu mở sẵn trên canvas, sửa chữ từng mục được.
5. Bấm **Code**: Dialog ra `<Dialog><DialogTrigger>...`, Table ra `<Table><TableHeader>...`, kèm đủ `import`.

## Hạn chế cần biết

- Dòng thêm vào `Table Header` sẽ mang ô thường (`TableCell`) chứ không phải `TableHead`. Cần xóa ô và thêm Table Head thủ công. Mình để cải thiện sau nếu bạn thấy vướng.
- Thụt lề trong code xuất ra của các cụm lệch nhẹ (con thụt ít hơn 1 cấp), giống ghi chú sẵn ở `navigation-menu` cũ. Code vẫn đúng, `prettier` chỉnh được.
- Chưa có icon cho các node con mới, sẽ hiện `Box` mặc định. v6.5/v6.6 bổ sung.

## Phát hiện ngoài lề

`shadcn.checkbox`, `switch`, `radio-group` có `importStatement` chứa luôn dòng `import { Label }`. Khi một project dùng cả `shadcn.label`, code xuất có thể bị **import Label hai lần**. Dòng chữ giống hệt nhau thì `Set` gộp được, nhưng khác dòng thì không. Nếu gặp lỗi `Duplicate identifier 'Label'`, nhắn mình, sửa trong 1 phút ở `collectImports`.

Bạn chạy thử và báo kết quả. Nếu ổn, bước kế tiếp là **v6.4**: nội dung mẫu cho nhóm HTML (`ul/ol/nav`, `Card` đầy đủ) và dọn mã chết. Phần lớn node shadcn đã xong ở v6.3 nên v6.4 sẽ khá ngắn.