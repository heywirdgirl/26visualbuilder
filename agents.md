Đủ rồi, và 4 file này làm lộ ra 2 điều:

- **`globals.css` + `build-zip.ts` xác nhận lỗi mình lo ở v6.7c.** Template xuất ra chỉ có `@import "tailwindcss"`, thiếu toàn bộ theme shadcn và `tw-animate-css`. Project xuất ra sẽ có Button, Card, Tabs không màu, không viền. Mình vá ở cuối bài.
- **`node-list-row.tsx` giải thích lỗi icon.** Nó tra `LucideIcons[iconName]` theo chuỗi mà `def.icon` không node nào có. Nên trình duyệt đầy đủ không có icon, khác với lưới nhanh. Bản này sửa luôn.

# v6.8: Palette 3 tầng

**Thiết kế:**
- **Elements | Components | Blocks**: tab Blocks hiện nhưng khóa (làm ở v6.9).
- **Thành phần của cụm** (Tab, Table Row, Menu Item...): hiện ở khung riêng phía trên, chỉ khi chọn đúng node cha. Khi cha là cụm "kín" như Tabs hay Table, ẩn hẳn 3 tab và chỉ hiện các thành phần hợp lệ.
- **Gõ tìm kiếm**: tìm xuyên cả tầng, ô kết quả gắn nhãn "Cụm" cho component.
- **Category thu gọn được**, mặc định chỉ mở mục đầu.
- Dùng chung một hàm dữ liệu cho cả lưới nhanh lẫn trình duyệt đầy đủ.

## 1. File mới `features/node-palette/utils/palette-data.ts`

```ts
import { NodeDefinition, NodeCategory, NodeTier } from "@/core/types/node-definition.types";
import { searchNodes, getNodeDefinition } from "@/core/registry/node-registry";
import { canContain } from "@/core/registry/node-rules";
import { commonNodeIds } from "../constants/common-node-ids";

export const CATEGORY_ORDER: NodeCategory[] = [
  "Layout", "Typography", "Form", "List", "Media",
  "Navigation", "Overlay", "Data Display", "Feedback", "Templates",
];

export interface PaletteGroup {
  key: string;
  label: string;
  defs: NodeDefinition[];
}

export interface PaletteData {
  sealed: boolean;               // cha chỉ nhận đúng loại con (Tabs, Table...) → ẩn 3 tab
  parts: NodeDefinition[];       // thành phần của cụm cha (có parentOnly)
  searchResults: NodeDefinition[];
  element: PaletteGroup[];
  component: PaletteGroup[];
  counts: { element: number; component: number };
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

  return {
    sealed: !!parentDef?.allowedChildIds,
    parts,
    searchResults: defs,
    element: build("element"),
    component: build("component"),
    counts: {
      element: normal.filter((d) => tierOf(d) === "element").length,
      component: normal.filter((d) => tierOf(d) === "component").length,
    },
  };
}
```

## 2. `common-node-ids.ts`: thêm cụm hay dùng

Danh sách này giờ được lọc theo tầng, nên có thể trộn cả hai loại:

```ts
export const commonNodeIds: string[] = [
  "html.div", "html.section", "html.header", "html.footer",
  "html.h1", "html.h2", "html.p", "html.span",
  "html.a", "html.nav", "html.ul", "html.li",
  "html.img", "html.icon", "html.hr",
  "shadcn.button", "shadcn.input", "shadcn.textarea",
  "shadcn.label", "shadcn.checkbox", "shadcn.switch", "shadcn.select",
  "shadcn.badge", "shadcn.avatar", "shadcn.separator",
  // Components
  "shadcn.card", "shadcn.tabs", "shadcn.accordion", "shadcn.table",
  "shadcn.dialog", "shadcn.dropdown-menu", "shadcn.carousel", "shadcn.alert",
  "html.form",
];
```

## 3. File mới `features/node-palette/components/palette-sections.tsx`

