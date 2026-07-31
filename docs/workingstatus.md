Đúng, hiểu lại rồi — V4 là scaffold thật (folder `app/`+`components/`+`package.json` chạy được ngay), phần logic/state để dev tự viết hoặc cùng AI agent trong VS Code. Không phải lỗ hổng, mà đúng định vị: **Builder giải quyết khâu dev khó làm nhất bằng lời (tả UI cho AI), còn logic thì dev vẫn mạnh hơn AI ở khâu đó** — phân công rất hợp lý. Đây là nội dung roadmap:

---

# Roadmap — 26visualbuilder

*Nguyên tắc: mỗi version giải đúng 1 nỗi đau cụ thể, ship được để test thị trường ngay khi xong, không gộp nhiều mục tiêu mơ hồ vào 1 bản.*

## V1 — Đã hoàn thành ✅
**Nỗi đau:** dựng UI bằng code tay từ đầu tốn thời gian; tool kéo-thả tự do (Figma, free-drag builder) sinh code bẩn, vỡ layout mobile, không ra code thật dùng được.

**Đã có:** Node Tree quản lý cấu trúc (Godot-style) · Canvas Preview render React DOM thật, không canvas pixel · Node Registry mở rộng (66 definition: HTML + shadcn + system) · Inspector cơ bản (layout: flex/gap/padding/align + props riêng từng component) · Export JSX sạch, Tailwind chuẩn · Kiến trúc Project thống nhất (Folder/Page/Component, Node Rules, tái sử dụng Component qua Instance, export multi-file đúng cấu trúc `app/`/`components/`).

## V2 — Style Editor
**Nỗi đau:** dựng được khung/cấu trúc rồi, nhưng chưa polish được thẩm mỹ thật — Inspector hiện chỉ chỉnh layout, chưa chỉnh được màu sắc, typography, border/shadow, hay responsive theo breakpoint.

**Giải pháp:** mở rộng Inspector thành style editor đầy đủ — color picker, font-size/weight, border-radius/shadow, và chỉnh riêng cho từng breakpoint (mobile/tablet/desktop).

**Tiêu chí xong:** dựng 1 trang landing hoàn chỉnh về mặt thẩm mỹ, không cần mở code tay để sửa style.

## V3 — Export ảnh (+ Save/Load ý tưởng)
**Nỗi đau:** solo dev ngại mở Figma/design tool chỉ để vẽ mockup show ý tưởng hoặc lưu lại 1 bản để tham khảo sau.

**Giải pháp:** xuất Canvas hiện tại ra file ảnh (PNG) trực tiếp trong app.

**⚠️ Điểm chưa chốt:** ảnh chỉ xem được, không sửa lại được — nếu đóng tab sau khi dựng dở, mất hết. Cần quyết định: gộp thêm Save/Load project (JSON) vào bản này, hay để dồn qua bản khác? (câu hỏi này mình đã đặt ra ở lượt trước, chưa có câu trả lời).

## V4 — Export Project (scaffold Next.js thật)
**Nỗi đau:** dev dùng AI coding agent (Cursor/Claude Code/Copilot...) nhưng khó tả rõ UI mong muốn bằng lời cho agent hiểu đúng ý — mất nhiều vòng sửa qua lại.

**Giải pháp:** xuất ra **thư mục project thật** (`app/`, `components/`, `package.json` pin đúng version ổn định đã test) — chạy `pnpm install` là có ngay UI đúng như đã dựng. Phần state/logic/event để dev tự viết hoặc code tiếp cùng AI agent trong VS Code, dựa trên khung UI đã có sẵn.

**Định vị:** Builder lo phần AI agent khó làm (hiểu đúng ý UI qua lời tả), dev + AI agent lo phần dev mạnh hơn (logic/state).

## V5 — Supabase / Community
**Nỗi đau:** chưa có nơi chia sẻ Component/Template giữa người dùng; muốn xây kênh tăng trưởng tự nhiên qua nội dung do cộng đồng tạo.

**Giải pháp:** kết nối Supabase — publish/discover Component, Template Marketplace.

**Lưu ý:** đây là mở 1 mặt trận sản phẩm mới (content/community platform), không chỉ là "thêm database" — cần bàn riêng về auth, moderation, chiến lược SEO/nội dung khi tới lúc. Bạn đã đồng ý sẽ chia nhỏ version này sau.

## V6 — Mini Script / Plugin API *(nếu thật sự cần)*
Để cuối, chỉ làm khi có nhu cầu thật từ cộng đồng dùng V5 muốn mở rộng ngoài khả năng có sẵn.

## Đã loại bỏ
**AI Generate UI / Refactor Layout / Fix Responsive** — rủi ro sản phẩm cao, không cần thiết để test thị trường sớm.