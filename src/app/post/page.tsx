"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import { createClient } from "@/core/supabase/client";
import { useUploadImage } from "@/features/media-upload/hooks/use-upload-image";
import { slugifyPathSegment } from "@/features/code-generator/utils/path-utils";
import { dataUrlToFile } from "@/features/publish-post/utils/data-url-to-file";

type PublishPhase = "idle" | "uploading" | "saving";

export default function NewPostPage() {
  const router = useRouter();
  const draftTree = useBuilderStore((s) => s.draftPostTree);
  const draftPageCaptures = useBuilderStore((s) => s.draftPostPageCaptures);
  const currentProjectId = useBuilderStore((s) => s.currentProjectId);
  const clearDraftPost = useBuilderStore((s) => s.clearDraftPost);
  const { uploadImage } = useUploadImage();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<PublishPhase>("idle");
  const [uploadedCount, setUploadedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (!draftTree || draftPageCaptures.length === 0) {
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

  const handlePublish = async () => {
    if (!name.trim() || !slug.trim()) {
      setError("Nhập tên bài đăng trước.");
      return;
    }
    if (!currentProjectId) {
      setError("Thiếu project — quay lại Editor và thử lại.");
      return;
    }

    setError(null);
    setUploadedCount(0);

    try {
      setPhase("uploading");
      const pageImages: { page_id: string; image_url: string }[] = [];
      for (const capture of draftPageCaptures) {
        const file = dataUrlToFile(capture.dataUrl, `${capture.pageId}.webp`);
        const publicUrl = await uploadImage(file);
        if (!publicUrl) {
          setError(`Upload ảnh trang "${capture.pageName}" thất bại — thử lại.`);
          return;
        }
        pageImages.push({ page_id: capture.pageId, image_url: publicUrl });
        setUploadedCount((c) => c + 1);
      }

      setPhase("saving");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("Cần đăng nhập.");
        return;
      }

      const { data: newPostId, error: publishError } = await supabase.rpc("publish_post", {
        target_project_id: currentProjectId,
        post_name: name.trim(),
        post_slug: slug.trim(),
        post_description: description.trim() || null,
        post_tree_data: draftTree,
        cover_thumbnail_url: pageImages[0].image_url,
        page_images: pageImages,
      });

      if (publishError || !newPostId) {
        if (publishError?.code === "23505") {
          setError("Tên định vị (slug) này bạn đã dùng rồi — chọn tên khác.");
        } else {
          setError(publishError?.message ?? "Đăng bài thất bại.");
        }
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      clearDraftPost();
      router.push(profile ? `/${profile.username}/${slug.trim()}` : "/projects");
    } catch (err) {
      console.error("[post] Đăng bài thất bại:", err);
      setError("Đăng bài thất bại — kiểm tra console.");
    } finally {
      setPhase("idle");
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 flex flex-col gap-4">
      <h1 className="text-lg font-semibold">Đăng bài chia sẻ</h1>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground uppercase">
          {draftPageCaptures.length} trang sẽ được đăng
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {draftPageCaptures.map((capture, index) => (
            <div key={capture.pageId} className="shrink-0 w-32">
              <div className="relative">
                <img src={capture.dataUrl} alt={capture.pageName} className="w-32 h-20 object-cover rounded-md border" />
                {index === 0 && <Badge className="absolute top-1 left-1 text-[10px] px-1.5 py-0">Cover</Badge>}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">{capture.pageName}</p>
            </div>
          ))}
        </div>
      </div>

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

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button onClick={handlePublish} disabled={phase !== "idle"}>
        {phase !== "idle" && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
        {phase === "uploading"
          ? `Đang tải ảnh lên (${uploadedCount}/${draftPageCaptures.length})...`
          : phase === "saving"
          ? "Đang lưu bài đăng..."
          : "Đăng bài"}
      </Button>
    </div>
  );
}
