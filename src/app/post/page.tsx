"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import { createClient } from "@/core/supabase/client";
import { useUploadImage } from "@/features/media-upload/hooks/use-upload-image";
import { slugifyPathSegment } from "@/features/code-generator/utils/path-utils";

function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*);base64/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

export default function NewPostPage() {
  const router = useRouter();
  const draftTree = useBuilderStore((s) => s.draftPostTree);
  const draftThumbnail = useBuilderStore((s) => s.draftPostThumbnail);
  const draftPageNames = useBuilderStore((s) => s.draftPostPageNames);
  const currentProjectId = useBuilderStore((s) => s.currentProjectId);
  const clearDraftPost = useBuilderStore((s) => s.clearDraftPost);
  const { uploadImage, isUploading } = useUploadImage();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  if (!draftTree || !draftThumbnail) {
    return (
      <div className="flex h-screen items-center justify-center text-center">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            Chưa có bản nháp để đăng — quay lại Editor và bấm nút &quot;Post&quot; trước.
          </p>
          <a href="/projects" className="text-sm text-primary underline">Quay lại danh sách project</a>
        </div>
      </div>
    );
  }

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(slugifyPathSegment(value));
  };

  const handlePost = async () => {
    if (!name.trim() || !slug.trim()) {
      window.alert("Nhập tên bài đăng trước.");
      return;
    }

    setIsPosting(true);
    try {
      const thumbnailFile = dataUrlToFile(draftThumbnail, `${slug}.png`);
      const publicUrl = await uploadImage(thumbnailFile);
      if (!publicUrl) {
        setIsPosting(false);
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("posts").insert({
        project_id: currentProjectId,
        author_id: user.id,
        slug: slug.trim(),
        name: name.trim(),
        description: description.trim() || null,
        tree_data: draftTree,
        thumbnail_url: publicUrl,
      });

      if (error) {
        if (error.code === "23505") {
          window.alert("Tên định vị (slug) này bạn đã dùng rồi — chọn tên khác.");
        } else {
          throw error;
        }
        setIsPosting(false);
        return;
      }

      clearDraftPost();
      window.alert("Đăng bài thành công!");
      router.push("/projects");
    } catch (err) {
      console.error("[post] Đăng bài thất bại:", err);
      window.alert("Đăng bài thất bại — kiểm tra console.");
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Đăng bài chia sẻ</h1>

      <div className="relative w-full aspect-video rounded-md border overflow-hidden">
        <Image src={draftThumbnail} alt="Preview" fill className="object-cover" />
      </div>

      <p className="text-xs text-muted-foreground">
        Gồm {draftPageNames.length} trang: {draftPageNames.join(", ")}
      </p>

      <label className="flex flex-col gap-1 text-sm">
        Tên bài đăng
        <Input value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="VD: Landing Page SaaS" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Slug (URL)
        <Input value={slug} onChange={(e) => setSlug(slugifyPathSegment(e.target.value))} />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Mô tả
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
      </label>

      <Button onClick={handlePost} disabled={isPosting || isUploading}>
        {(isPosting || isUploading) && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
        {isPosting || isUploading ? "Đang đăng..." : "Đăng bài"}
      </Button>
    </div>
  );
}
