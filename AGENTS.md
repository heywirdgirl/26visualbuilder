Trước khi vào code, xác nhận lại cách hiểu yêu cầu để đúng ý — "lấy list node theo thứ tự" mình hiểu là: lấy danh sách **tên các Page** trong project (Home, About...) để hiện preview cho người xem biết bài đăng có mấy trang, còn nội dung thật để publish là **snapshot toàn bộ cây** (giữ nguyên cấu trúc Folder/Page/Component, để sau này Clone lại đủ cả project, không chỉ 1 trang).

**1 ràng buộc kỹ thuật quan trọng phát sinh từ chính RLS đã viết ở migration trước:** policy insert vào `posts` bắt buộc `project_id` phải trỏ tới 1 project **đã tồn tại và thuộc về bạn** — nghĩa là **phải Save project trước khi Post được**. Xử lý bằng cách tự động gọi Save hộ nếu chưa lưu lần nào, không bắt người dùng tự nhớ làm 2 bước.

## Patch `core/store/builder-store.ts`

Thêm vào interface:
```typescript
  draftPostTree: TreeNode | null;
  draftPostThumbnail: string | null;
  draftPostPageNames: string[];
  setDraftPost: (payload: { tree: TreeNode; thumbnail: string; pageNames: string[] }) => void;
  clearDraftPost: () => void;
```

Thêm vào default state (cạnh `currentProjectId: null,`):
```typescript
  draftPostTree: null,
  draftPostThumbnail: null,
  draftPostPageNames: [],
```

Thêm action (cạnh `setCurrentProjectId`):
```typescript
  setDraftPost: ({ tree, thumbnail, pageNames }) =>
    set({ draftPostTree: tree, draftPostThumbnail: thumbnail, draftPostPageNames: pageNames }),
  clearDraftPost: () => set({ draftPostTree: null, draftPostThumbnail: null, draftPostPageNames: [] }),
```

Thêm hàm helper (đặt cạnh `collectComponents`, cuối file):
```typescript
function collectPageNames(node: TreeNode, acc: string[] = []): string[] {
  if (node.type === SYSTEM_NODE_IDS.page) {
    acc.push(String((node.props as { name?: string }).name ?? "Page"));
  }
  node.children.forEach((c) => collectPageNames(c, acc));
  return acc;
}

export function getPageNamesInOrder(tree: TreeNode): string[] {
  return collectPageNames(tree);
}
```

## File mới: `features/canvas-preview/utils/capture-active-page.ts`

Tách logic "bỏ viền highlight → chụp → khôi phục" (đang lặp lại y hệt trong `ExportImageButton`) thành 1 chỗ dùng chung — tránh viết lần 3 khi thêm tính năng này:

```typescript
import { useBuilderStore } from "@/core/store/builder-store";
import { captureNodeToPng, CaptureOptions } from "./capture-image";

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

export async function captureActivePageClean(options?: CaptureOptions): Promise<string | null> {
  const { previewContainerEl, activeNodeId, setActiveNode, setHighlightReferenceId } =
    useBuilderStore.getState();
  if (!previewContainerEl) return null;

  setActiveNode(null);
  setHighlightReferenceId(null);
  await nextFrame();
  await nextFrame();

  try {
    return await captureNodeToPng(previewContainerEl, options);
  } finally {
    setActiveNode(activeNodeId);
  }
}
```

## File mới: `features/publish-post/hooks/use-prepare-post.ts`

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBuilderStore, getPageNamesInOrder } from "@/core/store/builder-store";
import { useSaveProject } from "@/features/cloud-save/hooks/use-save-project";
import { captureActivePageClean } from "@/features/canvas-preview/utils/capture-active-page";

export function usePreparePost() {
  const router = useRouter();
  const { saveProject } = useSaveProject();
  const [isPreparing, setIsPreparing] = useState(false);

  const preparePost = async () => {
    const { user, tree, currentProjectId } = useBuilderStore.getState();
    if (!user) {
      window.alert("Đăng nhập trước khi đăng bài.");
      return;
    }

    setIsPreparing(true);
    try {
      // posts.project_id bắt buộc trỏ tới project THẬT SỰ đã lưu (RLS policy insert kiểm
      // tra owner) — tự Save hộ nếu chưa từng lưu, người dùng không cần tự nhớ 2 bước.
      if (!currentProjectId) {
        await saveProject();
      }

      const finalProjectId = useBuilderStore.getState().currentProjectId;
      if (!finalProjectId) {
        window.alert("Cần lưu project trước khi đăng bài.");
        return;
      }

      const thumbnail = await captureActivePageClean({ pixelRatio: 2 });
      if (!thumbnail) {
        window.alert("Không chụp được ảnh Canvas — thử lại.");
        return;
      }

      useBuilderStore.getState().setDraftPost({
        tree: structuredClone(tree),
        thumbnail,
        pageNames: getPageNamesInOrder(tree),
      });

      router.push("/post");
    } finally {
      setIsPreparing(false);
    }
  };

  return { preparePost, isPreparing };
}
```

## File mới: `features/publish-post/components/post-project-button.tsx`

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Rocket, Loader2 } from "lucide-react";
import { useBuilderStore } from "@/core/store/builder-store";
import { usePreparePost } from "../hooks/use-prepare-post";

export function PostProjectButton() {
  const user = useBuilderStore((s) => s.user);
  const { preparePost, isPreparing } = usePreparePost();

  return (
    <Button variant="outline" size="sm" onClick={preparePost} disabled={!user || isPreparing}>
      {isPreparing ? (
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
      ) : (
        <Rocket className="mr-1.5 h-3.5 w-3.5" />
      )}
      {isPreparing ? "Đang chuẩn bị..." : "Post"}
    </Button>
  );
}
```

## Patch `features/app-shell/components/app-shell.tsx`

Thêm import:
```typescript
import { PostProjectButton } from "@/features/publish-post/components/post-project-button";
```

Thêm nút vào cùng hàng với các nút khác:
```tsx
<SaveProjectButton />
<PostProjectButton />
```

## File mới: `src/app/post/page.tsx`

```tsx
"use client";

import { useState } from "react";
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

      <img src={draftThumbnail} alt="Preview" className="rounded-md border w-full" />

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
```

---
**Giới hạn đã biết:** chưa có trang `/[username]/[slug]` để xem bài đăng công khai (đúng phạm vi — đó là bước tiếp theo trong kế hoạch Giai đoạn 2 bạn tự vạch ra, chưa tới lượt). Đăng xong chỉ quay về `/projects`, chưa xem được bài viết thật.

**Test nhanh:** vào Editor, bấm "Post" (chưa từng Save) → phải thấy tự động lưu ngầm rồi mới chuyển trang → tại `/post`, phải thấy đúng ảnh Canvas vừa chụp + đúng số trang liệt kê → điền tên, bấm "Đăng bài" → vào Supabase Table Editor → `posts` phải có row mới với `thumbnail_url` là link R2 xem được công khai, `tree_data` chứa đúng snapshot cây tại thời điểm đó.