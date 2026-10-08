Chốt — đúng, token input thường rẻ hơn output đáng kể ở hầu hết provider, "generous với context input" là quyết định hợp lý. Áp dụng cụ thể: gửi **toàn bộ cây Page đang mở** (không rút gọn `children`), chỉ giới hạn ở phạm vi **1 Page** (không gửi các Page khác trong project) — giới hạn này không phải để tiết kiệm token, mà vì nội dung Page khác **không liên quan** tới yêu cầu "thêm vào Page này", đưa vào chỉ gây nhiễu, không giúp model làm tốt hơn.

Chưa có breakdown phase cụ thể cho tính năng này (2 lượt tư vấn trước chỉ bàn kiến trúc tổng, chưa chia nhỏ) — mình đề xuất 4 phase theo đúng granularity đã giữ suốt project (data/logic thuần trước, chưa tốn phí gọi AI thật; UI/gọi model thật sau cùng):

**Phase 1** — Zod schema + Context builder + Registry summary (thuần logic, test được 100% không tốn 1 token AI nào)
**Phase 2** — API Route: AI SDK + Workers AI + validate
**Phase 3** — Áp kết quả đã validate vào Zustand (sinh ID thật, check lại Node Rules)
**Phase 4** — UI: điểm vào trong `QuickAddDropdown` + ô nhập prompt + loading/error

# Làm Phase 1 ngay.

```bash
npm install zod
```

## File mới: `features/ai-assistant/schemas/ai-output.schema.ts`

```typescript
import { z } from "zod";

export interface AiNode {
  nodeType: string;
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
  children?: AiNode[];
}

// Đệ quy lồng sâu bao nhiêu tầng cũng được trong 1 operation — vá đúng lỗi "phẳng" của
// bản GPT đưa (không làm được ví dụ Pricing 3 card chính nó tự nêu).
const aiNodeSchema: z.ZodType<AiNode> = z.lazy(() =>
  z.object({
    nodeType: z.string(),
    // props/style chỉ validate ĐÚNG HÌNH DẠNG JSON ở đây — validate đúng NGHĨA (key nào
    // hợp lệ với đúng defId nào) xảy ra ở Phase 3 qua propsSchema/Node Rules thật, không
    // lặp lại logic đó trong Zod.
    props: z.record(z.string(), z.unknown()).optional(),
    style: z.record(z.string(), z.unknown()).optional(),
    children: z.array(aiNodeSchema).max(20).optional(),
  })
);

const aiOperationSchema = z.object({
  action: z.literal("add"), // v1 chỉ "add" — đã chốt ở lượt thảo luận trước, chưa làm modify/replace
  parentId: z.string(),     // phải khớp 1 id THẬT nằm trong currentPageTree gửi lên — check ở Phase 3
  node: aiNodeSchema,
});

export const aiResponseSchema = z.object({
  operations: z.array(aiOperationSchema).max(10),
  summary: z.string().max(200).optional(), // model tự giải thích ngắn gọn đã làm gì — hiện cho người dùng xem, hữu ích khi debug model hiểu sai ý
});

export type AiOperation = z.infer<typeof aiOperationSchema>;
export type AiResponse = z.infer<typeof aiResponseSchema>;
```

## File mới: `core/registry/ai-registry-summary.ts`

```typescript
import { nodeRegistry } from "./node-registry";

export interface RegistrySummaryEntry {
  id: string;
  title: string;
  nodeKind: string;
  canHaveChildren: boolean;
  propKeys: string[]; // chỉ TÊN field — đủ để model biết "node này nhận props gì",
                        // không cần gửi label/inputType/options (đó là chi tiết cho UI Inspector, không cần cho model).
}

// Gửi TOÀN BỘ definition hợp lệ, không lọc theo tags — 66 node đủ nhỏ để chưa cần cơ chế
// retrieval riêng, đúng nguyên tắc không xây hạ tầng cho vấn đề chưa đo được có thật
// sự cần hay không.
export function getAiRegistrySummary(): RegistrySummaryEntry[] {
  return Object.values(nodeRegistry)
    // CHỈ html/shadcn — AI không được tự tạo Folder/Page/Component/Instance, đúng đúng
    // phạm vi "Contextual Add" (thêm nội dung TRONG 1 Page), không phải dựng cấu trúc Project.
    .filter((def) => def.nodeKind === "html" || def.nodeKind === "shadcn")
    .map((def) => ({
      id: def.id,
      title: def.title,
      nodeKind: def.nodeKind,
      canHaveChildren: def.canHaveChildren,
      propKeys: def.propsSchema.map((p) => p.key),
    }));
}
```

