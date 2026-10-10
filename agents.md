Bạn dán nguyên khối dưới đây cho Copilot. Những việc Copilot không làm được (cài đặt trên Dashboard, Supabase) mình tách riêng ở cuối.

````markdown
# Nhiệm vụ: Cấu hình Cloudflare Worker Previews cho dự án Next.js (OpenNext)

## Bối cảnh
- Dự án dùng Next.js + @opennextjs/cloudflare, deploy lên Cloudflare Workers (Workers Builds).
- Muốn dùng tính năng Worker Previews (lệnh `npx wrangler preview`), yêu cầu Wrangler >= 4.135.0.
- Chỉ một nhánh tên `preview` được dùng để build preview.
- Làm đúng từng bước theo thứ tự. KHÔNG sửa file nào ngoài danh sách. KHÔNG commit, KHÔNG push.

## Bước 1: Nâng Wrangler
1. Chạy: `pnpm add -D wrangler@latest`
2. Chạy: `pnpm exec wrangler --version` và xác nhận phiên bản >= 4.135.0.
3. Kiểm tra `package.json` đã ghi `"wrangler": "^4.135.0"` trở lên, và `pnpm-lock.yaml` đã thay đổi.
4. Báo lại số phiên bản cài được.

## Bước 2: Thêm khối `previews` vào `wrangler.jsonc`
Giữ nguyên toàn bộ nội dung hiện có. Chỉ thêm khối `previews` ở cuối object (sau `observability`, nhớ thêm dấu phẩy):

```jsonc
  "previews": {
    "vars": {
      "R2_PUBLIC_URL": "https://pub-ca360487984341cea60a3306e254feb1.r2.dev",
      "SITE_URL": "https://preview-26visualbuilder.awsmydream.workers.dev"
    },
    "r2_buckets": [
      { "binding": "THUMBNAILS_BUCKET", "bucket_name": "26visualbuilder-image" }
    ],
    "ai": {
      "binding": "AI"
    }
  }
```

Lưu ý:
- Preview KHÔNG kế thừa vars/bindings của production, nên phải khai báo lại.
- `assets`, `compatibility_date`, `compatibility_flags`, `main`, `observability` giữ ở top level, không đưa vào `previews`.
- `SITE_URL` là giá trị tạm theo mẫu `<tên-preview>-<tên-worker>.<subdomain>.workers.dev`, sẽ kiểm tra lại sau lần deploy đầu.
- Sau khi sửa, kiểm tra file vẫn là JSON hợp lệ (JSONC cho phép comment).

## Bước 3: Rà soát biến môi trường (CHỈ ĐỌC, không sửa)
1. Chạy: `grep -rn "process.env\." src | grep -v NEXT_PUBLIC`
2. Mở `src/core/r2/env.ts` và cho biết hàm `getR2PublicUrl()` đọc biến từ đâu (`process.env` hay `getCloudflareContext().env`).
3. Liệt kê mọi biến runtime mà code đọc nhưng chưa có trong `vars` của `wrangler.jsonc`, và cho biết biến nào là secret (ví dụ service role key).
4. Liệt kê các biến `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `CLOUDFLARE_ACCOUNT_ID` có được code đọc ở chỗ nào không (theo mình nghĩ là không, vì upload dùng binding `THUMBNAILS_BUCKET`).
5. Chỉ báo cáo kết quả, không tự thêm biến.

## Bước 4: Kiểm tra build
1. Chạy: `pnpm run build:cloudflare`
2. Báo lại kết quả. Nếu lỗi, dán nguyên log lỗi, không tự sửa code ứng dụng.

## Kết quả cần báo lại
- Phiên bản wrangler đã cài.
- Nội dung `wrangler.jsonc` sau khi sửa (chỉ phần diff).
- Kết quả Bước 3 (danh sách biến còn thiếu, biến nào là secret).
- Kết quả build.
````

**Việc bạn tự làm (Copilot không làm được):**

1. **Cloudflare Dashboard → Build → tab Previews Base:**
   - Thêm build variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` (đặt bằng URL preview).
   - Sửa **Preview command** thành:
     ```bash
     if [ "$WORKERS_CI_BRANCH" = "preview" ]; then npx wrangler preview; else echo "skip"; fi
     ```
     Lệnh này dựa vào biến `WORKERS_CI_BRANCH`, mình chưa kiểm chứng được qua docs, nên ở lần build đầu hãy thêm `echo $WORKERS_CI_BRANCH` để xem nó có in đúng tên nhánh không.
2. **Secret server-side:** nếu Bước 3 tìm ra secret nào (ví dụ service role key), đặt bằng `npx wrangler preview base-config secret put TEN_SECRET`.
3. **Supabase → Authentication → URL Configuration:** thêm URL preview vào Redirect URLs (đường dẫn callback là `/auth/callback`).
4. Đọc kết quả Copilot báo, rồi commit cả `package.json`, `pnpm-lock.yaml`, `wrangler.jsonc` và push lên nhánh `preview`.
5. Sau lần deploy đầu, lấy URL preview thật, sửa lại `SITE_URL` trong `wrangler.jsonc` và `NEXT_PUBLIC_SITE_URL` trên Dashboard nếu khác dự đoán.