```tsx
"use client";

import type { ReactNode } from "react";
import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/core/utils/cn";
import { NodeTier } from "@/core/types/node-definition.types";

export const TIER_BADGE: Partial<Record<NodeTier, string>> = { component: "Cụm", block: "Block" };

export function PaletteTile({
  title, Icon, badge, onClick,
}: { title: string; Icon: LucideIcon; badge?: string; onClick: () => void }) {
  return (
    <button
      type="button" title={title} onClick={onClick}
      className="relative flex h-14 flex-col items-center justify-center gap-1 rounded-md border bg-background px-1 hover:bg-accent active:bg-accent"
    >
      {badge && <span className="absolute right-1 top-0.5 text-[8px] font-medium text-primary">{badge}</span>}
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="w-full truncate text-center text-[10px] leading-tight">{title}</span>
    </button>
  );
}

export function PaletteSection({
  label, count, open = true, onToggle, children,
}: { label: string; count?: number; open?: boolean; onToggle?: () => void; children: ReactNode }) {
  return (
    <section>
      <button
        type="button" onClick={onToggle} disabled={!onToggle}
        className={cn(
          "flex w-full items-center gap-1 px-1 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground",
          onToggle && "hover:text-foreground"
        )}
      >
        {onToggle && (open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />)}
        {label}
        {count !== undefined && <span className="ml-auto font-normal">{count}</span>}
      </button>
      {open && children}
    </section>
  );
}

const TABS: { id: NodeTier; label: string; disabled?: boolean }[] = [
  { id: "element", label: "Elements" },
  { id: "component", label: "Components" },
  { id: "block", label: "Blocks", disabled: true }, // mở ở v6.9
];

export function PaletteTabs({
  value, onChange, counts,
}: { value: NodeTier; onChange: (t: NodeTier) => void; counts: { element: number; component: number } }) {
  return (
    <div className="flex gap-1 border-b px-2 py-1.5">
      {TABS.map((t) => (
        <button
          key={t.id} type="button" disabled={t.disabled}
          title={t.disabled ? "Sắp có" : undefined}
          onClick={() => onChange(t.id)}
          className={cn(
            "flex-1 rounded-md px-2 py-1 text-xs",
            value === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted",
            t.disabled && "cursor-not-allowed opacity-40 hover:bg-transparent"
          )}
        >
          {t.label}
          {t.id !== "block" && <span className="ml-1 opacity-60">{counts[t.id]}</span>}
        </button>
      ))}
    </div>
  );
}
```

## 4. `quick-add-dropdown.tsx`

**Import:** xóa `searchNodes`, `canContain`, `commonNodeIds`, `LucideIcon`, và hàm `NodeTile` cũ. Thêm:

```tsx
import { Box } from "lucide-react";                       // gộp vào import lucide hiện có
import { NodeDefinition, NodeTier } from "@/core/types/node-definition.types";
import { getNodeIcon } from "../constants/node-icons";
import { buildPaletteData } from "../utils/palette-data";
import { PaletteTile, PaletteSection, PaletteTabs, TIER_BADGE } from "./palette-sections";
```

**Xóa** `filteredDefs` và `groupedDefs` (cả bản cũ lẫn bản vá ở v6.2). Ngay **sau** dòng tính `parentDef` và `isFolderMode`, thêm:

```tsx
  const searching = query.trim().length > 0;
  const data = useMemo(() => buildPaletteData(parentDef, query), [parentDef, query]);
  const [tab, setTab] = useState<NodeTier>("element");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
```

**Thay toàn bộ `return` cuối** (phần Page/Component mode; nhánh Folder giữ nguyên):

```tsx
  const groups = tab === "component" ? data.component : data.element;
  const isOpen = (key: string, i: number) => expanded[`${tab}:${key}`] ?? i === 0;
  const toggle = (key: string, i: number) =>
    setExpanded((p) => ({ ...p, [`${tab}:${key}`]: !isOpen(key, i) }));

  const defTile = (def: NodeDefinition) => (
    <PaletteTile
      key={def.id} title={def.title} Icon={getNodeIcon(def.id)}
      badge={searching ? TIER_BADGE[def.tier ?? "element"] : undefined}
      onClick={() => handleAddDef(def.id)}
    />
  );
  const projectTiles = filteredComponents.map((c) => (
    <PaletteTile key={c.id} title={c.name} Icon={Box} onClick={() => handleAddComponentInstance(c.id)} />
  ));
  const showTabs = !searching && !data.sealed;

  return (
    <div className="flex max-h-[70vh] w-full flex-col">
      <div className="border-b p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search node..." className="h-8 pl-7 text-sm"
          />
        </div>
      </div>

      {showTabs && <PaletteTabs value={tab} onChange={setTab} counts={data.counts} />}

      <div className="flex-1 space-y-2 overflow-y-auto p-2">
        {searching ? (
          projectTiles.length + data.searchResults.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">Không tìm thấy node nào</p>
          ) : (
            <div className="grid grid-cols-4 gap-1">
              {projectTiles}
              {data.searchResults.map(defTile)}
            </div>
          )
        ) : (
          <>
            {data.parts.length > 0 && (
              <PaletteSection label={`Thành phần của ${parentDef?.title ?? ""}`}>
                <div className="grid grid-cols-4 gap-1">{data.parts.map(defTile)}</div>
              </PaletteSection>
            )}

            {!data.sealed && tab === "component" && projectTiles.length > 0 && (
              <PaletteSection label="Của dự án" count={projectTiles.length}>
                <div className="grid grid-cols-4 gap-1">{projectTiles}</div>
              </PaletteSection>
            )}

            {!data.sealed && tab === "block" ? null : !data.sealed &&
              groups.map((g, i) => (
                <PaletteSection
                  key={g.key} label={g.label} count={g.defs.length}
                  open={isOpen(g.key, i)} onToggle={() => toggle(g.key, i)}
                >
                  <div className="grid grid-cols-4 gap-1">{g.defs.map(defTile)}</div>
                </PaletteSection>
              ))}

            {data.sealed && data.parts.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">Node này không nhận thêm con</p>
            )}
          </>
        )}
      </div>

      <div className="border-t p-2">
        <Button variant="ghost" size="sm" className="w-full text-xs" onClick={onOpenBrowser}>
          Duyệt tất cả theo danh mục...
        </Button>
      </div>
    </div>
  );
```

