
# Phase 1
## Migration mới: bảng `post_pages` + hàm `extract_page_ids()` + `publish_post()`

```sql
-- ============================================================
-- 1. post_pages — page_id KHÔNG có FK, vì nó chỉ là 1 node id nằm bên trong tree_data
--    JSON của chính post đó (không trỏ tới bảng nào cả) — đúng bản chất "page_id là dữ
--    liệu nội tại của snapshot", không phải quan hệ CSDL thông thường.
-- ============================================================
create table public.post_pages (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  page_id uuid not null,
  image_url text not null,
  created_at timestamptz not null default now(),
  unique (post_id, page_id) -- chặn 2 ảnh cùng gán cho 1 Page trong cùng 1 post
);

alter table public.post_pages enable row level security;

create policy "Post pages readable when parent post is active or owned"
  on public.post_pages for select
  using (
    exists (
      select 1 from public.posts
      where posts.id = post_pages.post_id
        and (posts.is_active = true or posts.author_id = auth.uid())
    )
  );

-- KHÔNG tạo policy insert/update/delete — chỉ publish_post() (security definer, bên
-- dưới) ghi được vào bảng này, đúng nguyên tắc đã áp dụng cho username_redirects.

-- ============================================================
-- 2. extract_page_ids — duyệt đệ quy TOÀN BỘ cây JSON, thu thập id của mọi node
--    type = 'system.page'. Tương đương chính xác hàm collectPageNodes() phía TypeScript
--    (core/store/builder-store.ts) — cùng logic, viết lại ở tầng SQL để validate được
--    ngay trong transaction publish.
-- ============================================================
create or replace function public.extract_page_ids(tree jsonb)
returns uuid[]
language plpgsql
immutable
as $$
declare
  result uuid[] := array[]::uuid[];
  child jsonb;
begin
  if tree->>'type' = 'system.page' then
    result := array_append(result, (tree->>'id')::uuid);
  end if;

  for child in select * from jsonb_array_elements(coalesce(tree->'children', '[]'::jsonb))
  loop
    result := result || public.extract_page_ids(child);
  end loop;

  return result;
end;
$$;

-- ============================================================
-- 3. publish_post — atomic: tạo posts + toàn bộ post_pages trong 1 transaction. Validate
--    page_images khớp CHÍNH XÁC (không thiếu, không dư, không trùng) với mọi Page thật
--    có trong tree_data — đúng quyết định "số ảnh PHẢI bằng số page", ép ở tầng DB,
--    không chỉ tin tưởng UI.
-- ============================================================
create or replace function public.publish_post(
  target_project_id uuid,
  post_name text,
  post_slug text,
  post_description text,
  post_tree_data jsonb,
  cover_thumbnail_url text,
  page_images jsonb -- dạng: [{"page_id": "...", "image_url": "..."}, ...]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_post_id uuid;
  expected_page_ids uuid[];
  provided_page_ids uuid[];
  img jsonb;
begin
  if auth.uid() is null then
    raise exception 'Cần đăng nhập trước khi đăng bài.';
  end if;

  if not exists (
    select 1 from public.projects where id = target_project_id and owner_id = auth.uid()
  ) then
    raise exception 'Project không tồn tại hoặc không thuộc về bạn.';
  end if;

  expected_page_ids := public.extract_page_ids(post_tree_data);
  if coalesce(array_length(expected_page_ids, 1), 0) = 0 then
    raise exception 'Project chưa có Page nào để đăng bài.';
  end if;

  select array_agg((elem->>'page_id')::uuid) into provided_page_ids
  from jsonb_array_elements(page_images) elem;

  if coalesce(array_length(provided_page_ids, 1), 0) != array_length(expected_page_ids, 1) then
    raise exception 'Số lượng ảnh không khớp số lượng Page trong project.';
  end if;

  if exists (
    select unnest(expected_page_ids) except select unnest(provided_page_ids)
  ) then
    raise exception 'Thiếu ảnh cho ít nhất 1 Page — mọi Page đều phải có ảnh.';
  end if;

  if exists (
    select unnest(provided_page_ids) except select unnest(expected_page_ids)
  ) then
    raise exception 'Có ảnh gắn với Page không tồn tại trong project.';
  end if;

  insert into public.posts (project_id, author_id, slug, name, description, tree_data, thumbnail_url)
  values (target_project_id, auth.uid(), post_slug, post_name, post_description, post_tree_data, cover_thumbnail_url)
  returning id into new_post_id;

  for img in select * from jsonb_array_elements(page_images)
  loop
    insert into public.post_pages (post_id, page_id, image_url)
    values (new_post_id, (img->>'page_id')::uuid, img->>'image_url');
  end loop;

  return new_post_id;
end;
$$;
```

