## Cập nhật `features/feed/utils/get-feed-posts.ts` — full file

Mở rộng để dùng chung được cho cả Feed toàn cục **và** trang profile công khai (lọc theo tác giả), tránh viết trùng logic query lần 2:

```typescript
import { createClient } from "@/core/supabase/server";
import { getPageNamesInOrder } from "@/core/store/builder-store";
import { TreeNode } from "@/core/types/builder.types";

export interface FeedPost {
  id: string;
  name: string;
  slug: string;
  thumbnailUrl: string | null;
  pageNames: string[];
  authorUsername: string;
  authorName: string;
  publishedAt: string;
}

export async function getFeedPosts(options?: { authorId?: string }): Promise<FeedPost[]> {
  const supabase = await createClient();

  let query = supabase
    .from("posts")
    .select("id, name, slug, tree_data, thumbnail_url, author_id, published_at")
    .eq("is_active", true)
    .order("published_at", { ascending: false });

  if (options?.authorId) query = query.eq("author_id", options.authorId);

  const { data: posts, error } = await query;
  if (error || !posts) {
    console.error("[feed] Lỗi tải danh sách bài đăng:", error);
    return [];
  }

  const authorIds = Array.from(new Set(posts.map((p) => p.author_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .in("id", authorIds);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return posts.map((post) => {
    const profile = profileMap.get(post.author_id);
    return {
      id: post.id,
      name: post.name,
      slug: post.slug,
      thumbnailUrl: post.thumbnail_url,
      pageNames: getPageNamesInOrder(post.tree_data as TreeNode),
      authorUsername: profile?.username ?? "unknown",
      authorName: profile?.display_name ?? "Ẩn danh",
      publishedAt: post.published_at,
    };
  });
}
```

## File mới: `features/profile/utils/resolve-profile-by-username.ts`

Gói chung logic PRD mục 5 (redirect khi username đã đổi) + mục 13 rule 1 (404 khi username không tồn tại) — dùng lại được cho cả 2 trang `[username]` và `[username]/[slug]`:

```typescript
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/core/supabase/server";

export interface ResolvedProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

// username không tồn tại thẳng -> tra username_redirects (đổi tên trước đó) -> redirect
// sang URL đúng username hiện tại. Không tìm thấy ở cả 2 nơi -> 404 thật (PRD mục 13).
export async function resolveProfileByUsername(
  username: string,
  buildRedirectPath: (newUsername: string) => string
): Promise<ResolvedProfile> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("username", username)
    .single();

  if (profile) return profile;

  const { data: redirectRow } = await supabase
    .from("username_redirects")
    .select("user_id")
    .eq("old_username", username)
    .single();

  if (redirectRow) {
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", redirectRow.user_id)
      .single();
    if (currentProfile) redirect(buildRedirectPath(currentProfile.username));
  }

  notFound();
}
```

## File mới: `src/app/(shell)/[username]/page.tsx`

```tsx
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveProfileByUsername } from "@/features/profile/utils/resolve-profile-by-username";
import { getFeedPosts } from "@/features/feed/utils/get-feed-posts";
import { PostCard } from "@/features/feed/components/post-card";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await resolveProfileByUsername(username, (u) => `/${u}`);
  const posts = await getFeedPosts({ authorId: profile.id });

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          {profile.avatar_url && (
            <AvatarImage src={profile.avatar_url} alt={profile.display_name ?? profile.username} />
          )}
          <AvatarFallback>
            {(profile.display_name ?? profile.username).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-base font-semibold">{profile.display_name ?? profile.username}</p>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">Chưa có bài đăng nào.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
```

## File mới: `src/app/(shell)/[username]/[slug]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/core/supabase/server";
import { getPageNamesInOrder } from "@/core/store/builder-store";
import { TreeNode } from "@/core/types/builder.types";
import { resolveProfileByUsername } from "@/features/profile/utils/resolve-profile-by-username";
import { CloneButton } from "@/features/publish-post/components/clone-button";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ username: string; slug: string }>;
}) {
  const { username, slug } = await params;
  const profile = await resolveProfileByUsername(username, (u) => `/${u}/${slug}`);

  const supabase = await createClient();
  const { data: post, error } = await supabase
    .from("posts")
    .select("id, name, description, tree_data, thumbnail_url, author_id, published_at, clone_count, is_active")
    .eq("author_id", profile.id) // đồng thời chặn luôn Rule 3 (slug thuộc user khác) — cùng
    .eq("slug", slug)            // 1 query lọc cả 2 điều kiện, không cần check tách riêng.
    .single();

  if (error || !post || !post.is_active) notFound(); // Rule 2

  const pageNames = getPageNamesInOrder(post.tree_data as TreeNode);

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit">
        <ArrowLeft className="h-3.5 w-3.5" />
        Quay lại Feed
      </Link>

      {post.thumbnail_url && (
        <img src={post.thumbnail_url} alt={post.name} className="w-full rounded-lg border" />
      )}

      <div>
        <h1 className="text-lg font-semibold">{post.name}</h1>
        <Link href={`/${profile.username}`} className="text-sm text-muted-foreground hover:underline">
          bởi {profile.display_name ?? profile.username}
        </Link>
      </div>

      {post.description && <p className="text-sm">{post.description}</p>}

      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
          Gồm {pageNames.length} trang
        </p>
        <ul className="text-sm flex flex-wrap gap-2">
          {pageNames.map((name) => (
            <li key={name} className="border rounded-full px-2.5 py-0.5 text-xs">{name}</li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Đăng ngày {new Date(post.published_at).toLocaleDateString("vi-VN")} · {post.clone_count} lượt clone
      </p>

      <CloneButton postId={post.id} />
    </div>
  );
}
```

## Cập nhật `src/app/(shell)/posts/[postId]/page.tsx` — full file, đổi thành redirect-only

```tsx
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/core/supabase/server";

export default async function LegacyPostRedirectPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from("posts")
    .select("slug, author_id")
    .eq("id", postId)
    .single();

  if (error || !post) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", post.author_id)
    .single();

  if (!profile) notFound();

  redirect(`/${profile.username}/${post.slug}`);
}
```

## Cập nhật `features/feed/components/post-card.tsx` — full file

```tsx
import Link from "next/link";
import { FeedPost } from "../utils/get-feed-posts";
import { CloneButton } from "@/features/publish-post/components/clone-button";

export function PostCard({ post }: { post: FeedPost }) {
  return (
    <Link
      href={`/${post.authorUsername}/${post.slug}`}
      className="flex border rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white"
    >
      <div className="w-2/5 p-3 flex flex-col gap-1.5 min-w-0">
        <p className="text-sm font-semibold truncate">{post.name}</p>
        <p className="text-xs text-muted-foreground truncate">bởi {post.authorName}</p>

        <div className="mt-1">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            {post.pageNames.length} trang
          </p>
          <ul className="text-xs text-foreground/80 mt-0.5">
            {post.pageNames.slice(0, 4).map((name) => (
              <li key={name} className="truncate">· {name}</li>
            ))}
            {post.pageNames.length > 4 && (
              <li className="text-muted-foreground">+ {post.pageNames.length - 4} trang khác</li>
            )}
          </ul>
        </div>

        <CloneButton postId={post.id} className="mt-auto w-fit" />
      </div>

      <div className="w-3/5 bg-muted">
        {post.thumbnailUrl ? (
          <img src={post.thumbnailUrl} alt={post.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            Không có ảnh
          </div>
        )}
      </div>
    </Link>
  );
}
```

---
