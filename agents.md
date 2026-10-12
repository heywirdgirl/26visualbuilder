Mình cần kiểm tra trước khi đoán: model GLM-4.7-Flash có đang "suy nghĩ" (reasoning) trước khi trả lời không, vì đó là nguyên nhân latency lớn nhất nếu có.

Cả hai vấn đề đều có nguyên nhân cụ thể, một cái trong cấu hình model, một cái trong code mình viết.

## Chẩn đoán

### 1. Chậm gần 3 phút

Mình kiểm tra tài liệu Cloudflare: `glm-4.7-flash` là **model reasoning** (đánh dấu "Reasoning: Yes"), và `chat_template_kwargs.enable_thinking` **mặc định là `true`**. Nghĩa là mỗi lần gọi, model viết một đoạn suy nghĩ dài rồi mới sinh JSON. Chính release note của `workers-ai-provider@3.1.12` mô tả lỗi này: reasoning model "burn the entire output token budget on chain-of-thought". Code `route.ts` hiện tại chưa tắt thinking, nên đây là nghi phạm số 1.

Hai nguyên nhân phụ (suy luận từ code, chưa đo):
- **Output quá dài.** Đoạn code bạn dán có 10 card, khoảng 60 node. Mỗi node JSON mang cả `style: {base: {...}}` (~100 token), tức khoảng 6.000 token output. Prompt hiện chưa có giới hạn nào về số lượng.
- **Input phình theo trang.** Mỗi lần gọi gửi nguyên JSON cả Page, gồm toàn bộ style của mọi node cũ.

Streaming không dùng được: tài liệu Workers AI ghi rõ *"JSON Mode currently doesn't support streaming"*. Vì vậy giải pháp là giảm số token, không phải hiển thị dần.

### 2. Class "ám ảnh" `flex flex-col gap-4 p-4`

Đây là lỗi của mình, hàm `mergeStyle` ở lượt trước **luôn khởi tạo từ `defaultStyle`**:

```typescript
const style: NodeStyle = { base: structuredClone(def.defaultStyle ?? {}) };
```

Mọi container AI tạo ra đều tự mang `flex flex-col gap-4 p-4`. Model không hề biết điều đó (prompt không nhắc), nên không bao giờ gỡ được. Trong code bạn dán, `<div className="flex flex-col gap-4 p-4">` bọc ngoài là đúng node này. Mỗi Card cũng giữ `flex flex-col gap-4` từ default dù model chỉ định `p-8`.

Hai nguyên nhân cộng thêm:
- **Context bắt chước.** JSON Page gửi lên chứa style mặc định của các node cũ. Model nhỏ có xu hướng chép lại mẫu đó.
- **Không có công thức layout.** Prompt chưa có ví dụ dùng `gridCols`/responsive. Nên 10 card xếp chồng dọc trong `flex-col`, không có `grid`, không có `md:`.

## Cách sửa

| Vấn đề | Sửa |
|---|---|
| Thinking bật | `enable_thinking: false` (1 dòng) |
| Treo quá lâu | `abortSignal` 90 giây, báo lỗi rõ ràng |
| Output dài | **Style preset đặt tên** (`card`, `grid-3`, `heading-card`...). Mỗi node chỉ còn `"preset": "card"` (~15 token) thay vì cả object style. |
| Class mặc định | Node do AI tạo **không còn thừa hưởng `defaultStyle`**. Style = preset + phần AI ghi đè. |
| Input phình, bị bắt chước | Gửi **outline** (id, type, chữ) thay vì JSON đầy đủ. Chỉ node đang chọn kèm class hiện tại. |
| Layout đơn điệu | Prompt có quy tắc "item lặp lại phải nằm trong một grid" và một ví dụ pricing dùng preset. Giới hạn ~40 node, mặc định 3 item nếu user không nêu số lượng. |

---

### 1. Kiểm tra version rồi sửa `route.ts`

Nếu `workers-ai-provider` thấp hơn 3.1.12, bản đó **âm thầm bỏ qua** tham số `chat_template_kwargs`:
```bash
pnpm list workers-ai-provider
pnpm add workers-ai-provider@latest   # nếu < 3.1.12
```