Chạy `supabase migration new post_pages_and_publish_post` → dán nội dung trên.

---
**Test nhanh (SQL Editor, chưa cần UI):**
1. `select public.extract_page_ids('{"type":"system.folder","children":[{"type":"system.page","id":"11111111-1111-1111-1111-111111111111","children":[]},{"type":"system.folder","children":[{"type":"system.page","id":"22222222-2222-2222-2222-222222222222","children":[]}]}]}'::jsonb);` → phải trả về đúng mảng 2 UUID (xác nhận đệ quy qua Folder lồng nhau hoạt động).
2. Lấy 1 `project_id` thật của bạn (có ≥1 Page) → gọi `publish_post()` với `page_images` **thiếu 1 Page** → phải bị chặn đúng lỗi "Thiếu ảnh cho ít nhất 1 Page". Gọi lại với **đủ** ảnh khớp từng `page_id` thật → phải tạo thành công, kiểm `post_pages` trong Table Editor phải có đúng N row.

**Chưa dùng được từ UI** (đúng dự kiến — `usePreparePost`/`route /post` cũ vẫn gọi luồng cũ, chưa biết tới `publish_post()`) — đó là việc của Phase 2-3.

# Phase 2 
## File mới: `core/types/page-capture.types.ts`

Đặt ở `core/` (không phải `features/canvas-preview/`) vì `builder-store.ts` cần import type này — tránh store (tầng lõi) phải phụ thuộc ngược vào 1 feature cụ thể:

```typescript
export interface PageCapture {
  pageId: string;
  pageName: string;
  dataUrl: string;
}
```

## Patch `core/store/builder-store.ts`

Thêm import:
```typescript
import { PageCapture } from "@/core/types/page-capture.types";
```

Đổi phần draft post trong interface `BuilderState`:
```typescript
// Đổi:
  draftPostTree: TreeNode | null;
  draftPostThumbnail: string | null;
  draftPostPageNames: string[];
  setDraftPost: (payload: { tree: TreeNode; thumbnail: string; pageNames: string[] }) => void;
  clearDraftPost: () => void;

// Thành:
  draftPostTree: TreeNode | null;
  draftPostPageCaptures: PageCapture[]; // 1 phần tử = 1 Page, đủ dataUrl để Phase 3 upload từng ảnh
  setDraftPost: (payload: { tree: TreeNode; pageCaptures: PageCapture[] }) => void;
  clearDraftPost: () => void;
```

Đổi default state:
```typescript
// Đổi:
  draftPostTree: null,
  draftPostThumbnail: null,
  draftPostPageNames: [],
// Thành:
  draftPostTree: null,
  draftPostPageCaptures: [],
```

Đổi action:
```typescript
// Đổi:
  setDraftPost: ({ tree, thumbnail, pageNames }) =>
    set({ draftPostTree: tree, draftPostThumbnail: thumbnail, draftPostPageNames: pageNames }),
  clearDraftPost: () => set({ draftPostTree: null, draftPostThumbnail: null, draftPostPageNames: [] }),
// Thành:
  setDraftPost: ({ tree, pageCaptures }) => set({ draftPostTree: tree, draftPostPageCaptures: pageCaptures }),
  clearDraftPost: () => set({ draftPostTree: null, draftPostPageCaptures: [] }),
```

## File mới: `features/canvas-preview/utils/capture-all-pages.ts`

