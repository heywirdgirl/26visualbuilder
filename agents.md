# phase1
## Patch `core/types/style.types.ts`

Thêm vào `StyleProps`:
```typescript
export interface StyleProps {
  // ...giữ nguyên các field cũ

  // Sizing
  width?: "auto" | "full" | "screen" | "fit" | "1/2" | "1/3" | "2/3" | "1/4" | "3/4" | number; // number = px tự do
  height?: "auto" | "full" | "screen" | "fit" | "1/2" | "1/3" | "2/3" | "1/4" | "3/4" | number;
}
```

`number` cho trường hợp px tự do (VD `width: 320` → `w-[320px]`) — cùng cơ chế arbitrary value đã dùng cho màu hex (`bg-[#...]`) từ Phase 2 (V2), kế thừa đúng giới hạn đã biết: **Canvas Preview trong Builder không hiện đúng** giá trị px tự do (Tailwind CLI quét file tĩnh, không thấy class dựng runtime), nhưng **code export vẫn đúng 100%** — y hệt lý do đã note cho màu hex.

## Patch `core/utils/style-to-classes.ts`

Thêm map preset (đặt đầu file, cạnh các map khác):
```typescript
const WIDTH_HEIGHT_PRESET_CLASS: Record<string, string> = {
  auto: "auto", full: "full", screen: "screen", fit: "fit",
  "1/2": "1/2", "1/3": "1/3", "2/3": "2/3", "1/4": "1/4", "3/4": "3/4",
};

function sizeToClass(prefix: "w" | "h", value: StyleProps["width"]): string | null {
  if (value === undefined) return null;
  if (typeof value === "number") return `${prefix}-[${value}px]`;
  const preset = WIDTH_HEIGHT_PRESET_CLASS[value];
  return preset ? `${prefix}-${preset}` : null;
}
```

Thêm vào `fieldsToClasses()`:
```typescript
function fieldsToClasses(fields: Partial<StyleProps>): string[] {
  const classes: string[] = [];

  // ...giữ nguyên toàn bộ logic cũ...

  const widthClass = sizeToClass("w", fields.width);
  if (widthClass) classes.push(widthClass);
  const heightClass = sizeToClass("h", fields.height);
  if (heightClass) classes.push(heightClass);

  return classes;
}
```

## File mới: `features/inspector/components/sizing-section.tsx`

```tsx
"use client";

import { TreeNode } from "@/core/types/builder.types";
import { StyleProps } from "@/core/types/style.types";
import { useStyleField } from "../hooks/use-style-field";
import { StyleField } from "./style-field";
import { cn } from "@/core/utils/cn";

const PRESETS: { value: Exclude<StyleProps["width"], number | undefined>; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "fit", label: "Fit" },
  { value: "1/2", label: "1/2" },
  { value: "1/3", label: "1/3" },
  { value: "2/3", label: "2/3" },
  { value: "1/4", label: "1/4" },
  { value: "3/4", label: "3/4" },
  { value: "full", label: "Full" },
  { value: "screen", label: "Screen" },
];

function DimensionControl({
  label,
  value,
  onChange,
}: {
  label: string;
  value: StyleProps["width"];
  onChange: (v: StyleProps["width"]) => void;
}) {
  const isCustomPx = typeof value === "number";

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm">{label}</span>
      <div className="flex flex-wrap gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className={cn(
              "border rounded px-2 py-1 text-xs",
              value === p.value && "bg-primary/10 border-primary text-primary"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      {/* px tự do — LƯU Ý (giống hex màu): Canvas Preview trong Builder không hiện đúng
          giá trị này (Tailwind CLI không quét được class dựng runtime), nhưng code export
          vẫn đúng 100% vì Tailwind của người dùng cuối quét file thật lúc build. */}
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          placeholder="px tự do"
          value={isCustomPx ? value : ""}
          onChange={(e) => {
            const num = Number(e.target.value);
            if (e.target.value === "") return onChange(undefined);
            onChange(Number.isFinite(num) ? num : undefined);
          }}
          className="border rounded px-2 py-1 text-xs w-24"
        />
        <span className="text-xs text-muted-foreground">px</span>
        {value !== undefined && (
          <button type="button" onClick={() => onChange(undefined)} className="text-xs text-muted-foreground hover:text-foreground ml-auto">
            Xoá
          </button>
        )}
      </div>
    </div>
  );
}

export function SizingSection({ node }: { node: TreeNode }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">Sizing</h4>

      <StyleField label="" showClear={hasOverride("width")} onClear={() => clearOverride("width")}>
        <DimensionControl label="Width" value={getValue("width")} onChange={(v) => setValue("width", v)} />
      </StyleField>

      <StyleField label="" showClear={hasOverride("height")} onClear={() => clearOverride("height")}>
        <DimensionControl label="Height" value={getValue("height")} onChange={(v) => setValue("height", v)} />
      </StyleField>
    </div>
  );
}
```

