import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getFeedPosts } from "@/features/feed/utils/get-feed-posts";
import { PostCard } from "@/features/feed/components/post-card";
import { resolveProfileByUsername } from "@/features/profile/utils/resolve-profile-by-username";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await resolveProfileByUsername(username, (newUsername) => `/${newUsername}`);
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