```typescript
import { useBuilderStore, getPageNodes } from "@/core/store/builder-store";
import { captureNodeToWebp, CaptureOptions } from "./capture-image";
import { PageCapture } from "@/core/types/page-capture.types";

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

// Chụp TUẦN TỰ mọi Page — KHÔNG chạy song song, vì mọi Page dùng chung 1 Canvas DOM
// thật duy nhất (đổi activePageId để hiện đúng nội dung); chụp song song sẽ khiến các
// request tranh nhau đổi cùng 1 DOM, dễ đọc nhầm ảnh giữa các trang.
export async function captureAllPagesClean(options?: CaptureOptions): Promise<PageCapture[] | null> {
  const {
    tree,
    previewContainerEl,
    activePageId: originalActivePageId,
    activeNodeId: originalActiveNodeId,
    setActivePage,
    setActiveNode,
    setHighlightReferenceId,
  } = useBuilderStore.getState();

  if (!previewContainerEl) return null;

  const pages = getPageNodes(tree);
  if (pages.length === 0) return [];

  setActiveNode(null);
  setHighlightReferenceId(null);

  const results: PageCapture[] = [];

  try {
    for (const page of pages) {
      setActivePage(page.id);
      // 2 animation frame để chắc chắn React re-render xong Page mới + browser đã paint
      // thật trước khi chụp — cùng kỹ thuật đã dùng ở captureActivePageClean() (V3).
      await nextFrame();
      await nextFrame();

      const dataUrl = await captureNodeToWebp(previewContainerEl, options);
      const pageName = String((page.props as { name?: string }).name ?? "Page");
      results.push({ pageId: page.id, pageName, dataUrl });
    }
  } finally {
    // Khôi phục đúng trang + lựa chọn gốc — đóng lại /post phải thấy Canvas y hệt
    // trước khi bấm Post, không bị "kẹt" ở trang cuối cùng vừa chụp.
    setActivePage(originalActivePageId ?? pages[0].id);
    setActiveNode(originalActiveNodeId);
  }

  return results;
}
```