`src/app/api/ai/add-node/route.ts` — full file (đối chiếu nếu bạn đã sửa thêm):
```typescript
import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createClient } from "@/core/supabase/server";
import { getAiRegistrySummary } from "@/core/registry/ai-registry-summary";
import { aiResponseSchema } from "@/features/ai-assistant/schemas/ai-output.schema";
import { buildAddNodeSystemPrompt } from "@/features/ai-assistant/prompts/add-node.prompt";
import { AiContextPayload } from "@/features/ai-assistant/utils/build-ai-context";

const MODEL_ID = "@cf/zai-org/glm-4.7-flash";
const TIMEOUT_MS = 90_000;

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Cần đăng nhập để dùng AI Assistant." }, { status: 401 });
    }

    const { data: allowed, error: usageError } = await supabase.rpc("increment_ai_usage", { max_per_day: 20 });
    if (usageError || !allowed) {
      return NextResponse.json(
        { error: "Bạn đã dùng hết lượt AI hôm nay (tối đa 20 lượt/ngày) — thử lại vào ngày mai." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const context = body.context as AiContextPayload | undefined;
    if (!prompt) return NextResponse.json({ error: "Thiếu nội dung yêu cầu." }, { status: 400 });
    if (!context?.currentPageTree) {
      return NextResponse.json({ error: "Thiếu context trang hiện tại." }, { status: 400 });
    }

    const { createWorkersAI } = await import("workers-ai-provider");
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    const workersai = createWorkersAI({ binding: env.AI });

    const result = await generateObject({
      // enable_thinking mặc định là TRUE với glm-4.7-flash — tắt đi để model không "nghĩ" hàng nghìn token trước khi sinh JSON.
      model: workersai(MODEL_ID, { chat_template_kwargs: { enable_thinking: false } }),
      system: buildAddNodeSystemPrompt(getAiRegistrySummary(), context),
      prompt,
      schema: aiResponseSchema,
      abortSignal: AbortSignal.timeout(TIMEOUT_MS),
    });

    // Ghi số token vào log Cloudflare để đo trước/sau thay vì đoán.
    console.log("[ai] add-node usage:", JSON.stringify(result.usage));
    return NextResponse.json({ success: true, data: result.object });
  } catch (err) {
    if (err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")) {
      return NextResponse.json(
        { error: "AI phản hồi quá lâu — thử yêu cầu ngắn hơn (ít phần tử hơn)." },
        { status: 504 }
      );
    }
    console.error("[ai] add-node thất bại:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI Assistant thất bại — thử lại." },
      { status: 500 }
    );
  }
}
```

### 2. Style presets — `core/registry/style-presets.ts` (file mới)

Toàn bộ dùng các field đã thêm ở lượt trước, và đều nằm trong safelist của Canvas.