## 5. `node-list-row.tsx`: thay toàn bộ

```tsx
"use client";

import type { ComponentType } from "react";
import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/core/utils/cn";

export function NodeListRow({
  title, Icon, iconName, badge, selected, onClick,
}: {
  title: string;
  Icon?: LucideIcon;
  iconName?: string; // giữ để tương thích chỗ gọi cũ
  badge?: string;
  selected?: boolean;
  onClick: () => void;
}) {
  const IconComp =
    Icon ??
    (iconName ? (LucideIcons as unknown as Record<string, ComponentType<any>>)[iconName] : undefined);

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-muted",
        selected && "bg-primary/10 text-primary"
      )}
    >
      {IconComp ? <IconComp className="h-3.5 w-3.5 shrink-0" /> : <span className="w-3.5 shrink-0" />}
      <span className="truncate">{title}</span>
      {badge && <span className="ml-auto text-[10px] text-muted-foreground">{badge}</span>}
    </button>
  );
}
```

## 6. `add-node-browser.tsx`

**Xóa:** hằng `CATEGORIES`, `getNodesByCategory`, `searchNodes`, `NodeCategory`, `isAllowedDefinition`, `filteredFlat`, state `expanded`, `toggleCategory`, và các import `ChevronDown`, `ChevronRight`, `canContain` nếu không còn dùng. `canAddComponentInstance` vẫn dùng `canContain`, nên **giữ import đó**.

**Thêm import:**

```tsx
import { useMemo, useState } from "react";
import { Box } from "lucide-react"; // gộp import lucide
import { NodeDefinition, NodeTier } from "@/core/types/node-definition.types";
import { getNodeIcon } from "../constants/node-icons";
import { buildPaletteData } from "../utils/palette-data";
import { PaletteSection, PaletteTabs, TIER_BADGE } from "./palette-sections";
```

**Thêm state**, ngay sau `isFolderMode`:

```tsx
  const searching = query.trim().length > 0;
  const data = useMemo(() => buildPaletteData(parentDef, query), [parentDef, query]);
  const [tab, setTab] = useState<NodeTier>("element");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const groups = tab === "component" ? data.component : data.element;
  const isOpen = (key: string, i: number) => expanded[`${tab}:${key}`] ?? i === 0;
  const toggle = (key: string, i: number) =>
    setExpanded((p) => ({ ...p, [`${tab}:${key}`]: !isOpen(key, i) }));

  const defRow = (def: NodeDefinition) => (
    <NodeListRow
      key={def.id} title={def.title} Icon={getNodeIcon(def.id)}
      badge={searching ? TIER_BADGE[def.tier ?? "element"] : undefined}
      selected={selection?.kind === "definition" && selection.id === def.id}
      onClick={() => setSelection({ kind: "definition", id: def.id })}
    />
  );
  const projectRows = (list: { id: string; name: string }[]) =>
    list.map((c) => (
      <NodeListRow
        key={c.id} title={c.name} Icon={Box}
        selected={selection?.kind === "component" && selection.id === c.id}
        onClick={() => setSelection({ kind: "component", id: c.id })}
      />
    ));
```