(`StyleField` bọc ngoài chỉ dùng để tái sử dụng nút "Xoá override" theo breakpoint đã có sẵn — label để rỗng vì `DimensionControl` tự vẽ label riêng, tránh hiện 2 lần.)

## Patch `features/inspector/components/inspector-panel.tsx`

Thêm import:
```typescript
import { SizingSection } from "./sizing-section";
```

Thêm vào JSX, đặt ngay sau `<LayoutSection />` (trước `<SpacingSection />`) — đúng thứ tự tư duy tự nhiên khi thiết kế: kích thước khung trước, rồi mới tới khoảng cách bên trong:
```tsx
{def?.canHaveChildren && <LayoutSection node={activeNode} />}
<SizingSection node={activeNode} />
<SpacingSection node={activeNode} />
```

(`SizingSection` áp dụng cho **mọi** node, không điều kiện `canHaveChildren` — khác `LayoutSection`, vì Width/Height có ý nghĩa cả với leaf node như Button/Image.)

---
**Test nhanh:** chọn 1 node bất kỳ, bật `styles` → phải thấy section "Sizing" mới giữa Layout và Spacing. Bấm preset "1/2" cho Width → Canvas phải co lại đúng nửa chiều rộng cha. Nhập `320` vào ô px tự do cho Height → Canvas **không đổi** (đúng giới hạn đã biết) nhưng mở Code Modal → JSX phải có `className="... h-[320px] ..."` đúng.

# phase 2
## Patch `core/types/style.types.ts`

Thêm vào `StyleProps` (cạnh `width`/`height` vừa thêm):
```typescript
  // Position & Layering
  position?: "static" | "relative" | "absolute" | "fixed" | "sticky";
  top?: number;    // px — chỉ có tác dụng khi position !== "static"
  right?: number;
  bottom?: number;
  left?: number;
  zIndex?: 0 | 10 | 20 | 30 | 40 | 50; // đúng thang preset mặc định của Tailwind
```

## Patch `core/utils/style-to-classes.ts`

Thêm vào `fieldsToClasses()` (cạnh phần `width`/`height` đã thêm ở Phase 1):
```typescript
  if (fields.position) classes.push(fields.position === "static" ? "static" : fields.position);

  // top/right/bottom/left: số nguyên px, dùng cùng cơ chế arbitrary value như width/height
  // px tự do — cùng giới hạn đã biết (Canvas Builder không hiện đúng, code export vẫn đúng 100%).
  // Số âm hợp lệ — Tailwind dùng tiền tố "-" đứng TRƯỚC tên class (-top-[8px]), không phải bên trong ngoặc.
  const offsetClass = (side: "top" | "right" | "bottom" | "left", value: number | undefined) => {
    if (value === undefined) return null;
    return value < 0 ? `-${side}-[${Math.abs(value)}px]` : `${side}-[${value}px]`;
  };
  const topClass = offsetClass("top", fields.top);
  if (topClass) classes.push(topClass);
  const rightClass = offsetClass("right", fields.right);
  if (rightClass) classes.push(rightClass);
  const bottomClass = offsetClass("bottom", fields.bottom);
  if (bottomClass) classes.push(bottomClass);
  const leftClass = offsetClass("left", fields.left);
  if (leftClass) classes.push(leftClass);

  if (fields.zIndex !== undefined) classes.push(`z-${fields.zIndex}`);
```