```typescript
import { NodeStyle } from "@/core/types/style.types";

export interface StylePreset {
  description: string; // vừa là mô tả cho AI prompt, vừa là tooltip nếu sau này làm preset picker
  style: NodeStyle;
}

export const STYLE_PRESETS: Record<string, StylePreset> = {
  // ── Layout ──
  "page-container": {
    description: "centered page wrapper: max-width 6xl, side padding, vertical stack gap 8",
    style: { base: { direction: "flex-col", gap: 8, maxWidth: "6xl", marginX: "auto", paddingX: 4 }, md: { paddingX: 8 } },
  },
  section: {
    description: "vertical section: stack gap 6, vertical padding 12 (16 on md+)",
    style: { base: { direction: "flex-col", gap: 6, paddingY: 12 }, md: { paddingY: 16 } },
  },
  hero: {
    description: "centered hero block: stacked, centered items and text, large vertical padding",
    style: {
      base: { direction: "flex-col", align: "items-center", textAlign: "center", gap: 6, paddingY: 16, paddingX: 4 },
      md: { paddingY: 24 },
    },
  },
  stack: { description: "vertical stack, gap 4", style: { base: { direction: "flex-col", gap: 4 } } },
  "stack-lg": { description: "vertical stack, gap 8", style: { base: { direction: "flex-col", gap: 8 } } },
  row: {
    description: "horizontal row, vertically centered, gap 4",
    style: { base: { direction: "flex-row", align: "items-center", gap: 4 } },
  },
  "row-between": {
    description: "horizontal row, centered, items pushed to both ends (navbars, headers)",
    style: { base: { direction: "flex-row", align: "items-center", justify: "justify-between", gap: 4 } },
  },
  "row-wrap": {
    description: "horizontal row that wraps (tags, badges, logos)",
    style: { base: { direction: "flex-row", flexWrap: "flex-wrap", align: "items-center", gap: 3 } },
  },
  "grid-2": {
    description: "responsive grid: 1 column on mobile, 2 on md+, gap 6",
    style: { base: { gridCols: 1, gap: 6 }, md: { gridCols: 2 } },
  },
  "grid-3": {
    description: "responsive grid: 1 column on mobile, 2 on md, 3 on lg (cards, pricing, features), gap 6",
    style: { base: { gridCols: 1, gap: 6 }, md: { gridCols: 2 }, lg: { gridCols: 3 } },
  },
  "grid-4": {
    description: "responsive grid: 1 column on mobile, 2 on md, 4 on lg (products, logos), gap 6",
    style: { base: { gridCols: 1, gap: 6 }, md: { gridCols: 2 }, lg: { gridCols: 4 } },
  },

  // ── Surfaces ──
  card: {
    description: "elevated white card: padding 6, rounded-2xl, soft shadow, subtle border, lifts on hover",
    style: {
      base: {
        direction: "flex-col", gap: 4, padding: 6, bgColor: "white", borderRadius: "2xl",
        shadow: "md", borderWidth: 1, borderColor: "zinc-100", transition: "all", duration: 200,
      },
      hover: { shadow: "xl", translateY: -1 },
    },
  },
  "card-featured": {
    description: "highlighted card (e.g. recommended pricing tier): blue ring, bigger shadow",
    style: {
      base: {
        direction: "flex-col", gap: 4, padding: 6, bgColor: "white", borderRadius: "2xl",
        shadow: "xl", ringWidth: 2, ringColor: "blue-500", transition: "all", duration: 200,
      },
      hover: { translateY: -1 },
    },
  },
  "card-dark": {
    description: "dark card: zinc-900 background, white text, rounded-2xl",
    style: {
      base: { direction: "flex-col", gap: 4, padding: 6, bgColor: "zinc-900", textColor: "white", borderRadius: "2xl", shadow: "lg" },
    },
  },
  "card-glass": {
    description: "glassmorphism card (use over dark or colorful backgrounds): translucent white, backdrop blur, thin border",
    style: {
      base: {
        direction: "flex-col", gap: 4, padding: 6, bgColor: "white", bgOpacity: 10, backdropBlur: "lg",
        borderWidth: 1, borderColor: "white", borderOpacity: 20, borderRadius: "2xl",
      },
    },
  },
  "surface-muted": {
    description: "soft gray panel: zinc-100 background, rounded-xl, padding 6",
    style: { base: { direction: "flex-col", gap: 4, padding: 6, bgColor: "zinc-100", borderRadius: "xl" } },
  },

  // ── Typography ──
  "heading-hero": {
    description: "hero headline: 4xl (6xl on md+), extrabold, tight tracking, zinc-900",
    style: {
      base: { fontSize: "4xl", fontWeight: "extrabold", letterSpacing: "tight", lineHeight: "tight", textColor: "zinc-900" },
      md: { fontSize: "6xl" },
    },
  },
  "heading-section": {
    description: "section title: 3xl bold, tight tracking, zinc-900",
    style: { base: { fontSize: "3xl", fontWeight: "bold", letterSpacing: "tight", textColor: "zinc-900" } },
  },
  "heading-card": {
    description: "card title: xl semibold, zinc-900",
    style: { base: { fontSize: "xl", fontWeight: "semibold", textColor: "zinc-900" } },
  },
  "text-lead": {
    description: "intro paragraph under a headline: lg (xl on md+), relaxed, zinc-500",
    style: { base: { fontSize: "lg", lineHeight: "relaxed", textColor: "zinc-500" }, md: { fontSize: "xl" } },
  },
  "text-body": {
    description: "body text: base size, relaxed line height, zinc-700",
    style: { base: { fontSize: "base", lineHeight: "relaxed", textColor: "zinc-700" } },
  },
  "text-muted": {
    description: "small secondary text: sm, zinc-500",
    style: { base: { fontSize: "sm", textColor: "zinc-500" } },
  },
  price: {
    description: "big price figure: 4xl extrabold zinc-900",
    style: { base: { fontSize: "4xl", fontWeight: "extrabold", textColor: "zinc-900" } },
  },
  eyebrow: {
    description: "small uppercase label above a headline: xs, semibold, wide tracking, blue-500",
    style: { base: { fontSize: "xs", fontWeight: "semibold", textTransform: "uppercase", letterSpacing: "widest", textColor: "blue-500" } },
  },

  // ── Actions & media ──
  "button-primary": {
    description: "primary button: zinc-900 background, white text, rounded-xl, lifts on hover",
    style: {
      base: { bgColor: "zinc-900", textColor: "white", borderRadius: "xl", paddingX: 6, paddingY: 3, transition: "all", duration: 200 },
      hover: { shadow: "lg", translateY: -1 },
    },
  },
  "button-block": {
    description: "full-width primary button (use at the bottom of cards)",
    style: {
      base: { width: "full", bgColor: "zinc-900", textColor: "white", borderRadius: "xl", paddingY: 3, transition: "all", duration: 200 },
      hover: { shadow: "lg" },
    },
  },
  "button-accent": {
    description: "accent button: blue-500 background, white text, rounded-xl",
    style: {
      base: { bgColor: "blue-500", textColor: "white", borderRadius: "xl", paddingX: 6, paddingY: 3, transition: "all", duration: 200 },
      hover: { shadow: "lg", translateY: -1 },
    },
  },
  "badge-pill": {
    description: "small pill badge: tinted blue background, blue text, fully rounded",
    style: {
      base: { bgColor: "blue-500", bgOpacity: 10, textColor: "blue-500", borderRadius: "full", paddingX: 3, paddingY: 1, fontSize: "xs", fontWeight: "medium" },
    },
  },
  "image-cover": {
    description: "full-width image, 16:9, cropped to fill, rounded-xl",
    style: { base: { width: "full", aspectRatio: "video", objectFit: "cover", borderRadius: "xl" } },
  },
};

// hasOwnProperty: chặn tên lạ như "constructor"/"__proto__" từ AI output.
export function getStylePreset(name?: string): StylePreset | undefined {
  return name && Object.prototype.hasOwnProperty.call(STYLE_PRESETS, name) ? STYLE_PRESETS[name] : undefined;
}
```