## File mới: `features/ai-assistant/utils/build-ai-context.ts`

```typescript
import { TreeNode } from "@/core/types/builder.types";
import { SYSTEM_NODE_IDS } from "@/core/registry/system-nodes";
import { findNode } from "@/core/store/builder-store";

export interface AiContextPayload {
  currentPageTree: TreeNode;      // TOÀN BỘ subtree Page đang mở, bao gồm children đầy đủ
  selectedNodeId: string | null;  // node đang chọn trong currentPageTree (nếu có) — gợi ý vị trí
  referencedComponents: TreeNode[]; // mọi Component canonical mà Page này có Instance trỏ tới
}

// Nếu Page có dùng lại Component (qua Instance), gửi kèm ĐẦY ĐỦ cấu trúc thật của
// Component đó — để model biết chính xác hình dạng nếu muốn đề xuất tái sử dụng,
// không phải đoán mò qua tên.
function collectReferencedComponents(
  pageTree: TreeNode,
  fullTree: TreeNode,
  acc: TreeNode[] = [],
  seen = new Set<string>()
): TreeNode[] {
  function walk(node: TreeNode) {
    if (node.type === SYSTEM_NODE_IDS.componentInstance && node.referenceId && !seen.has(node.referenceId)) {
      const componentNode = findNode(fullTree, node.referenceId);
      if (componentNode) {
        seen.add(node.referenceId);
        acc.push(componentNode);
        walk(componentNode); // Component lồng Instance của Component khác — đệ quy tiếp
      }
    }
    node.children.forEach(walk);
  }
  walk(pageTree);
  return acc;
}

// Chỉ giới hạn ở phạm vi Page đang mở — KHÔNG phải để tiết kiệm token (đã chốt: input
// cứ gửi đủ), mà vì nội dung Page khác trong project không liên quan tới yêu cầu hiện tại.
export function buildAiContext(
  fullTree: TreeNode,
  currentPageTree: TreeNode,
  selectedNodeId: string | null
): AiContextPayload {
  return {
    currentPageTree,
    selectedNodeId,
    referencedComponents: collectReferencedComponents(currentPageTree, fullTree),
  };
}
```

---
**Test nhanh (thuần logic, chưa cần gọi AI thật, không tốn phí):**
1. Console: `getAiRegistrySummary().length` → phải ra đúng **62** (66 definition trừ 4 system: folder/page/component/component-instance).
2. `getAiRegistrySummary().find(d => d.id === "shadcn.button")` → `propKeys` phải là `["text","variant","size"]`, khớp đúng `propsSchema` thật (không phải `children`).
3. Dựng tạm 1 project có Component + Instance trong 1 Page → gọi `buildAiContext(tree, pageNode, null)` → `referencedComponents` phải có đúng 1 phần tử, chứa đủ `children` thật của Component đó.
4. `aiResponseSchema.safeParse({operations: [{action:"add", parentId:"x", node:{nodeType:"shadcn.badge", props:{text:"New"}, children:[{nodeType:"html.span", props:{text:"inner"}}]}}]})` → `.success` phải `true` — xác nhận schema lồng đệ quy hoạt động đúng.

# Làm Phase 2 (API Route: AI SDK + Workers AI + validate) 

