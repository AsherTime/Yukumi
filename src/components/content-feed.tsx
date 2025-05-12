import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 
import { Card } from "@/components/ui/card";
import { FollowButton } from "@/components/ui/FollowButton";
import { FiHeart, FiMessageCircle, FiMoreHorizontal } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";


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
  tags?: string[];
}

type ContentFeedProps = {
  selectedAnime: string[];
  recentPosts: Post[];
  setRecentPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  homepageStyle?: boolean;
};

export function ContentFeed({ selectedAnime, recentPosts, setRecentPosts }: ContentFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();


    const fetchPostsWithMeta = async () => {
      try {
        console.log("Fetching posts with meta data...");
    
        let baseQuery = supabase
          .from("posts")
          .select(
            "id, title, content, created_at, user_id, image_url, Profiles(display_name, avatar_url), animetitle_post, post_collections, original_work, reference_link"
          )
          .order("created_at", { ascending: false });
    
        // Apply filtering if selectedAnime has items
        if (selectedAnime.length > 0) {
          baseQuery = baseQuery.in("animetitle_post", selectedAnime);
        }
    
        const { data: posts, error: postsError } = await baseQuery;
    
        if (postsError) {
          console.error("Error fetching posts:", postsError);
          return;
        }
    
        if (!posts || posts.length === 0) {
          console.log("No posts found");
          setPosts([]);
          return;
        }
    
        console.log("Fetched posts:", posts.length);
    
        const postsWithMeta = await Promise.all(
          posts.map(async (post) => {
            const [
              { count: likesCount, error: likesError },
              { count: commentsCount },
              { data: likeRecord },
            ] = await Promise.all([
              supabase
                .from("likes")
                .select("*", { count: "exact", head: true })
                .eq("post_id", post.id),
              supabase
                .from("comments")
                .select("*", { count: "exact", head: true })
                .eq("post_id", post.id),
              supabase
                .from("likes")
                .select("*")
                .eq("post_id", post.id)
                .eq("user_id", user?.id)
                .maybeSingle(),
            ]);
    
            if (likesError) {
              console.error("Error fetching likes for post:", post.id, likesError);
            }
    
            return {
              ...post,
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
              liked_by_user: !!likeRecord,
              Profiles: post.Profiles && Array.isArray(post.Profiles)
                ? post.Profiles[0]
                : post.Profiles,
            };
          })
        );
    
        console.log("Setting posts data with meta:", postsWithMeta.length);
        setPosts(postsWithMeta);
        setLoading(false);
      } catch (err) {
        console.error("Error in fetchPostsWithMeta:", err);
      }
    };
    




  useEffect(() => {
    if (!user) return;
    fetchPostsWithMeta();
  }, [user, selectedAnime]);

  const toggleLike = async (postId: string, liked: boolean) => {
    if (!user) {
      console.log("No user found, cannot like");
      return;
    }

    try {
      console.log("Attempting to toggle like:", { postId, liked, userId: user.id });

      if (liked) {
        // Unlike the post
        const { error: unlikeError } = await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);

        if (unlikeError) {
          console.error("Error unliking post:", unlikeError);
          return;
        }
        console.log("Successfully unliked post");
      } else {
        // Like the post
        const { error: likeError } = await supabase
          .from("likes")
          .insert({
            post_id: postId,
            user_id: user.id
          });

        if (likeError) {
          console.error("Error liking post:", likeError);
          return;
        }
        console.log("Successfully liked post");
      }

      // Update the UI immediately
      setPosts(prevPosts => 
        prevPosts.map(post => 
          post.id === postId 
            ? {
                ...post,
                liked_by_user: !liked,
                likes_count: liked ? post.likes_count - 1 : post.likes_count + 1
              }
            : post
        )
      );

      // Then refresh the data in the background
      fetchPostsWithMeta();
    } catch (error) {
      console.error("Error in toggleLike:", error);
    }
  };

  const handleCommentClick = (post: Post) => {
    setRecentPosts((prev) => {
      const alreadyExists = prev.some((p) => p.id === post.id);
      if (alreadyExists) return prev;
  
      const updated = [post, ...prev];
      localStorage.setItem("recentPosts", JSON.stringify(updated));
      return updated.slice(0, 5);
    });
    router.push(`/post/${post.id}`);
  };

  // Add a click handler with event prevention
  const handleLikeClick = async (e: React.MouseEvent, postId: string, liked: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleLike(postId, liked);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) return <div className="text-white p-4">Loading posts...</div>;

  if (posts.length === 0)
    return <div className="text-white p-4">No posts found.</div>;

  return (
    <div className="space-y-0">
      {posts.map((post, idx) => (
        <div
          key={post.id}
          className={`${idx !== posts.length - 1 ? 'border-b border-zinc-800' : ''} relative`}
        >
          {/* Top Row: Avatar, Username, Date, Follow, More */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <Link href={post.user_id === user?.id ? "/profile" : `/profile/${post.user_id}`} className="flex items-center gap-3 group" prefetch={false}>
              {post.Profiles?.avatar_url ? (
                <img
                  src={post.Profiles.avatar_url}
                  alt={post.Profiles.display_name || "User"}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-700 group-hover:ring-2 group-hover:ring-blue-500 transition"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-700" />
              )}
              <div>
                <div className="text-white font-semibold text-base leading-tight group-hover:underline group-hover:text-blue-400 transition">{post.Profiles?.display_name || "Anonymous"}</div>
                <div className="text-xs text-zinc-400">{formatDate(post.created_at)}</div>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <FollowButton 
                followedId={post.user_id} 
                className="rounded-full px-4 py-1 bg-blue-900 text-blue-400 font-semibold shadow hover:bg-blue-800 transition text-xs" 
              />
              <button
                className="bg-black/30 p-2 rounded-full text-white hover:text-gray-300"
                onClick={() => {/* Menu logic if needed */}}
              >
                <FiMoreHorizontal size={20} />
              </button>
            </div>
          </div>
          {/* Title */}
          <h3 className="text-2xl font-bold text-white px-6 pb-2">{post.title}</h3>
          {/* Image */}
          {post.image_url && (
            <div className="relative h-64 mb-4 px-6 overflow-hidden rounded-xl">
              <img
                src={post.image_url}
                alt={post.title}
                className="h-full w-full object-cover mx-auto rounded-xl"
                loading="lazy"
              />
            </div>
          )}
          {/* Content */}
          <p className="text-gray-300 px-6 pb-2" dangerouslySetInnerHTML={{ __html: post.content }}></p>
          {/* Tags */}
          <div className="flex flex-wrap gap-2 px-6 pb-2 mt-1">
            {post.post_collections && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold text-blue-400 bg-blue-500/10">
                {post.post_collections}
              </span>
            )}
            {post.animetitle_post && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold text-purple-400 bg-purple-500/10">
                {post.animetitle_post}
              </span>
            )}
          </div>
          {/* User Tags (if any) */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 px-6 pb-2">
              {post.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 rounded-full text-xs font-semibold text-gray-300 bg-[#232232]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {/* Bottom Row: Like, Comment, View */}
          <div className="flex items-center gap-6 px-6 pb-4 text-zinc-400">
            <button
              onClick={(e) => handleLikeClick(e, post.id, post.liked_by_user)}
              className={`flex items-center gap-1 text-zinc-400 hover:text-pink-500 transition-colors group ${post.liked_by_user ? 'font-bold text-pink-500' : ''}`}
            >
              {post.liked_by_user ? (
                <FaHeart className="w-5 h-5 mr-1 group-hover:scale-110 transition-transform text-pink-500" />
              ) : (
                <FiHeart className="w-5 h-5 mr-1 group-hover:scale-110 transition-transform" />
              )}
              <span>{post.likes_count || 0}</span>
            </button>
            <button
              onClick={() => handleCommentClick(post)}
              className="flex items-center gap-1 text-zinc-400 hover:text-purple-400 transition-colors"
            >
              <FiMessageCircle className="w-5 h-5 mr-1" />
              {post.comments_count}
            </button>
            {/* Optionally add view count here if available */}
          </div>
        </div>
      ))}
    </div>
  );
}