### 3. Thêm `preset` vào schema AI

`core/types/ai-operation.types.ts`:
```typescript
export interface AiNode {
  nodeType: string;
  preset?: string; // 👈 thêm
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
  children?: AiNode[];
}
```

`features/ai-assistant/schemas/ai-output.schema.ts`, thêm 1 dòng trong `aiNodeSchema`:
```typescript
z.object({
  nodeType: z.string(),
  preset: z.string().optional(), // 👈 thêm
  props: z.object({}).passthrough().optional(),
  style: z.object({}).passthrough().optional(),
  children: z.array(aiNodeSchema).max(20).optional(),
})
```

### 4. Bỏ `defaultStyle` + áp preset — patch `core/utils/apply-ai-operations.ts`

Thêm import:
```typescript
import { getStylePreset } from "@/core/registry/style-presets";
```

Thay **cả `mergeStyle` cũ** bằng 2 hàm sau (`sanitizeStyleFields` giữ nguyên):
```typescript
type StyleLayers = Partial<Record<(typeof STYLE_LAYER_KEYS)[number], Partial<StyleProps>>>;

function parseAiStyle(aiStyle: Record<string, unknown> | undefined): StyleLayers {
  if (!aiStyle) return {};
  const hasLayers = STYLE_LAYER_KEYS.some((layer) => layer in aiStyle);
  const raw: Record<string, unknown> = hasLayers ? aiStyle : { base: aiStyle };
  const out: StyleLayers = {};
  for (const layer of STYLE_LAYER_KEYS) {
    if (raw[layer]) out[layer] = sanitizeStyleFields(raw[layer]);
  }
  return out;
}

// Node do AI tạo KHÔNG thừa hưởng defaultStyle nữa (nguồn gốc của "flex flex-col gap-4 p-4" ở mọi nơi).
// Style = preset (nếu có) + phần AI ghi đè; không preset, không style → node trung tính.
function mergeStyle(aiStyle: Record<string, unknown> | undefined, presetName: string | undefined): NodeStyle {
  const presetStyle = getStylePreset(presetName)?.style;
  const preset = presetStyle ? structuredClone(presetStyle) : undefined;
  const ai = parseAiStyle(aiStyle);

  const result: NodeStyle = { base: { ...(preset?.base ?? {}), ...(ai.base ?? {}) } };
  for (const layer of STYLE_LAYER_KEYS) {
    if (layer === "base") continue;
    const merged = { ...(preset?.[layer] ?? {}), ...(ai[layer] ?? {}) };
    if (Object.keys(merged).length > 0) result[layer] = merged;
  }
  return result;
}
```