**Chọn model: `@cf/zai-org/glm-4.7-flash`** — tra cứu xác nhận đây là model **còn hoạt động tốt** (có 1 chỗ dễ hiểu nhầm: 1 bản changelog liệt kê model này cạnh thông báo "deprecation", nhưng đọc kỹ thì đó là **thông báo giới thiệu model mới**, không phải model bị khai tử — phần bị khai tử thật là các bản Llama/GPT cũ hơn liệt kê phía dưới). Lý do chọn đúng cho use case: GLM-4.7-Flash được quảng bá tối ưu riêng cho hội thoại, theo hướng dẫn, và gọi công cụ nhiều lượt trên hơn 100 ngôn ngữ — khớp sát nhu cầu của bạn (prompt tiếng Việt) hơn hẳn 1 model tổng quát như Llama 3.1 8B. Các model "flagship" hơn (GLM-5.3, Kimi K2.6 — ngữ cảnh 1M token, giá cao hơn nhiều) dành cho coding agent nặng, không cần cho tác vụ nhỏ "thêm 1 node" này.

```bash
npm install ai workers-ai-provider
```

## Patch `wrangler.jsonc`

```jsonc
{
  "r2_buckets": [...],
  "ai": {
    "binding": "AI"
  },
  "vars": { ... }
}
```

Chạy lại `npx wrangler types` (đúng bước đã làm khi thêm R2 binding) để TypeScript nhận đúng kiểu `env.AI`.

## File mới: `features/ai-assistant/prompts/add-node.prompt.ts`

```typescript
import { RegistrySummaryEntry } from "@/core/registry/ai-registry-summary";
import { AiContextPayload } from "../utils/build-ai-context";

function formatRegistryEntry(entry: RegistrySummaryEntry): string {
  const childInfo = entry.canHaveChildren ? "can have children" : "leaf, no children";
  const props = entry.propKeys.length > 0 ? entry.propKeys.join(", ") : "(no props)";
  return `- ${entry.id} | ${entry.title} | ${childInfo} | props: ${props}`;
}

export function buildAddNodeSystemPrompt(
  registry: RegistrySummaryEntry[],
  context: AiContextPayload
): string {
  return `You are the Node Assistant of 26VisualBuilder, a tree-based visual UI builder.

Your job: given a user request (may be in Vietnamese or English), propose ONE or MORE new nodes to ADD into the user's current Page.