## File mới: `features/inspector/components/position-section.tsx`

```tsx
"use client";

import { TreeNode } from "@/core/types/builder.types";
import { StyleProps } from "@/core/types/style.types";
import { useStyleField } from "../hooks/use-style-field";
import { StyleField } from "./style-field";
import { cn } from "@/core/utils/cn";

const POSITION_OPTIONS: NonNullable<StyleProps["position"]>[] = [
  "static", "relative", "absolute", "fixed", "sticky",
];
const Z_INDEX_OPTIONS: NonNullable<StyleProps["zIndex"]>[] = [0, 10, 20, 30, 40, 50];

function OffsetInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5 text-xs">
      {label}
      <input
        type="number"
        value={value ?? ""}
        placeholder="—"
        onChange={(e) => {
          if (e.target.value === "") return onChange(undefined);
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) ? n : undefined);
        }}
        className="border rounded px-2 py-1"
      />
    </label>
  );
}

export function PositionSection({ node }: { node: TreeNode }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);
  const position = getValue("position");
  // 4 ô offset chỉ hiện khi position khác static/chưa chọn — tránh rối UI cho trường hợp
  // top/left... vốn không có tác dụng gì với static (CSS thật cũng bỏ qua giá trị đó).
  const showOffsets = !!position && position !== "static";

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">Position</h4>

      <StyleField label="Position" showClear={hasOverride("position")} onClear={() => clearOverride("position")}>
        <div className="flex flex-wrap gap-1">
          {POSITION_OPTIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setValue("position", p)}
              className={cn(
                "border rounded px-2 py-1 text-xs capitalize",
                position === p && "bg-primary/10 border-primary text-primary"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </StyleField>

      {showOffsets && (
        <div className="grid grid-cols-2 gap-2">
          <OffsetInput label="Top" value={getValue("top")} onChange={(v) => setValue("top", v)} />
          <OffsetInput label="Right" value={getValue("right")} onChange={(v) => setValue("right", v)} />
          <OffsetInput label="Bottom" value={getValue("bottom")} onChange={(v) => setValue("bottom", v)} />
          <OffsetInput label="Left" value={getValue("left")} onChange={(v) => setValue("left", v)} />
        </div>
      )}

      <StyleField label="Z-index" showClear={hasOverride("zIndex")} onClear={() => clearOverride("zIndex")}>
        <div className="flex flex-wrap gap-1">
          {Z_INDEX_OPTIONS.map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => setValue("zIndex", z)}
              className={cn(
                "border rounded px-2 py-1 text-xs",
                getValue("zIndex") === z && "bg-primary/10 border-primary text-primary"
              )}
            >
              {z}
            </button>
          ))}
        </div>
      </StyleField>
    </div>
  );
}
```

## Patch `features/inspector/components/inspector-panel.tsx`

Thêm import:
```typescript
import { PositionSection } from "./position-section";
```

Thêm vào JSX, đặt ngay sau `<SpacingSection />` (trước `<TypographySection />`):
```tsx
<SizingSection node={activeNode} />
<SpacingSection node={activeNode} />
<PositionSection node={activeNode} />
<TypographySection node={activeNode} />
```

---
**Điểm cần cảnh báo người dùng cuối** (không phải bug, hệ quả tự nhiên của kiến trúc "Canvas Preview render DOM thật trong Editor UI"): `position: fixed` là **tương đối theo viewport trình duyệt**, không phải theo khung Canvas — 1 node đặt `fixed` trên Canvas sẽ **dính vào cửa sổ Builder** (có thể đè lên Scene Tree/Inspector panel khi cuộn), không chỉ dính trong vùng Canvas như người dùng có thể kỳ vọng. `absolute`/`relative`/`sticky` không gặp vấn đề này vì chúng tương đối theo cha gần nhất (bên trong Canvas).

