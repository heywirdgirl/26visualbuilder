# 26visualbuilder

cloudfare deploy branch save

`26visualbuilder` là một ứng dụng Next.js dạng tree-based UI builder MVP, cho phép người dùng xây dựng giao diện bằng cách kéo & thả node, xem trước trực tiếp, chỉnh sửa thuộc tính và xuất dự án thành mã nguồn hoặc ZIP.

## Tổng quan

Ứng dụng được thiết kế theo mô hình builder:

- `App` và `Components` được tổ chức trong cây dự án.
- Người dùng tạo trang, component và instance component trong cây.
- Preview hiển thị UI runtime từ cấu trúc node hiện tại.
- Inspector cho phép chỉnh layout, spacing, typography và appearance của node đang chọn.
- Code generator sinh ra các file `app/page.tsx` và `components/*.tsx` dựa trên cấu trúc cây.
- Export Project xuất ZIP gồm code nguồn và template UI cần thiết.
- Hỗ trợ đăng nhập bằng Supabase OAuth (Google).

## Kiến trúc chính

### `src/app`

- `layout.tsx`: thiết lập root layout của Next.js App Router, cấu hình font và provider chung.
- `page.tsx`: entry page chính của builder, bao gồm tree view, preview workspace, inspector và các nút thao tác.
- `auth/*`: route callback xử lý trả về OAuth với Supabase.

### `src/core`

`core` là nền tảng quản lý trạng thái, định nghĩa node và tích hợp Supabase.

- `/providers/`: khai báo `ClientProvider` để tránh mismatch SSR/CSR và bọc các provider UI.
- `registry/`: đăng ký loại node, quy tắc node và dependency UI.
- `store/`: Zustand store `builder-store.ts` quản lý toàn bộ trạng thái cây, active node, chế độ edit, breakpoint và hành vi thêm/xóa/chuyển node.
- `supabase/`: helper Supabase cho client/browser và server-side session sync.
- `types/`: định nghĩa TypeScript cho node builder, file export và style.
- `utils/`: utility chung như `cn`, cascade style, chuyển style sang class.

### `src/features`

Mỗi thư mục trong `features` là một module chức năng.

- `auth/`: hook đăng nhập/đăng xuất bằng Supabase.
- `canvas-preview/`: render workspace preview và quản lý ẩn/hiện sidebar.
- `code-generator/`: sinh code JS/TSX từ cấu trúc node của builder.
- `export-project/`: export dự án thành ZIP, thu thập template UI cần thiết và generated files.
- `export-image/`: xuất ảnh từ preview.
- `inspector/`: UI chỉnh sửa thuộc tính node, breakpoint và style.
- `node-palette/`: bảng chọn node/component để thêm vào cây.
- `nodes-tree/`: tree view chính, toolbar và thao tác với tree.

### `src/components/ui`

Chứa các component UI reuse được dùng toàn app, gồm các wrapper và primitives cho Radix/shadcn.

> Không liệt kê chi tiết từng component ở đây vì thư mục này chủ yếu chứa các thành phần UI chung.

### `src/lib`

Các tiện ích hỗ trợ riêng dùng chung cho toàn app.

## Chạy dự án

Sử dụng `pnpm` hoặc `npm`.

```bash
pnpm install
pnpm dev
```

Hoặc nếu dùng npm:

```bash
npm install
npm run dev
```

Trang dev mặc định:

- http://localhost:3000

## Scripts

- `pnpm dev`: chạy `generate:ui-templates`, sau đó chạy Next.js và Tailwind CSS watcher đồng thời.
- `pnpm build`: tạo templates UI, build CSS và build Next.js.
- `pnpm lint`: chạy ESLint.
- `pnpm generate:ui-templates`: sinh `public/component-templates/ui-files.json` từ các file trong `src/components/ui`.

## Các thành phần quan trọng

### Builder store

`src/core/store/builder-store.ts` quản lý:

- cây node dự án với các folder `App` và `Components`.
- thêm/xóa page, folder, component, component instance.
- chuyển node, indent/outdent và cập nhật props/style.
- active node/page và chế độ edit.

### Export project

`src/features/code-generator/utils/export-project.ts`:

- quét cây để xác định page và component.
- tạo file `app/.../page.tsx` và `components/...tsx` tương ứng.
- xây dựng import path tự động cho các component.

`src/features/export-project/hooks/use-export-project.ts`:

- thu thập template dự án, generated files và required UI files.
- tạo ZIP bằng `JSZip` và khởi tạo download.

### Supabase

Ứng dụng dùng Supabase để:

- đăng nhập OAuth bằng Google.
- đồng bộ session qua proxy middleware Next.js.
- xử lý callback auth tại `src/app/auth/callback/route.ts`.

Cấu hình Supabase được tách thành `src/core/supabase/client.ts`, `src/core/supabase/server.ts` và `src/core/supabase/proxy.ts`.

## Cấu hình môi trường

Tạo file `.env` hoặc cấu hình biến môi trường:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (nên thiết lập khi chạy ở production để redirect OAuth chính xác)

## Triển khai

Dự án chạy trên **Cloudflare Workers** thông qua `@opennextjs/cloudflare`. Không dùng cấu hình Cloudflare Pages static, vì ứng dụng có middleware, Supabase auth và Route Handler.

### Deploy bằng Cloudflare Workers Builds

1. Push repository lên GitHub và chọn **Workers & Pages → Create application → Workers → Import a repository**.
2. Chọn branch production (`master` hiện tại).
3. Đặt build command:

	```bash
	pnpm install --frozen-lockfile && pnpm run build:cloudflare
	```

4. Đặt deploy command:

	```bash
	pnpm exec wrangler deploy
	```

5. Cấu hình các biến `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` trong cả build environment và production environment.
6. Trong Supabase Dashboard, thêm callback URL:

	```text
	https://<worker-domain>/auth/callback
	```

Cloudflare Builds sẽ tự deploy sau mỗi lần push. Cấu hình Worker và static assets vẫn được quản lý trong [wrangler.jsonc](wrangler.jsonc).

### Deploy bằng CLI

```bash
pnpm install --frozen-lockfile
pnpm run deploy
```

Kiểm tra production build trước khi deploy:

```bash
pnpm run preview
```

## Notes

- `scripts/generate-ui-templates.mjs` sinh manifest `public/component-templates/ui-files.json` từ file `src/components/ui/*.tsx`.
- `src/proxy.ts` là middleware Next.js cho phép sync session Supabase với request.
- Thiết kế nhắm tới MVP builder nên code hiện tại ưu tiên lodash tree structure, node registry và render runtime dựa trên dữ liệu.
