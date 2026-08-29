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