**Thay toàn bộ khối** `<> <div className="relative">...` (nhánh `else` của `isFolderMode`, từ ô search đến hết `<div className="flex-1 overflow-y-auto ...">`) bằng:

```tsx
          <>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Search node..." className="pl-7"
              />
            </div>

            {!searching && !data.sealed && (
              <div className="-mx-2"><PaletteTabs value={tab} onChange={setTab} counts={data.counts} /></div>
            )}

            <div className="-mx-2 flex-1 overflow-y-auto px-2">
              {searching ? (
                filteredComponents.length + data.searchResults.length === 0 ? (
                  <p className="py-4 text-center text-xs text-muted-foreground">Không tìm thấy node nào</p>
                ) : (
                  <>
                    {projectRows(filteredComponents)}
                    {data.searchResults.map(defRow)}
                  </>
                )
              ) : (
                <>
                  {data.parts.length > 0 && (
                    <PaletteSection label={`Thành phần của ${parentDef?.title ?? ""}`}>
                      {data.parts.map(defRow)}
                    </PaletteSection>
                  )}
                  {!data.sealed && tab === "component" && availableComponents.length > 0 && (
                    <PaletteSection label="Của dự án" count={availableComponents.length}>
                      {projectRows(availableComponents)}
                    </PaletteSection>
                  )}
                  {!data.sealed && tab !== "block" &&
                    groups.map((g, i) => (
                      <PaletteSection
                        key={g.key} label={g.label} count={g.defs.length}
                        open={isOpen(g.key, i)} onToggle={() => toggle(g.key, i)}
                      >
                        <div className="pl-2">{g.defs.map(defRow)}</div>
                      </PaletteSection>
                    ))}
                </>
              )}
            </div>
          </>
```

## 7. Vá export (bổ sung v6.7c): theme và dependency

**`project-template-files.ts`**, thêm 2 dòng vào `BASE_DEPENDENCIES`:

```ts
  shadcn: "^4.12.0",            // globals.css import "shadcn/tailwind.css"
  "tw-animate-css": "^1.4.0",
```

Thay hằng `GLOBALS_CSS` bằng:

```ts
const GLOBALS_CSS = `@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --radius: 0.625rem;
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}

html, body {
  height: 100%;
  margin: 0;
}
`;
```

Bản này bỏ các biến font Geist (project xuất ra không tải font đó) và phần sidebar dark. Nếu sau này có node Sidebar thì thêm lại.

## Kiểm tra sau v6.8

1. Chọn **Page**, bấm `+`: 3 tab. **Elements** mở sẵn mục "Hay dùng", các mục khác thu gọn. **Components** hiện Card, Tabs, Table, Dialog... Tab **Blocks** mờ, không bấm được.
2. Chọn **Tabs**: không còn 3 tab, chỉ có khung "Thành phần của Tabs" với Tabs List và Tab Content.
3. Chọn **Table Row**: chỉ hiện Table Head và Table Cell.
4. Chọn **Fieldset** (HTML): khung thành phần có Legend, bên dưới vẫn còn 3 tab Elements/Components cho phần tử tự do.
5. Gõ "table": ra cả `Table`, `Table (HTML)` kèm nhãn "Cụm", không còn tab.
6. Bấm "Duyệt tất cả theo danh mục...": cũng 3 tab, **dòng nào cũng có icon** (trước đây trống).
7. Export project có Button, Card, Accordion: giải nén, `pnpm install && pnpm dev`, nút có màu, Card có viền, Accordion có hiệu ứng mở.

## Lưu ý

- Hai đoạn JSX ở mục 4 và 6 dài và lồng nhau. Nếu build báo thiếu thẻ đóng, nhiều khả năng do ghép sót dấu `)` hoặc `</>`, gửi mình file đang lỗi.
- Component "của dự án" (do người dùng tạo) giờ chỉ hiện ở tab **Components** và dưới mục "Của dự án". Trước đây nó nằm đầu danh sách chung, nên bạn có thể thấy khác.

Bạn chạy thử và báo kết quả. Bản cuối là **v6.9: Blocks**. Mình không cần xem thêm file nào, vì các thứ cần dùng (`buildNodeFromSpec`, tab Blocks, `parentDef`) đã có từ các bản trước. Mình sẽ làm: định dạng Block bằng JSON cây, 10 block hardcode (Navbar, Hero, Feature Grid, Pricing, Testimonial, Login Form, Stat Row, CTA, FAQ, Footer), chèn thành bản sao độc lập, và bật tab Blocks với ô xem trước cho từng block.