## Cập nhật `features/publish-post/hooks/use-prepare-post.ts` — full file

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBuilderStore } from "@/core/store/builder-store";
import { useSaveProject } from "@/features/cloud-save/hooks/use-save-project";
import { captureAllPagesClean } from "@/features/canvas-preview/utils/capture-all-pages";

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
      if (!currentProjectId) {
        await saveProject();
      }

      const finalProjectId = useBuilderStore.getState().currentProjectId;
      if (!finalProjectId) {
        window.alert("Cần lưu project trước khi đăng bài.");
        return;
      }

      // Chụp TUẦN TỰ mọi Page (không chỉ trang đang mở) — đúng quyết định "số ảnh phải
      // bằng số page". Có thể mất vài giây nếu project nhiều trang.
      const pageCaptures = await captureAllPagesClean({ pixelRatio: 2 });
      if (pageCaptures === null) {
        window.alert("Không chụp được ảnh Canvas — thử lại.");
        return;
      }
      if (pageCaptures.length === 0) {
        window.alert("Project chưa có Page nào để đăng bài.");
        return;
      }

      useBuilderStore.getState().setDraftPost({
        tree: structuredClone(tree),
        pageCaptures,
      });

      router.push("/post");
    } finally {
      setIsPreparing(false);
    }
  };

  return { preparePost, isPreparing };
}
```

---
**1 hiệu ứng phụ cần biết trước khi test** (không phải bug, chỉ là hệ quả tự nhiên chưa từng xảy ra ở bản 1-trang): vì nút "Post" **không mở dialog che Canvas** trước khi chụp (khác với mockup dialog của Gemini), trong lúc chụp tuần tự, bạn sẽ **thấy Canvas thật sự "chạy" qua từng trang** (Home → About → Blog...) trước khi chuyển sang `/post` — giống hiệu ứng slideshow ngắn. Không sai, chỉ là trải nghiệm mới; nếu sau này thấy khó chịu, Phase 3 (hoặc 1 bản sau) có thể thêm overlay loading che Canvas lại trong lúc này.

**⚠️ `src/app/post/page.tsx` sẽ báo lỗi type ngay bây giờ** (đọc `draftPostThumbnail`/`draftPostPageNames` đã bị xoá khỏi store) — **đúng dự kiến**, đây chính là việc của Phase 3.

**Test nhanh (console, chưa cần UI Phase 3):** vào Editor, mở DevTools Console, gọi tay `useBuilderStore.getState().tree` để chắc project có ≥2 Page → bấm nút "Post" hiện tại (sẽ crash khi vào `/post` do lỗi type, không sao) → trước khi crash, gọi ngay `useBuilderStore.getState().draftPostPageCaptures` → phải thấy 1 mảng đúng số lượng Page, mỗi phần tử có `dataUrl` dạng `data:image/webp;base64,...` hợp lệ (mở link đó trong tab mới để xác nhận đúng ảnh từng trang, không bị lẫn trang này với trang khác).

# Phase 3 
Cần cài thêm 1 component chưa dùng tới (dù `Badge` đã có sẵn từ Comments) — không cần cài gì mới thực ra, `Badge`/`Input`/`Textarea` đều đã có. Vào code luôn.

## File mới: `features/publish-post/utils/data-url-to-file.ts`

Tách ra từ code cũ (trước đây viết thẳng trong `/post/page.tsx`) — giờ cần gọi lại nhiều lần (1 lần/trang), không lặp code:

```typescript
export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/data:(.*);base64/)?.[1] ?? "image/webp";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}
```

## Cập nhật `src/app/post/page.tsx` — full file, thay hoàn toàn nội dung cũ

```tsx
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
      // Upload tuần tự để hiện đúng tiến độ (N/tổng) — khác lúc chụp ảnh (Phase 2, phải
      // tuần tự vì chung 1 DOM), ở đây tuần tự chỉ để UX rõ ràng, không phải bắt buộc kỹ thuật.
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

      // publish_post() atomic — tạo posts + toàn bộ post_pages, tự validate số ảnh khớp
      // đúng số Page trong tree_data (Phase 1), không tin riêng phía client.
      const { data: newPostId, error: publishError } = await supabase.rpc("publish_post", {
        target_project_id: currentProjectId,
        post_name: name.trim(),
        post_slug: slug.trim(),
        post_description: description.trim() || null,
        post_tree_data: draftTree,
        cover_thumbnail_url: pageImages[0].image_url, // Page đầu tiên = cover, đúng quyết định đã chốt
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
```

---
**Đối chiếu lại toàn bộ yêu cầu ban đầu:** "số ảnh phải bằng số page" được đảm bảo **2 lớp độc lập** — Phase 2 luôn tự chụp đủ mọi Page (không cách nào thiếu từ phía client), và `publish_post()` (Phase 1) chặn lại **thật sự** ở tầng DB nếu 2 số lệch nhau vì bất kỳ lý do gì (đúng nguyên tắc "DB là lớp bảo vệ cuối cùng" đã áp dụng nhất quán suốt project).

**Việc còn để ngỏ, không thuộc phạm vi 3 phase này** (đã note từ đầu): Post Detail hiện tại vẫn chỉ hiện `thumbnail_url` (ảnh cover) — chưa render gallery đủ N ảnh từ `post_pages`. Dữ liệu đã có đủ, chỉ là UI hiển thị thêm cần 1 lượt riêng khi bạn muốn làm.

**Test end-to-end:** dựng project có 3 Page (Home/About/Blog) → Editor bấm "Post" → phải thấy Canvas lướt qua cả 3 trang (đúng hiệu ứng đã note ở Phase 2) → vào `/post`, phải thấy đúng 3 ảnh thumbnail, cái đầu có badge "Cover" → điền tên, bấm "Đăng bài" → nút phải chạy qua "Đang tải ảnh lên (1/3)... (2/3)... (3/3)..." → "Đang lưu bài đăng..." → redirect thẳng vào trang chi tiết live vừa đăng. Vào Supabase Table Editor → `posts` có 1 row mới, `post_pages` phải có đúng **3 row** khớp `post_id` đó, mỗi row `page_id` khác nhau đúng 3 Page thật.