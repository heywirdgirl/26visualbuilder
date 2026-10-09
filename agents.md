Chẩn đoán **đúng gốc rễ** — `3030: Unimplemented keys: ["propertyNames"]` chính xác là lỗi grammar compiler của Workers AI từ chối 1 từ khoá JSON Schema cụ thể. Nhưng xác định **vị trí gây lỗi** thì chưa đúng, và cách sửa đề xuất ("dùng `z.any()` cho cả `operations`") là **quá tay, mất hết lợi ích chính** của việc dùng `generateObject` — có cách sửa hẹp hơn nhiều, không đánh đổi gì cả.

**Đúng thủ phạm: `z.record()`, không phải "Zod nói chung".** Nhìn lại `aiNodeSchema` (Phase 1):
```typescript
props: z.record(z.string(), z.unknown()).optional(),
style: z.record(z.string(), z.unknown()).optional(),
```
Khi Vercel AI SDK chuyển Zod → JSON Schema để gửi cho Workers AI, `z.record(z.string(), ...)` **luôn** sinh ra cấu trúc:
```json
{ "type": "object", "propertyNames": { "type": "string" }, "additionalProperties": {} }
```
— đây là cách chuẩn JSON Schema diễn tả "1 dictionary với key tuỳ ý" — và đúng khớp với `propertyNames` bị báo "chưa cài đặt". Chỉ **2 field này** là thủ phạm; `operations`, `action`, `parentId`, `node.nodeType`, `node.children` (mảng đệ quy) đều dùng cấu trúc JSON Schema bình thường, không hề đụng tới `propertyNames`.

**Vì sao không nên làm theo đề xuất `z.any()` cho `operations`:** làm vậy là **bỏ hoàn toàn** ràng buộc cấu trúc cho đúng phần quan trọng nhất (mảng operation, `action`, `parentId`, `node.nodeType`, đệ quy `children`) — tức là bỏ chính lý do dùng `generateObject` thay vì tự parse text. Chỉ **2 field `props`/`style`** (vốn dĩ là dictionary mở, không thể liệt kê hết key cố định vì mỗi `nodeType` có bộ prop khác nhau) mới cần nới — không phải cả object.

**Sửa đúng phạm vi — đổi `z.record()` → `z.object({}).passthrough()`:** cấu trúc này diễn tả "object với field bất kỳ" nhưng **không** cần khai báo tường minh ràng buộc key (JSON vốn dĩ key luôn là string, không cần assert lại) — nên **không sinh ra `propertyNames`**.

## Patch `features/ai-assistant/schemas/ai-output.schema.ts`

```typescript
// Đổi:
const aiNodeSchema: z.ZodType<AiNode> = z.lazy(() =>
  z.object({
    nodeType: z.string(),
    props: z.record(z.string(), z.unknown()).optional(),
    style: z.record(z.string(), z.unknown()).optional(),
    children: z.array(aiNodeSchema).max(20).optional(),
  })
);

// Thành:
const aiNodeSchema: z.ZodType<AiNode> = z.lazy(() =>
  z.object({
    nodeType: z.string(),
    // z.object({}).passthrough() thay z.record() — tránh sinh "propertyNames" trong
    // JSON Schema, từ khoá Workers AI chưa hỗ trợ (lỗi 3030). Chỉ nới đúng 2 field dictionary
    // mở này — cấu trúc chính (operations/action/parentId/nodeType/children đệ quy) GIỮ NGUYÊN
    // strict, không mất ràng buộc như cách dùng z.any() cho cả operations.
    props: z.object({}).passthrough().optional(),
    style: z.object({}).passthrough().optional(),
    children: z.array(aiNodeSchema).max(20).optional(),
  })
);
```

**Vì sao an toàn khi nới lỏng đúng 2 field này, không lo rủi ro runtime:** `apply-ai-operations.ts` (Phase 3) **đã tự lọc lại** nội dung `props`/`style` theo đúng `propsSchema` thật của từng `nodeType` và `STYLE_PROP_KEYS` — bất kể Zod ở tầng gọi model cho qua hình dạng gì, **không có key lạ nào lọt được vào `TreeNode` thật**. Nới lỏng ở đây chỉ ảnh hưởng tới việc model được "gợi ý" cấu trúc lỏng hơn lúc generate, không ảnh hưởng gì tới an toàn dữ liệu cuối cùng.

---
Sửa xong, deploy lại, thử đúng y prompt "Add new button" đã gặp lỗi trong ảnh — phải sinh ra Button bình thường, không còn lỗi 3030. Nếu vẫn còn lỗi `propertyNames` ở đâu đó khác, khả năng cao còn sót 1 `z.record()` nào nữa trong file — gửi lại nội dung file hiện tại để mình rà nốt.