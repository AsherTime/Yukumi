import Image from "next/image"
import Link from "next/link"
import { FiHeart, FiMessageCircle } from "react-icons/fi"
import { Eye } from "lucide-react"

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  liked_by_user: boolean;
  image_url: string;
  animetitle_post: string | null;
  post_collections: string | null;
  original_work: boolean;
  reference_link: string | null;
  Profiles?: {
    avatar_url: string;
    username: string;
  };
  tags?: string[];
  views: number;
}




export function RecentPosts({ recentPosts }: { recentPosts: Post[] }) {
  return (
    <div className="w-full bg-zinc-900/80 border-l border-zinc-800/60 rounded-2xl flex flex-col">
      <div className="h-[calc(100vh-104px)] pt-4 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
        <div className="px-4 pb-4">
          <h2 className="text-lg font-semibold  text-white mb-4">Recent Posts</h2>
          <div className="space-y-4">
            {recentPosts.length === 0 ? (
              <p className="text-zinc-400 text-sm">No recent posts</p>
            ) : (
              recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50 transition-colors"
                >
                  {post.image_url && (<div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={post.image_url || "/placeholder.svg"}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>)}
                  <div className="overflow-hidden">
                    <h3 className="text-sm font-medium text-white truncate max-w-xs">
                      {post.title}
                    </h3>
                    <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                      <span className="flex items-center gap-1">
                        <FiHeart className="h-3 w-3" />
                        {post.likes_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <FiMessageCircle className="h-3 w-3" />
                        {post.comments_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.views}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

