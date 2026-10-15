Mình chỉ đưa phần cần sửa trong `quick-add-dropdown.tsx`. Để dropdown thật sự rộng hết màn hình, mình cần xem thêm 2 file ở cuối.

## 1. Import (thay dòng import `commonNodeIds`)

```tsx
import { searchNodes, getNodeDefinition, getAllNodeDefinitions } from "@/core/registry/node-registry";
import { commonNodeIds } from "../constants/common-node-ids";
```

> `getAllNodeDefinitions` là tên mình giả định, bạn đổi theo export thật trong `node-registry.ts` (xem phần cuối).

## 2. Thay `filteredDefs` bằng `groupedDefs`

```tsx
const groupedDefs = useMemo(() => {
  const q = query.trim();
  const defs = (q ? searchNodes(q) : getAllNodeDefinitions()).filter(
    (d) => d.nodeKind === "html" || d.nodeKind === "shadcn"
  );

  const groups = new Map<string, typeof defs>();

  // Khi chưa search: nhóm "Hay dùng" lên đầu
  if (!q) {
    const common = commonNodeIds
      .map((id) => getNodeDefinition(id))
      .filter((d): d is NonNullable<typeof d> => !!d);
    if (common.length) groups.set("Hay dùng", common);
  }

  for (const d of defs) {
    const key = d.category ?? "Khác";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  }
  return Array.from(groups.entries());
}, [query]);
```

## 3. Thay phần `return` cuối (Page/Component mode)

```tsx
return (
  <div className="flex flex-col w-full max-h-[70vh]">
    <div className="p-2 border-b">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search node..." className="pl-7 h-8 text-sm"
        />
      </div>
    </div>

    <div className="flex-1 overflow-y-auto p-2 space-y-3">
      {filteredComponents.length === 0 && groupedDefs.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Không tìm thấy node nào</p>
      ) : (
        <>
          {filteredComponents.length > 0 && (
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-1 pb-1">
                My Components
              </p>
              <div className="grid grid-cols-4 gap-1">
                {filteredComponents.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    title={c.name}
                    onClick={() => handleAddComponentInstance(c.id)}
                    className="h-8 px-1.5 rounded-md border bg-background text-xs truncate hover:bg-accent active:bg-accent"
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {groupedDefs.map(([category, defs]) => (
            <section key={category}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-1 pb-1">
                {category}
              </p>
              <div className="grid grid-cols-4 gap-1">
                {defs.map((def) => (
                  <button
                    key={`${category}-${def.id}`}
                    type="button"
                    title={def.title}
                    onClick={() => handleAddDef(def.id)}
                    className="h-8 px-1.5 rounded-md border bg-background text-xs truncate hover:bg-accent active:bg-accent"
                  >
                    {def.title}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </>
      )}
    </div>

    <div className="p-2 border-t">
      <Button variant="ghost" size="sm" className="w-full text-xs" onClick={onOpenBrowser}>
        Duyệt tất cả theo danh mục...
      </Button>
    </div>
  </div>
);
```

Lưu ý: `NodeListRow` không còn dùng ở đây (nên xóa import nếu không dùng chỗ khác). Hiện mỗi ô chỉ có chữ, chưa có icon vì ô nhỏ. Nếu muốn icon, mình thêm sau.

## 4. Cần gửi thêm cho mình

1. **File chứa `<PopoverContent>` / `<DropdownMenuContent>` bọc `QuickAddDropdown`**. Có thể là `tree-toolbar.tsx` hoặc `tree-node-item.tsx`. Chiều ngang hiện tại do file này quyết định, nên phải sửa ở đó (thường là `className="w-[calc(100vw-1rem)] max-w-none p-0"` kèm `collisionPadding`). Trong ảnh dropdown đang bị tràn lệch phải.
2. **`core/registry/node-registry.ts`** để mình xác nhận tên hàm lấy toàn bộ node (thay `getAllNodeDefinitions`) và chắc `category` / `nodeKind` đúng.

**Thêm icon không phức tạp, và `lucide-react` (bạn đã dùng sẵn) đủ cho toàn bộ node này.** Nó có hơn 1500 icon, nên các node như Div, Heading, Button, Table, Dialog, Tabs, Accordion đều có icon phù hợp. Không cần bộ icon nào khác.

Cách đơn giản nhất là tạo một file map `id → icon`, không đụng vào registry. Import trực tiếp từng icon để bundle không phình to (đừng dùng `icons[name]` động vì nó kéo cả bộ lucide vào bundle).

## 1. Tạo file mới `features/node-palette/constants/node-icons.ts`