**Test nhanh:** chọn 1 node con trong 1 Container → set Position `absolute` → phải thấy 4 ô Top/Right/Bottom/Left **xuất hiện** (chưa hiện khi còn `static`). Set Position của **Container cha** là `relative` (bắt buộc để `absolute` con có mốc tham chiếu đúng) → nhập `Top: 10, Left: 10` cho node con → mở Code Modal → JSX phải có `className="... absolute top-[10px] left-[10px] ..."`. Thử nhập **số âm** (`-8`) → phải ra `-top-[8px]` (không phải `top-[-8px]`, đúng cú pháp Tailwind).

# Phase 3 (Overflow, Opacity, Flex mở rộng)
## Patch `core/types/style.types.ts`

Thêm vào `StyleProps`:
```typescript
  // Overflow & Opacity
  overflow?: "visible" | "hidden" | "scroll" | "auto";
  opacity?: 0 | 25 | 50 | 75 | 100;

  // Layout mở rộng — flexWrap thuộc về CONTAINER (giống direction/gap), còn 3 field dưới
  // thuộc về CHÍNH node đó khi nằm trong 1 container khác (trục ngược lại với align/justify).
  flexWrap?: "flex-nowrap" | "flex-wrap" | "flex-wrap-reverse";
  alignSelf?: "self-auto" | "self-start" | "self-center" | "self-end" | "self-stretch";
  flexGrow?: 0 | 1;
  flexShrink?: 0 | 1;
```

## Patch `core/utils/style-to-classes.ts`

Thêm vào `fieldsToClasses()` (cạnh phần Phase 1-2 đã thêm):
```typescript
  if (fields.overflow) classes.push(`overflow-${fields.overflow}`);
  if (fields.opacity !== undefined) classes.push(`opacity-${fields.opacity}`);

  if (fields.flexWrap) classes.push(fields.flexWrap); // giá trị đã đúng tên class Tailwind
  if (fields.alignSelf) classes.push(fields.alignSelf); // tương tự
  if (fields.flexGrow !== undefined) classes.push(fields.flexGrow === 1 ? "grow" : "grow-0");
  if (fields.flexShrink !== undefined) classes.push(fields.flexShrink === 1 ? "shrink" : "shrink-0");
```

## Patch `features/inspector/components/appearance-section.tsx`

Thêm import (nếu chưa có `StyleField` — đã có sẵn từ trước):
```typescript
// Không cần thêm import mới, StyleField đã import sẵn trong file này
```

Thêm vào cuối JSX (trước thẻ đóng `</div>` cuối cùng của component):
```tsx
      <StyleField label="Overflow" showClear={hasOverride("overflow")} onClear={() => clearOverride("overflow")}>
        <select
          value={getValue("overflow") ?? ""}
          onChange={(e) => setValue("overflow", (e.target.value || undefined) as any)}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          <option value="visible">visible</option>
          <option value="hidden">hidden</option>
          <option value="scroll">scroll</option>
          <option value="auto">auto</option>
        </select>
      </StyleField>

      <StyleField label="Opacity" showClear={hasOverride("opacity")} onClear={() => clearOverride("opacity")}>
        <select
          value={getValue("opacity") ?? ""}
          onChange={(e) => setValue("opacity", (e.target.value === "" ? undefined : Number(e.target.value)) as any)}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          <option value="0">0%</option>
          <option value="25">25%</option>
          <option value="50">50%</option>
          <option value="75">75%</option>
          <option value="100">100%</option>
        </select>
      </StyleField>
```

## Patch `features/inspector/components/layout-section.tsx`

Thêm vào cuối JSX (sau field "Justify" đã có):
```tsx
      <StyleField label="Flex Wrap" showClear={hasOverride("flexWrap")} onClear={() => clearOverride("flexWrap")}>
        <select
          value={getValue("flexWrap") ?? ""}
          onChange={(e) => setValue("flexWrap", (e.target.value || undefined) as any)}
          className="border rounded px-2 py-1"
        >
          <option value="">—</option>
          <option value="flex-nowrap">Không xuống dòng</option>
          <option value="flex-wrap">Tự xuống dòng</option>
          <option value="flex-wrap-reverse">Xuống dòng ngược</option>
        </select>
      </StyleField>
```

