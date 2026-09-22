// src/app/(shell)/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getFeedPosts } from "@/features/feed/utils/get-feed-posts";
import { PostCard } from "@/features/feed/components/post-card";
import { getSiteUrl, getFallbackOgImageUrl } from "@/core/utils/site-url";

const TITLE = "26VisualBuilder — Design UI Visually, Ship Clean Tailwind Code";
const DESCRIPTION =
  "A tree-based visual UI builder for developers. Structure real components like a scene tree, not messy drag-and-drop divs — then export clean React, Tailwind and shadcn/ui code, ready for production.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: getSiteUrl() },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: getSiteUrl(),
    type: "website",
    images: [{ url: getFallbackOgImageUrl() }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [getFallbackOgImageUrl()],
  },
};

export default async function FeedPage() {
  const posts = await getFeedPosts();

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-8">
      {/* Hero — nội dung chữ thật, giải quyết cùng lúc "sơ sài" (UX người ghé lần đầu)
          và "thin content" (SEO) — không phải 2 việc tách rời. */}
      <section className="flex flex-col gap-4 pt-4 pb-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Design UI visually.
          <br />
          Ship clean Tailwind code.
        </h1>
        <p className="mx-auto max-w-md text-sm text-zinc-500">
          A tree-based visual builder for developers — structure real components like a
          scene tree, not messy drag-and-drop divs. Export clean React, Tailwind and
          shadcn/ui code, ready for production.
        </p>

        <div className="flex items-center justify-center pt-1">
          <Link href="/editor">
            <Button size="sm">
              <Wand2 className="h-3.5 w-3.5 mr-1.5" />
              Open Editor
            </Button>
          </Link>
        </div>

        <ul className="mx-auto mt-2 grid max-w-md grid-cols-1 gap-2 text-left text-xs text-zinc-500 sm:grid-cols-3 sm:text-center">
          <li className="rounded-lg border border-zinc-200/70 p-2.5">
            <span className="block font-medium text-zinc-900">Node Tree, not guesswork</span>
            Structure UI like a scene tree — not free-floating boxes.
          </li>
          <li className="rounded-lg border border-zinc-200/70 p-2.5">
            <span className="block font-medium text-zinc-900">Real components</span>
            shadcn/ui + Tailwind. No inline styles, no div soup.
          </li>
          <li className="rounded-lg border border-zinc-200/70 p-2.5">
            <span className="block font-medium text-zinc-900">Idea to code, fast</span>
            Preview responsive layouts, export production-ready JSX instantly.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-zinc-900">From the community</h2>

        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            No projects shared yet — be the first to publish one!
          </p>
        ) : (
          <div className="flex flex-col gap-39">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}