import Image from "next/image"
import Link from "next/link"
import { FiHeart, FiMessageCircle } from "react-icons/fi"
import { useEffect } from "react"

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
    display_name: string;
  };
}

type RecentPostsProps = {
  recentPosts: Post[];
  setRecentPosts: React.Dispatch<React.SetStateAction<Post[]>>;
};


export function RecentPosts({ recentPosts, setRecentPosts }: RecentPostsProps) {
  useEffect(() => {
    const storedPosts = localStorage.getItem("recentPosts");
    if (storedPosts) {
      const parsedPosts = JSON.parse(storedPosts);
    // Slice to make sure it's only the first 5 posts
    const slicedPosts = parsedPosts.slice(0, 5);
    setRecentPosts(slicedPosts);
    }
  }, []);
  

  return (
    <div className="w-[300px] border-l border-zinc-800 flex flex-col">
      <div className="h-[calc(100vh-104px)] pt-4 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="px-4 pb-4">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Posts</h2>
          <div className="space-y-4">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-md">
                  <Image src={post.image_url || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">{post.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <FiHeart className="h-3 w-3" />
                      {post.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiMessageCircle className="h-3 w-3" />
                      {post.comments_count}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

