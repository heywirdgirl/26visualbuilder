// src/app/api/upload-thumbnail/route.ts

import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createClient } from "@/core/supabase/server";
import { getR2PublicUrl } from "@/core/r2/env";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const { env } = getCloudflareContext();
    if (!env.THUMBNAILS_BUCKET) {
      throw new Error(
        "R2 binding THUMBNAILS_BUCKET không khả dụng — kiểm tra initOpenNextCloudflareForDev() trong next.config.ts, hoặc wrangler.jsonc."
      );
    }

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

    const bucket = env.THUMBNAILS_BUCKET;
    const fileExtension = file.type.split("/")[1] || "jpg";
    const fileKey = `thumbnails/${user.id}/${crypto.randomUUID()}.${fileExtension}`;

    // Pass file as Blob to avoid R2 serialization issues with httpMetadata
    // R2 will infer content-type from the Blob's type property
    await bucket.put(fileKey, file);

    return NextResponse.json({ success: true, publicUrl: `${getR2PublicUrl()}/${fileKey}` });
  } catch (err) {
    console.error("[r2] Upload lên R2 thất bại:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upload thất bại phía server." },
      { status: 500 }
    );
  }
}