## File mới: `features/inspector/components/self-layout-section.tsx`

```tsx
"use client";

import { TreeNode } from "@/core/types/builder.types";
import { StyleProps } from "@/core/types/style.types";
import { useStyleField } from "../hooks/use-style-field";
import { StyleField } from "./style-field";
import { cn } from "@/core/utils/cn";

const ALIGN_SELF_OPTIONS: { value: NonNullable<StyleProps["alignSelf"]>; label: string }[] = [
  { value: "self-auto", label: "Auto" },
  { value: "self-start", label: "Start" },
  { value: "self-center", label: "Center" },
  { value: "self-end", label: "End" },
  { value: "self-stretch", label: "Stretch" },
];

export function SelfLayoutSection({ node }: { node: TreeNode }) {
  const { getValue, setValue, hasOverride, clearOverride } = useStyleField(node);

  return (
    <div className="flex flex-col gap-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase">Self Layout</h4>
      <p className="text-[10px] text-muted-foreground -mt-2">
        Cách node này tự xử sự khi nằm trong 1 Container khác (khác với mục Layout — nơi
        node này áp luật lên các con của chính nó).
      </p>

      <StyleField label="Align Self" showClear={hasOverride("alignSelf")} onClear={() => clearOverride("alignSelf")}>
        <div className="flex flex-wrap gap-1">
          {ALIGN_SELF_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setValue("alignSelf", opt.value)}
              className={cn(
                "border rounded px-2 py-1 text-xs",
                getValue("alignSelf") === opt.value && "bg-primary/10 border-primary text-primary"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </StyleField>

      <div className="grid grid-cols-2 gap-2">
        <StyleField label="Grow" showClear={hasOverride("flexGrow")} onClear={() => clearOverride("flexGrow")}>
          <div className="flex gap-1">
            {[0, 1].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setValue("flexGrow", v as 0 | 1)}
                className={cn(
                  "flex-1 border rounded py-1 text-xs",
                  getValue("flexGrow") === v && "bg-primary/10 border-primary text-primary"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </StyleField>

        <StyleField label="Shrink" showClear={hasOverride("flexShrink")} onClear={() => clearOverride("flexShrink")}>
          <div className="flex gap-1">
            {[0, 1].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setValue("flexShrink", v as 0 | 1)}
                className={cn(
                  "flex-1 border rounded py-1 text-xs",
                  getValue("flexShrink") === v && "bg-primary/10 border-primary text-primary"
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </StyleField>
      </div>
    </div>
  );
}
```

## Patch `features/inspector/components/inspector-panel.tsx`

Thêm import:
```typescript
import { SelfLayoutSection } from "./self-layout-section";
```

Thêm vào JSX, đặt sau `<PositionSection />` (trước `<TypographySection />`):
```tsx
<SizingSection node={activeNode} />
<SpacingSection node={activeNode} />
<PositionSection node={activeNode} />
<SelfLayoutSection node={activeNode} />
<TypographySection node={activeNode} />
```

`SelfLayoutSection` áp dụng cho **mọi** node (không điều kiện `canHaveChildren`) — đúng bản chất "cách nó tự xử sự trong cha", khác hẳn `LayoutSection` (chỉ hiện khi node có con, vì đó là luật áp lên con).

---
**Test nhanh:** trong 1 Container có `direction: flex-row`, nhồi nhiều node con đủ để tràn ngang → set `Flex Wrap: Tự xuống dòng` cho Container đó → các con phải tự xuống hàng thay vì tràn ra ngoài. Chọn 1 node con → set `Align Self: End` → node đó phải tự đẩy về cuối trục ngang **độc lập** với `align` của cha (không cần đổi `align` chung của cả Container). Set `Opacity: 50%` cho 1 node bất kỳ → Canvas phải mờ đi ngay 50%, đúng preset.