Trong `buildChildrenRecursive`, đổi 1 dòng:
```typescript
// Đổi:
style: mergeStyle(childDef, aiChild.style),
// Thành:
style: mergeStyle(aiChild.style, aiChild.preset),
```

### 5. Outline thay JSON đầy đủ — `features/ai-assistant/utils/outline-tree.ts` (file mới)

```typescript
import { TreeNode } from "@/core/types/builder.types";

function nodeLabel(node: TreeNode): string {
  const p = node.props as Record<string, unknown>;
  const text = p.text ?? p.name ?? p.label ?? p.title ?? p.placeholder ?? p.alt;
  return typeof text === "string" && text ? ` "${text.slice(0, 40)}"` : "";
}

// Chỉ id + type + chữ — KHÔNG kèm style. Input nhỏ hơn nhiều, và model không còn thấy
// (rồi bắt chước) style mặc định của các node cũ.
export function outlineTree(node: TreeNode, selectedId: string | null, depth = 0, lines: string[] = []): string[] {
  const mark = node.id === selectedId ? "   <-- SELECTED" : "";
  const ref = node.referenceId ? ` -> component ${node.referenceId}` : "";
  lines.push(`${"  ".repeat(depth)}- [${node.id}] ${node.type}${nodeLabel(node)}${ref}${mark}`);
  node.children.forEach((c) => outlineTree(c, selectedId, depth + 1, lines));
  return lines;
}

export function findInTree(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findInTree(child, id);
    if (found) return found;
  }
  return null;
}
```

### 6. Prompt mới — `features/ai-assistant/prompts/add-node.prompt.ts` (full file)

```typescript
import { RegistrySummaryEntry } from "@/core/registry/ai-registry-summary";
import { STYLE_FIELD_DOCS } from "@/core/types/style.types";
import { PALETTE_TOKENS } from "@/core/registry/color-palette";
import { STYLE_PRESETS } from "@/core/registry/style-presets";
import { styleToClasses } from "@/core/utils/style-to-classes";
import { AiContextPayload } from "../utils/build-ai-context";
import { outlineTree, findInTree } from "../utils/outline-tree";

function formatRegistryEntry(entry: RegistrySummaryEntry): string {
  const childInfo = entry.canHaveChildren ? "can have children" : "leaf, no children";
  const props = entry.propKeys.length > 0 ? entry.propKeys.join(", ") : "(no props)";
  return `- ${entry.id} | ${entry.title} | ${childInfo} | props: ${props}`;
}

const formatPresets = () =>
  Object.entries(STYLE_PRESETS).map(([name, p]) => `- ${name}: ${p.description}`).join("\n");

const formatStyleDocs = () =>
  Object.entries(STYLE_FIELD_DOCS).map(([key, doc]) => `- ${key}: ${doc}`).join("\n");

export function buildAddNodeSystemPrompt(registry: RegistrySummaryEntry[], context: AiContextPayload): string {
  const selected = context.selectedNodeId ? findInTree(context.currentPageTree, context.selectedNodeId) : null;
  const selectedInfo = selected
    ? `[${selected.id}] ${selected.type}, current classes: ${styleToClasses(selected.style) || "(none)"}`
    : "(none selected)";

  const components = context.referencedComponents
    .map((c) => `COMPONENT "${String((c.props as { name?: string }).name ?? "Component")}":\n${outlineTree(c, null).join("\n")}`)
    .join("\n");

  return `You are the Node Assistant of 26VisualBuilder, a tree-based visual UI builder.
Task: given a user request (Vietnamese or English), ADD new nodes into the user's current Page. Be FAST and CONCISE — output only the JSON.

STRICT RULES:
1. "nodeType" MUST come from REGISTRY below. Never invent one.
2. Leaf nodes ("leaf, no children") must never have "children".
3. "parentId" MUST be an id from CURRENT PAGE below. Default: the SELECTED node (if it can have children), otherwise the Page id.
4. Only use prop keys listed for that nodeType.
5. action is always "add". Never modify or delete existing nodes.
6. New nodes start with NO layout and NO style. Give EVERY node a "preset" (strongly preferred) and/or a small "style" override.
7. Output size: at most ~40 nodes. If the user asks for a list/grid without a count, create 3 items. Never write long style objects when a preset exists.
8. Repeated items (cards, features, pricing tiers, products) MUST be children of ONE grid container (preset grid-2/grid-3/grid-4) — never separate siblings in a vertical stack.
9. Write real, concise copy in the user's language. "summary": one short sentence in the user's language.