STRICT RULES:
1. You may ONLY use "nodeType" values from the REGISTRY list below. Never invent a new nodeType.
2. A leaf node ("leaf, no children") must never get a "children" array.
3. "parentId" MUST be the id of a node that already exists in CURRENT PAGE TREE below — never invent an id.
4. Only use prop keys listed for that nodeType in the registry. Do not add unknown prop keys.
5. action is always "add". You are not allowed to modify or delete existing nodes.
6. Prefer the simplest structure that satisfies the request.
7. "summary" should briefly explain (in the user's language) what you added.

REGISTRY (id | title | children? | props):
${registry.map(formatRegistryEntry).join("\n")}

CURRENT PAGE TREE (JSON):
${JSON.stringify(context.currentPageTree)}
${context.referencedComponents.length > 0
  ? `\nREUSABLE COMPONENTS already defined in this project (for style/content reference only):\n${JSON.stringify(context.referencedComponents)}\n`
  : ""}
SELECTED NODE ID (where the user is currently focused): ${context.selectedNodeId ?? "(none selected)"}
`;
}
```

## File mới: `src/app/api/ai/add-node/route.ts`

```typescript
import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { createClient } from "@/core/supabase/server";
import { getAiRegistrySummary } from "@/core/registry/ai-registry-summary";
import { aiResponseSchema } from "@/features/ai-assistant/schemas/ai-output.schema";
import { buildAddNodeSystemPrompt } from "@/features/ai-assistant/prompts/add-node.prompt";
import { AiContextPayload } from "@/features/ai-assistant/utils/build-ai-context";

// GLM-4.7-Flash — tối ưu đa ngôn ngữ + tool calling nhiều lượt, phù hợp prompt tiếng Việt
// hơn model tổng quát; nhẹ hơn nhiều so với các model "flagship" (GLM-5.3, Kimi K2.6)
// vốn dành cho agentic coding nặng, không cần cho tác vụ nhỏ "thêm node" này.
const MODEL_ID = "@cf/zai-org/glm-4.7-flash";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Cần đăng nhập để dùng AI Assistant." }, { status: 401 });
    }

    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const context = body.context as AiContextPayload | undefined;

    if (!prompt) return NextResponse.json({ error: "Thiếu nội dung yêu cầu." }, { status: 400 });
    if (!context?.currentPageTree) {
      return NextResponse.json({ error: "Thiếu context trang hiện tại." }, { status: 400 });
    }

    // Dynamic import — tránh lỗi startup time đã biết trước (AI SDK v5 + Zod import tĩnh
    // có thể vượt giới hạn khởi động 400ms của Workers).
    const { createWorkersAI } = await import("workers-ai-provider");
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");

    const { env } = getCloudflareContext();
    const workersai = createWorkersAI({ binding: env.AI });

    const registry = getAiRegistrySummary();
    const systemPrompt = buildAddNodeSystemPrompt(registry, context);

    const result = await generateObject({
      model: workersai(MODEL_ID),
      system: systemPrompt,
      prompt,
      schema: aiResponseSchema,
    });

    // Chỉ validate ĐÚNG HÌNH DẠNG JSON ở đây (Zod, qua generateObject) — validate đúng
    // NGHĨA (parentId có thật không, nodeType có hợp lệ với Node Rules không) là việc
    // của Phase 3, xảy ra ở client khi áp vào Zustand, không lặp lại ở đây.
    return NextResponse.json({ success: true, data: result.object });
  } catch (err) {
    console.error("[ai] add-node thất bại:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI Assistant thất bại — thử lại." },
      { status: 500 }
    );
  }
}
```

---
**⚠️ Nhắc lại quan trọng trước khi test:** Workers AI **không có giả lập local** — gọi route này dù đang chạy `next dev` trên máy bạn vẫn **gọi thật** lên Cloudflare, tốn quota/phí thật ngay từ lần test đầu tiên. Không có cách nào né được như đã từng làm với R2.

**Rate limit vẫn chưa có** (đúng dự kiến đã nêu ở lượt thảo luận trước) — nhưng **chưa nguy hiểm** ở bước này vì route chưa được gọi từ bất kỳ UI nào (chỉ Phase 4 mới nối nút bấm thật vào) — cần giải quyết **trước khi** làm Phase 4, không phải trước Phase 2/3.

**Test nhanh (test tay bằng `curl` hoặc Postman, chưa cần UI):**
```bash
curl -X POST http://localhost:3000/api/ai/add-node \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Thêm 1 badge màu xanh ghi chữ New phía trên",
       "context":{"currentPageTree":{"id":"home-page","type":"system.page","props":{"name":"Home"},"style":{"base":{}},"children":[]},"selectedNodeId":null,"referencedComponents":[]}}'
```
(Cần header Cookie session đăng nhập thật nếu test qua `curl` thuần — dễ hơn là test tạm qua 1 nút bấm `fetch()` ngay trong DevTools Console khi đang đăng nhập sẵn trên trình duyệt.) Response phải trả về `{"success":true,"data":{"operations":[...], "summary":"..."}}`, trong đó mọi `node.nodeType` phải là `id` thật nằm trong Registry (không bịa), và field props phải dùng đúng tên `text` (không phải `children`) — xác nhận prompt đã dẫn đúng model.

# Làm Phase 3 (áp kết quả vào Zustand + check lại Node Rules) 

## Patch nhỏ cho Phase 1 — tách type ra khỏi schema trước khi dùng ở Phase 3

Lý do: `core/utils/apply-ai-operations.ts` (viết ở phase này) cần dùng type `AiNode`/`AiOperation`, nhưng chúng đang định nghĩa trong `features/ai-assistant/` — nếu `core/` import ngược vào `features/`, phá đúng nguyên tắc kiến trúc đã giữ xuyên suốt project (core không phụ thuộc ngược vào feature cụ thể, lý do y hệt khi tách `page-capture.types.ts` ra `core/` ở V3). Dời type thuần sang `core/`, giữ Zod schema (cơ chế validate runtime, đúng là việc của feature) ở lại `features/`.

## File mới: `core/types/ai-operation.types.ts`

```typescript
export interface AiNode {
  nodeType: string;
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
  children?: AiNode[];
}

export interface AiOperation {
  action: "add";
  parentId: string;
  node: AiNode;
}
```

## Patch `features/ai-assistant/schemas/ai-output.schema.ts`

```typescript
// Đổi:
import { z } from "zod";

export interface AiNode {
  nodeType: string;
  props?: Record<string, unknown>;
  style?: Record<string, unknown>;
  children?: AiNode[];
}

const aiNodeSchema: z.ZodType<AiNode> = z.lazy(() => ...);

const aiOperationSchema = z.object({
  action: z.literal("add"),
  parentId: z.string(),
  node: aiNodeSchema,
});

// Thành:
import { z } from "zod";
import { AiNode, AiOperation } from "@/core/types/ai-operation.types";

const aiNodeSchema: z.ZodType<AiNode> = z.lazy(() =>
  z.object({
    nodeType: z.string(),
    props: z.record(z.string(), z.unknown()).optional(),
    style: z.record(z.string(), z.unknown()).optional(),
    children: z.array(aiNodeSchema).max(20).optional(),
  })
);

const aiOperationSchema: z.ZodType<AiOperation> = z.object({
  action: z.literal("add"),
  parentId: z.string(),
  node: aiNodeSchema,
});
```

Phần còn lại (`aiResponseSchema`, `AiResponse`) giữ nguyên — chỉ bỏ `export type AiOperation = z.infer<...>` (giờ import thẳng từ `core/`, không suy ra từ Zod nữa).

## Patch `core/types/style.types.ts`

Thêm vào cuối file:
```typescript
// Danh sách tường minh mọi key hợp lệ của StyleProps — dùng để lọc an toàn dữ liệu từ
// nguồn KHÔNG đáng tin cậy (AI output). Phải tự tay đồng bộ khi thêm field mới vào
// StyleProps (không có cách nào suy ra tự động từ TypeScript interface lúc runtime).
export const STYLE_PROP_KEYS: (keyof StyleProps)[] = [
  "direction", "gap", "align", "justify",
  "width", "height",
  "position", "top", "right", "bottom", "left", "zIndex",
  "padding", "margin",
  "overflow", "opacity",
  "flexWrap", "alignSelf", "flexGrow", "flexShrink",
  "textColor", "bgColor",
  "fontSize", "fontWeight", "textAlign",
  "borderWidth", "borderColor", "borderRadius", "shadow",
];
```

## File mới: `core/utils/apply-ai-operations.ts`

```typescript
import { TreeNode } from "@/core/types/builder.types";
import { AiNode, AiOperation } from "@/core/types/ai-operation.types";
import { NodeDefinition, PropInputType } from "@/core/types/node-definition.types";
import { StyleProps, STYLE_PROP_KEYS } from "@/core/types/style.types";
import { getNodeDefinition } from "@/core/registry/node-registry";
import { canContain } from "@/core/registry/node-rules";

export interface ApplyAiOperationsResult {
  tree: TreeNode;
  appliedCount: number;   // số operation cấp cao nhất đã áp dụng thành công
  skippedTopLevel: number; // operation bị bỏ hẳn (parentId sai, hoặc node gốc vi phạm Node Rules)
  skippedNested: number;   // node con bị bỏ riêng lẻ bên trong 1 operation vẫn áp dụng được phần còn lại
}

function findNodeLocal(node: TreeNode, id: string): TreeNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeLocal(child, id);
    if (found) return found;
  }
  return null;
}

function coerceValue(inputType: PropInputType, raw: unknown, fallback: unknown): unknown {
  switch (inputType) {
    case "number": {
      const n = typeof raw === "number" ? raw : Number(raw);
      return Number.isFinite(n) ? n : fallback;
    }
    case "checkbox": {
      if (typeof raw === "boolean") return raw;
      if (raw === "true") return true;
      if (raw === "false") return false;
      return fallback;
    }
    default:
      return typeof raw === "string" ? raw : fallback;
  }
}

// Chỉ nhận đúng key đã khai báo trong propsSchema thật của node đó — AI có thể bịa thêm
// key lạ (hoặc dùng sai tên như "children" thay vì "text"), những key đó bị bỏ qua, không
// bao giờ lọt vào TreeNode.props.
function mergeProps(def: NodeDefinition, aiProps: Record<string, unknown> | undefined): Record<string, unknown> {
  const merged = structuredClone(def.defaultProps);
  if (!aiProps) return merged;

  for (const meta of def.propsSchema) {
    if (meta.key in aiProps) {
      merged[meta.key] = coerceValue(meta.inputType, aiProps[meta.key], merged[meta.key]);
    }
  }
  return merged;
}

// Lọc qua STYLE_PROP_KEYS — chặn AI nhồi field style không tồn tại/không hợp lệ vào state.
function mergeStyle(def: NodeDefinition, aiStyle: Record<string, unknown> | undefined): Partial<StyleProps> {
  const merged: Partial<StyleProps> = structuredClone(def.defaultStyle ?? {});
  if (!aiStyle) return merged;

  for (const key of STYLE_PROP_KEYS) {
    if (key in aiStyle) {
      (merged as Record<string, unknown>)[key] = aiStyle[key as string];
    }
  }
  return merged;
}

// Đệ quy: validate TỪNG node con theo đúng Node Rules thật (canContain) của app — không
// tin tưởng mù prompt đã dặn model, vì model vẫn có thể hiểu sai/bịa ra nodeType lạ.
// 1 node con sai KHÔNG làm hỏng cả nhánh — chỉ node đó (và con cháu của riêng nó) bị bỏ,
// phần còn lại của cây vẫn được áp dụng — giữ đúng giá trị "AI đúng được phần nào, dùng
// phần đó", người dùng không mất hết công chỉ vì 1 chi tiết nhỏ sai.
function buildChildrenRecursive(
  aiChildren: AiNode[] | undefined,
  parentDef: NodeDefinition,
  stats: { skippedNested: number }
): TreeNode[] {
  if (!parentDef.canHaveChildren || !aiChildren || aiChildren.length === 0) return [];

  const result: TreeNode[] = [];
  for (const aiChild of aiChildren) {
    const childDef = getNodeDefinition(aiChild.nodeType);

    if (!childDef || (childDef.nodeKind !== "html" && childDef.nodeKind !== "shadcn")) {
      stats.skippedNested++;
      continue;
    }
    if (!canContain(parentDef, childDef.nodeKind)) {
      stats.skippedNested++;
      continue;
    }

    result.push({
      id: crypto.randomUUID(), // AI không được quyết định id thật — luôn sinh mới ở đây
      type: aiChild.nodeType,
      props: mergeProps(childDef, aiChild.props),
      style: { base: mergeStyle(childDef, aiChild.style) },
      children: buildChildrenRecursive(aiChild.children, childDef, stats),
    });
  }
  return result;
}

export function applyAiOperationsToTree(tree: TreeNode, operations: AiOperation[]): ApplyAiOperationsResult {
  const newTree = structuredClone(tree);
  const stats = { skippedNested: 0 };
  let appliedCount = 0;
  let skippedTopLevel = 0;

  for (const op of operations) {
    const parentNode = findNodeLocal(newTree, op.parentId);
    if (!parentNode) {
      skippedTopLevel++;
      continue;
    }
    const parentDef = getNodeDefinition(parentNode.type);
    if (!parentDef) {
      skippedTopLevel++;
      continue;
    }

    // Bọc node gốc của operation vào mảng 1 phần tử — tái dùng ĐÚNG logic validate dùng
    // cho node con bình thường, không viết lại 1 lần nữa cho "node cấp cao nhất".
    const built = buildChildrenRecursive([op.node], parentDef, stats);
    if (built.length === 0) {
      skippedTopLevel++;
      continue;
    }

    parentNode.children.push(...built);
    appliedCount++;
  }

  return { tree: newTree, appliedCount, skippedTopLevel, skippedNested: stats.skippedNested };
}
```

## Patch `core/store/builder-store.ts`

Thêm import:
```typescript
import { AiOperation } from "@/core/types/ai-operation.types";
import { applyAiOperationsToTree, ApplyAiOperationsResult } from "@/core/utils/apply-ai-operations";
```

Thêm vào interface `BuilderState`:
```typescript
  applyAiOperations: (operations: AiOperation[]) => ApplyAiOperationsResult;
```

Thêm action (đặt cạnh `convertToComponent`):
```typescript
  applyAiOperations: (operations) => {
    let result!: ApplyAiOperationsResult;
    set((state) => {
      result = applyAiOperationsToTree(state.tree, operations);
      return { tree: result.tree };
    });
    return result;
  },
```

---
**Test nhanh (console, chưa cần UI — Phase 4):**
```javascript
const { applyAiOperations } = useBuilderStore.getState();

// Giả lập 1 response AI hợp lệ:
applyAiOperations([{
  action: "add",
  parentId: "home-page", // thay bằng id Page thật đang có trong project test
  node: { nodeType: "shadcn.badge", props: { text: "New" } },
}]);
// → { appliedCount: 1, skippedTopLevel: 0, skippedNested: 0 } + Canvas phải hiện Badge mới ngay

// Giả lập AI "hallucinate" sai nodeType:
applyAiOperations([{
  action: "add", parentId: "home-page",
  node: { nodeType: "shadcn.khong-ton-tai", props: {} },
}]);
// → { appliedCount: 0, skippedTopLevel: 1, skippedNested: 0 } — KHÔNG crash, không chèn gì vào cây

// Giả lập 1 subtree, trong đó có 1 node con sai lẫn vào node đúng:
applyAiOperations([{
  action: "add", parentId: "home-page",
  node: {
    nodeType: "html.div",
    children: [
      { nodeType: "html.h1", props: { text: "Tiêu đề" } },
      { nodeType: "sai-be-bet", props: {} },
    ],
  },
}]);
// → { appliedCount: 1, skippedTopLevel: 0, skippedNested: 1 } — div + h1 được thêm,
//    riêng node sai bị bỏ, không làm hỏng cả nhánh.
```

# Làm Phase 4 (UI: điểm vào trong `QuickAddDropdown` + ô nhập prompt + loading/error) 
Trước khi vào UI, phải giải quyết luôn 1 việc mình đã cảnh báo từ 2 lượt trước: **"chưa nguy hiểm vì chưa có UI gọi" — giờ hết đúng**, vì đây chính là lượt nối nút bấm thật vào. Không thể hoãn thêm nữa, làm cùng lúc với UI.

## Patch `src/app/api/ai/add-node/route.ts`

Thêm ngay sau đoạn check `user` (trước khi đụng tới model — tiết kiệm đúng chi phí thật sự, không tốn 1 lệnh gọi AI nào nếu đã vượt hạn mức):
```typescript
const { data: allowed, error: usageError } = await supabase.rpc("increment_ai_usage", { max_per_day: 20 });
if (usageError || !allowed) {
  return NextResponse.json(
    { error: "Bạn đã dùng hết lượt AI hôm nay (tối đa 20 lượt/ngày) — thử lại vào ngày mai." },
    { status: 429 }
  );
}
```

## File mới: `features/ai-assistant/hooks/use-ai-add-node.ts`

```typescript
"use client";

import { useState } from "react";
import { useBuilderStore, findNode } from "@/core/store/builder-store";
import { buildAiContext } from "../utils/build-ai-context";
import { AiResponse } from "../schemas/ai-output.schema";

export function useAiAddNode() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (prompt: string) => {
    setIsGenerating(true);
    setError(null);
    try {
      const { tree, activePageId, activeNodeId, applyAiOperations } = useBuilderStore.getState();
      if (!activePageId) {
        setError("Chưa có trang nào đang mở.");
        return null;
      }
      const pageNode = findNode(tree, activePageId);
      if (!pageNode) {
        setError("Không tìm thấy trang hiện tại.");
        return null;
      }

      const context = buildAiContext(tree, pageNode, activeNodeId);

      const res = await fetch("/api/ai/add-node", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context }),
      });

      // Đọc dạng text trước — đúng pattern đã né lỗi "Unexpected end of JSON input"
      // từng gặp ở luồng upload R2, tránh lặp lại y hệt bug đó ở đây.
      const text = await res.text();
      let json: { success?: boolean; data?: AiResponse; error?: string };
      try {
        json = JSON.parse(text);
      } catch {
        setError(`AI thất bại (status ${res.status}).`);
        return null;
      }

      if (!res.ok || !json.success || !json.data) {
        setError(json.error ?? "AI thất bại — thử lại.");
        return null;
      }

      const result = applyAiOperations(json.data.operations);
      return {
        summary: json.data.summary ?? "Đã thêm nội dung mới.",
        appliedCount: result.appliedCount,
        skippedCount: result.skippedTopLevel + result.skippedNested,
      };
    } catch (err) {
      console.error("[ai] generate thất bại:", err);
      setError("AI thất bại — kiểm tra console.");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generate, isGenerating, error };
}
```

## File mới: `features/ai-assistant/components/ai-add-node-popover.tsx`

```tsx
"use client";

import { useState } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAiAddNode } from "../hooks/use-ai-add-node";

export function AiAddNodePopover({ disabled }: { disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const { generate, isGenerating, error } = useAiAddNode();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const result = await generate(prompt.trim());
    if (!result) return; // error đã hiện trong popover, không đóng để user thử lại luôn

    if (result.skippedCount > 0) {
      toast.warning(`${result.summary} (bỏ qua ${result.skippedCount} phần không hợp lệ)`);
    } else {
      toast.success(result.summary);
    }
    setPrompt("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-7 w-7" disabled={disabled} title="Thêm bằng AI">
          <Sparkles className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-80 p-3 flex flex-col gap-2 z-[7000]">
        <p className="text-xs font-medium">✨ Ask AI</p>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='VD: "Thêm badge New màu xanh phía trên"'
          rows={3}
          disabled={isGenerating}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <Button size="sm" onClick={handleGenerate} disabled={isGenerating || !prompt.trim()}>
          {isGenerating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
          {isGenerating ? "Đang tạo..." : "Generate"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
```

## Patch `features/nodes-tree/components/tree-toolbar.tsx`

Thêm import:
```typescript
import { AiAddNodePopover } from "@/features/ai-assistant/components/ai-add-node-popover";
```

Thêm ngay **cạnh** nút `[+]` (cùng hàng, đúng yêu cầu — không đưa vào trong `QuickAddDropdown`):
```tsx
<Popover open={quickAddOpen} onOpenChange={setQuickAddOpen}>
  {/* ...giữ nguyên Popover Quick Add như cũ... */}
</Popover>

<AiAddNodePopover disabled={!canAdd} />

<Button
  variant="outline" size="icon" className="h-7 w-7"
  disabled={!canConvert} onClick={handleConvert}
  title="Convert to Component"
>
```

Dùng chung điều kiện `canAdd` với nút `[+]` — AI cần 1 node cha đang chọn để biết neo ngữ cảnh vào đâu, đúng mô hình "Contextual Add" đã thống nhất.

---
**Test nhanh:** chọn 1 node có thể chứa con (VD Page/Container) → nút ✨ cạnh `[+]` phải sáng lên → bấm, gõ "Thêm 1 nút Đăng ký màu xanh" → Generate → phải thấy loading → Canvas tự hiện node mới, toast báo đúng `summary` model trả về. Gõ prompt cố tình mơ hồ/yêu cầu thứ không có trong Registry (VD "thêm video player") → vẫn phải chạy xong, không crash — toast phải báo "bỏ qua N phần không hợp lệ" nếu model đoán sai. Test vượt hạn mức: gọi RPC `increment_ai_usage` tay 20 lần qua SQL Editor cho đúng user đang test → bấm Generate lần tiếp theo → phải báo lỗi 429 "hết lượt hôm nay", **không** gọi tới model (xác nhận chặn đúng trước khi tốn phí).

Toàn bộ 4 Phase của tính năng AI Node Assistant đã hoàn thành.