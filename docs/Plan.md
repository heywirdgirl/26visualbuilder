# Kế hoạch v6: Node Library

| Bản | Nội dung | Cần gửi mình |
|---|---|---|
| **v6.1** | Hạ tầng: `tier`, `parentOnly`, `defaultChildren` lồng nhiều cấp, liên kết `value` giữa cha và con | `builder-store.ts`, `node-definition.types.ts`, `node-rules.ts` |
| **v6.2** | Renderer và code export cho node con của cụm (xử lý Tabs, Accordion làm khuôn mẫu) | `renderer-map.tsx`, `json-to-jsx.ts`, `ui-dependencies.ts` |
| **v6.3** | Node con của cụm: `tabs-list/trigger/content`, `accordion-item`, `table-row/cell`... kèm `parentOnly` | (dùng lại file trên) |
| **v6.4** | Điền nội dung mẫu cho node hiện có: Tabs, Accordion, Table, Dialog, Sheet, Dropdown, Breadcrumb, `ul/ol/nav`, Card | `html-nodes.ts`, `shadcn-nodes.ts` (đã có) |
| **v6.5** | Chuẩn hóa `category` (Alert, Separator đang sai chỗ) và thêm `tier` cho 65 node cũ | (đã có) |
| **v6.6** | Node mới HTML (Đợt 1, khoảng 35 node) + icon | `node-icons.ts` (đã có từ trước) |
| **v6.7** | Node mới shadcn (Đợt 2, khoảng 18 node) + `ui-dependencies` + icon | `components/ui/*` hiện có |
| **v6.8** | UI palette: 3 tab Elements / Components / Blocks, category thu gọn, tìm xuyên tầng, node con chỉ hiện đúng cha | `add-node-browser.tsx`, `node-list-row.tsx` |
| **v6.9** | Blocks: định dạng tree JSON, 10 block hardcode, chèn thành bản sao độc lập | (dùng lại `builder-store.ts`) |

## Phụ thuộc

- v6.1 là nền, phải xong trước.
- v6.2 và v6.3 làm liền nhau, vì không có renderer thì node con chưa hiển thị được.
- v6.4 đến v6.7 gần như độc lập, có thể đổi thứ tự hoặc dừng sau v6.5 nếu muốn ra bản dùng được sớm.
- v6.8 nên làm sau v6.6, để lúc đó palette có đủ node mà kiểm tra.
- v6.9 làm cuối.

## Mốc dùng được

- **Sau v6.5**: node cũ đã có nội dung mẫu, phân loại sạch. Đây là mốc MVP+ đầu tiên.
- **Sau v6.8**: đủ node, palette gọn, dùng thoải mái.
- **Sau v6.9**: có Blocks, hoàn chỉnh v6.

## Quyết định đã chốt (để khỏi hỏi lại)

- Block là bản sao độc lập, hardcode, chưa dùng post cộng đồng.
- Component chèn vào luôn có nội dung mẫu.
- Node con của cụm chỉ hiện khi chọn đúng node cha.

Khi sẵn sàng làm **v6.1**, gửi mình 3 file: `builder-store.ts`, `node-definition.types.ts`, `node-rules.ts`.