PRESETS (use as "preset": "<name>"):
${formatPresets()}

STYLE OVERRIDES (optional "style" on top of a preset): { "base": {...}, "md": {...}, "lg": {...}, "hover": {...}, "focus": {...}, "active": {...} }
- "base" applies on all screens (mobile-first); "md"/"lg" only override on larger screens. When using hover/focus/active also set "transition" in base.
- COLORS: only these tokens (or #hex): ${PALETTE_TOKENS.join(", ")}.
- Prefer zinc neutrals + ONE accent (blue-500). Hierarchy: hero heading > section heading > card heading > body > muted.
Fields:
${formatStyleDocs()}

EXAMPLE (3 pricing tiers; cards 2 and 3 have the same structure with different text, the recommended one uses "card-featured"):
{"operations":[{"action":"add","parentId":"<existing id>","node":{"nodeType":"html.section","preset":"section","children":[{"nodeType":"html.h2","preset":"heading-section","props":{"text":"Pricing"}},{"nodeType":"html.div","preset":"grid-3","children":[{"nodeType":"shadcn.card","preset":"card","children":[{"nodeType":"html.h3","preset":"heading-card","props":{"text":"Starter"}},{"nodeType":"html.p","preset":"price","props":{"text":"$9"}},{"nodeType":"html.p","preset":"text-muted","props":{"text":"For individuals"}},{"nodeType":"shadcn.button","preset":"button-block","props":{"text":"Get started"}}]}]}]}}],"summary":"Added a pricing section."}

REGISTRY (id | title | children? | props):
${registry.map(formatRegistryEntry).join("\n")}

CURRENT PAGE (id, type, text):
${outlineTree(context.currentPageTree, context.selectedNodeId).join("\n")}
${components ? `\nREUSABLE COMPONENTS in this project (reference only):\n${components}\n` : ""}
SELECTED NODE: ${selectedInfo}
`;
}
```

---

## Cách kiểm tra

1. Deploy lại, gõ **đúng prompt "tạo 3 price card"**. Xem log Cloudflare dòng `[ai] add-node usage:`. Thinking tắt thì số output token phải giảm rõ, không còn hàng nghìn token suy nghĩ.
2. Mở Code Modal, kiểm tra class:
   - `grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3` ở container.
   - Card có `rounded-2xl shadow-md ... hover:shadow-xl hover:-translate-y-1`.
   - Không còn `flex flex-col gap-4 p-4` thừa ở wrapper.
3. Gõ "tạo danh sách sản phẩm" (không nêu số lượng): phải ra khoảng 3 item trong 1 grid, không phải 10 card chồng dọc.
4. Prompt cố tình dài ("30 card...") phải trả về lỗi 504 sau tối đa 90 giây thay vì treo vô hạn.

## Giới hạn cần biết

- **Mình chưa đo được tốc độ thật.** Việc tắt thinking là sửa theo tài liệu, không phải số liệu của riêng bạn. Nếu vẫn chậm sau khi đã nâng `workers-ai-provider`, dùng log `usage` để biết output token là bao nhiêu rồi tính tiếp. Phương án dự phòng là đổi sang `@cf/meta/llama-3.1-8b-instruct-fast`, model không-reasoning có trong danh sách JSON Mode của Cloudflare, nhưng chất lượng layout sẽ thấp hơn.
- **Node thêm bằng nút "+" vẫn dùng `defaultStyle`** (`flex flex-col gap-4 p-4`). Mình chỉ bỏ nó ở nhánh AI. Nếu bạn muốn đổi cả default thủ công thì chỉnh `containerDefaultStyle`.
- **Preset mới chỉ AI dùng được.** Việc áp preset 1 chạm từ Inspector (action `applyStylePreset` + 1 ô chọn) là bước tiếp theo hợp lý, vì dữ liệu đã sẵn.
- **Prompt dài hơn khoảng vài trăm token** (danh sách preset + 1 ví dụ). Đổi lại, output mỗi node ngắn hơn nhiều, và input rẻ hơn output như bạn đã chốt.