```ts
import {
  Box, LayoutTemplate, PanelTop, PanelBottom, PanelLeft, Newspaper,
  Heading1, Heading2, Heading3, Pilcrow, Type, Tag,
  MousePointerClick, TextCursorInput, AlignLeft, ChevronsUpDown,
  SquareCheck, CircleDot, ToggleLeft, List, ListOrdered, Dot,
  Image, Star, SeparatorHorizontal, Menu, Link as LinkIcon,
  Square, BadgeCheck, CircleUser, ScrollText, LayoutPanelTop,
  ChevronsDownUp, UnfoldVertical, Columns2, TriangleAlert, ShieldAlert,
  AppWindow, PanelRight, MessageSquare, Info, Bell, Table, Loader,
  Hourglass, ChevronsRight, Ellipsis, AlignJustify, ChevronDown,
  MousePointer2, Eye, type LucideIcon,
} from "lucide-react";

const NODE_ICONS: Record<string, LucideIcon> = {
  // HTML
  "html.div": Box, "html.section": LayoutTemplate, "html.main": LayoutTemplate,
  "html.header": PanelTop, "html.footer": PanelBottom, "html.aside": PanelLeft,
  "html.article": Newspaper,
  "html.h1": Heading1, "html.h2": Heading2, "html.h3": Heading3,
  "html.p": Pilcrow, "html.span": Type, "html.label": Tag,
  "html.button": MousePointerClick, "html.input": TextCursorInput,
  "html.textarea": AlignLeft, "html.select": ChevronsUpDown,
  "html.checkbox": SquareCheck, "html.radio": CircleDot, "html.switch": ToggleLeft,
  "html.ul": List, "html.ol": ListOrdered, "html.li": Dot,
  "html.img": Image, "html.icon": Star, "html.separator": SeparatorHorizontal,
  "html.nav": Menu, "html.a": LinkIcon,

  // shadcn
  "shadcn.button": MousePointerClick, "shadcn.card": Square,
  "shadcn.input": TextCursorInput, "shadcn.textarea": AlignLeft,
  "shadcn.label": Tag, "shadcn.checkbox": SquareCheck,
  "shadcn.radio-group": CircleDot, "shadcn.switch": ToggleLeft,
  "shadcn.select": ChevronsUpDown, "shadcn.badge": BadgeCheck,
  "shadcn.avatar": CircleUser, "shadcn.separator": SeparatorHorizontal,
  "shadcn.scroll-area": ScrollText, "shadcn.tabs": LayoutPanelTop,
  "shadcn.accordion": ChevronsDownUp, "shadcn.collapsible": UnfoldVertical,
  "shadcn.resizable": Columns2, "shadcn.alert": TriangleAlert,
  "shadcn.alert-dialog": ShieldAlert, "shadcn.dialog": AppWindow,
  "shadcn.sheet": PanelRight, "shadcn.popover": MessageSquare,
  "shadcn.tooltip": Info, "shadcn.toast": Bell, "shadcn.table": Table,
  "shadcn.progress": Loader, "shadcn.skeleton": Hourglass,
  "shadcn.breadcrumb": ChevronsRight, "shadcn.pagination": Ellipsis,
  "shadcn.navigation-menu": Menu, "shadcn.menubar": AlignJustify,
  "shadcn.dropdown-menu": ChevronDown, "shadcn.context-menu": MousePointer2,
  "shadcn.hover-card": Eye,
};

export function getNodeIcon(id: string): LucideIcon {
  return NODE_ICONS[id] ?? Box; // node mới chưa có trong map vẫn hiện Box, không lỗi
}
```

Nếu build báo thiếu `SquareCheck`, đổi thành `CheckSquare` (tùy phiên bản lucide).

## 2. `quick-add-dropdown.tsx`

**Import:** bỏ `getAllNodeDefinitions`. `searchNodes("")` đã trả về toàn bộ node.

```tsx
import { searchNodes, getNodeDefinition } from "@/core/registry/node-registry";
import { getNodeIcon } from "../constants/node-icons";
import { Box, type LucideIcon } from "lucide-react"; // gộp vào import lucide hiện có
```

**Trong `groupedDefs`:** sửa một dòng.

```tsx
const defs = searchNodes(q).filter(
  (d) => d.nodeKind === "html" || d.nodeKind === "shadcn"
);
```

**Thêm component ô node** (đặt ngoài `QuickAddDropdown`, ví dụ ngay dưới `slugify`). Icon nằm trên chữ vì 4 cột trên điện thoại rất hẹp:

```tsx
function NodeTile({
  title, Icon, onClick,
}: { title: string; Icon: LucideIcon; onClick: () => void }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 h-14 px-1 rounded-md border bg-background hover:bg-accent active:bg-accent"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="w-full text-center text-[10px] leading-tight truncate">{title}</span>
    </button>
  );
}
```

**Thay các `<button>` trong lưới:**

```tsx
{filteredComponents.map((c) => (
  <NodeTile key={c.id} title={c.name} Icon={Box} onClick={() => handleAddComponentInstance(c.id)} />
))}
```

```tsx
{defs.map((def) => (
  <NodeTile
    key={`${category}-${def.id}`}
    title={def.title}
    Icon={getNodeIcon(def.id)}
    onClick={() => handleAddDef(def.id)}
  />
))}
```

## 3. `tree-toolbar.tsx`: nới rộng hết chiều ngang

Thay `<PopoverContent ...>`:

```tsx
<PopoverContent
  side="top"
  align="start"
  sideOffset={-90}
  collisionPadding={8}
  className="w-[calc(100vw-1rem)] max-w-none p-0 z-[7000]"
>
```

`collisionPadding` giúp Radix tự đẩy popover vào trong màn hình, nên sẽ hết bị tràn lệch phải như trong ảnh. Trên desktop popover cũng sẽ rộng gần hết màn hình. Nếu không muốn vậy, dùng `w-[calc(100vw-1rem)] sm:w-[480px]`.

Nếu sau khi sửa `sideOffset={-90}` làm popover đè lên thanh toolbar không như ý, gửi mình ảnh mới để chỉnh lại vị trí.