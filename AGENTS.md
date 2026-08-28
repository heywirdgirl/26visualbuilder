

## Checklist cấu hình trước khi code

1. **`wrangler.jsonc`** (file cấu hình Workers, phải đã có sẵn từ lúc bạn migrate hosting) — thêm R2 binding:
```jsonc
{
  "r2_buckets": [
    { "binding": "THUMBNAILS_BUCKET", "bucket_name": "my-social-app" }
  ]
}
```
2. Chạy `npx wrangler types` — tự sinh lại `worker-configuration.d.ts`, giúp TypeScript biết `env.THUMBNAILS_BUCKET` đúng kiểu `R2Bucket`, không cần ép kiểu tay.
3. Xác nhận `next.config.ts` đã gọi `initOpenNextCloudflareForDev()` — bắt buộc để `next dev` local giả lập được binding, nếu thiếu bước migrate hosting trước đó bỏ sót dòng này thì bindings sẽ `undefined` khi chạy dev.
4. **Bucket Settings → Public Access** vẫn giữ nguyên như đã làm (r2.dev subdomain hoặc Custom Domain) — R2 binding chỉ thay cách **ghi** (server-side write), không thay cách **đọc công khai** ảnh (vẫn qua URL public như cũ).

Không cần bước "Create API Token" / CORS Policy nữa — bỏ qua hoàn toàn 2 mục đó so với checklist cũ.

## File mới: `core/r2/env.ts` — đơn giản hơn hẳn bản cũ

```typescript
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Thiếu biến môi trường ${name} — kiểm tra .env.local hoặc Cloudflare Dashboard.`);
  }
  return value;
}

// Chỉ còn 1 biến — không cần Account ID/Access Key/Secret nào nữa vì dùng Binding,
// không qua API S3-compatible ký chữ ký thủ công như phương án Netlify cũ.
export function getR2PublicUrl(): string {
  return requireEnv("NEXT_PUBLIC_R2_PUBLIC_URL");
}
```

## File mới: `src/app/api/upload-thumbnail/route.ts`

```typescript
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from "@/core/supabase/server";
import { getR2PublicUrl } from "@/core/r2/env";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  // userId lấy từ session THẬT trên server — giữ đúng nguyên tắc bảo mật đã áp dụng
  // xuyên suốt project, không tin bất kỳ giá trị nào client tự gửi lên.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Cần đăng nhập trước khi upload ảnh." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File quá lớn — tối đa 10MB." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Chỉ chấp nhận file ảnh." }, { status: 400 });
  }

  const { env } = getCloudflareContext();
  const bucket = env.THUMBNAILS_BUCKET; // tên phải khớp đúng "binding" trong wrangler.jsonc

  const fileExtension = file.type.split("/")[1] || "jpg";
  const fileKey = `thumbnails/${user.id}/${crypto.randomUUID()}.${fileExtension}`;

  await bucket.put(fileKey, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return NextResponse.json({ success: true, publicUrl: `${getR2PublicUrl()}/${fileKey}` });
}
```

## Cập nhật `features/media-upload/hooks/use-upload-image.ts` — full file

```typescript
"use client";

import { useState } from "react";

export function useUploadImage() {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Gửi thẳng tới route handler của chính app — cùng domain, không có bước
      // "xin presigned URL" riêng như phương án cũ, ít 1 vòng round-trip.
      const res = await fetch("/api/upload-thumbnail", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok || !data.success) {
        window.alert(data.error ?? "Upload thất bại.");
        return null;
      }
      return data.publicUrl as string;
    } catch (err) {
      console.error("[r2] Upload thất bại:", err);
      window.alert("Upload thất bại — kiểm tra console.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
}
```

---

**Giới hạn cần biết:** file giờ chảy qua chính Worker của bạn (không upload thẳng browser → R2 nữa) — với ảnh thumbnail vài MB thì không đáng lo, nhưng nếu sau này cần upload file rất lớn (video, dataset...), nên hỏi lại giới hạn dung lượng request theo đúng plan Cloudflare Workers bạn đang dùng trước khi mở rộng use case này.

**Test nhanh:** `npx wrangler types` xong, chạy `pnpm dev`, gọi tạm `useUploadImage().uploadImage(file)` từ 1 nút test bất kỳ sau khi login → phải trả về `publicUrl`, mở link đó phải xem được ảnh công khai không cần đăng nhập, và vào Cloudflare R2 Dashboard → bucket → phải thấy file mới nằm đúng trong `thumbnails/<user-id>/...`.