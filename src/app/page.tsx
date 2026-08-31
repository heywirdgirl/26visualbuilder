
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { getFeedPosts } from "@/features/feed/utils/get-feed-posts";
import { PostCard } from "@/features/feed/components/post-card";
import { LoginButton } from "@/features/auth/components/login-button";

export default async function FeedPage() {
  const posts = await getFeedPosts();

  return (
    <div className="max-w-2xl mx-auto p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">26visualbuilder</h1>
        <div className="flex items-center gap-2">
          <Link href="/editor">
            <Button size="sm">
              <Wand2 className="h-3.5 w-3.5 mr-1.5" />
              Mở Editor
            </Button>
          </Link>
          <LoginButton />
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          Chưa có bài đăng nào — hãy là người đầu tiên chia sẻ!
        </p>
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
