import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 
import { Card } from "@/components/ui/card";
import { FollowButton } from "@/components/ui/FollowButton";
import { FiHeart, FiMessageCircle, FiMoreHorizontal } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PostgrestError } from "@supabase/supabase-js";
import { UserCircle, Heart, MessageCircle, Eye, MoreVertical } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";



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
  filterType?: "Recommended" | "Recents";
};

export function ContentFeed({ selectedAnime, recentPosts, setRecentPosts, homepageStyle, filterType }: ContentFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSidebarFilter, setSelectedSidebarFilter] = useState<string>("Recommended");
  const [mounted, setMounted] = useState(false);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const categories = [
    { label: "All", value: "All" },
    { label: "Fanart", value: "Fanart" },
    { label: "Memes", value: "Memes" },
    { label: "Discussion", value: "Discussion" },
    { label: "News", value: "News" },
  ];
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();
  const { user } = useAuth();
  const POSTS_PER_PAGE = 10;

    // Ensuring content is only rendered after hydration
    useEffect(() => {
      setMounted(true);
    }, []);
  
    // Fetch followed user IDs for 'Following' filter
    useEffect(() => {
      const fetchFollowedIds = async () => {
        if (!user?.id) return;
        const { data, error } = await supabase
          .from("follows")
          .select("followed_id")
          .eq("follower_id", user.id);
        if (!error && data) {
          setFollowedIds(data.map((row: any) => row.followed_id));
        }
      };
      if (user) fetchFollowedIds();
    }, [user]);

  const fetchPostsWithMeta = async (reset = false) => {
    try {
      let from = (reset ? 0 : (page - 1) * POSTS_PER_PAGE);
      let to = from + POSTS_PER_PAGE - 1;
      let baseQuery = supabase
        .from("posts")
        .select(`
          id, title, content, created_at, user_id, image_url, 
          Profiles(display_name, avatar_url), 
          animetitle_post, post_collections, original_work, reference_link,
          post_tags (
            tags (name)
          )
        `, { count: "exact" });
      // Order by filterType
      if (filterType === "Recents") {
        baseQuery = baseQuery.order("created_at", { ascending: false });
      } else {
        // Default: Recommended (could be custom logic, for now use created_at desc)
        baseQuery = baseQuery.order("created_at", { ascending: false });
      }
      baseQuery = baseQuery.range(from, to);
      if (selectedAnime.length > 0) {
        baseQuery = baseQuery.in("animetitle_post", selectedAnime);
      }
      const { data: posts, error: postsError, count } = await baseQuery;
      if (postsError) {
        console.error("Error fetching posts:", postsError, postsError?.message, postsError?.details);
        return;
      }
      if (!posts) return;
      const postsWithMeta = await Promise.all(
        posts.map(async (post) => {
          // Map tags from join
          const tags = post.post_tags?.map((pt: any) => pt.tags?.name).filter(Boolean) || [];
          const [{ count: likesCount }, { count: commentsCount }, { data: likeRecord }] = await Promise.all([
            supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", post.id),
            supabase.from("comments").select("*", { count: "exact", head: true }).eq("post_id", post.id),
            supabase.from("likes").select("*").eq("post_id", post.id).eq("user_id", user?.id).maybeSingle(),
          ]);
          return {
            ...post,
            tags,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            liked_by_user: !!likeRecord,
            Profiles: post.Profiles && Array.isArray(post.Profiles) ? post.Profiles[0] : post.Profiles,
          };
        })
      );
      if (reset) {
        setPosts(postsWithMeta);
      } else {
        setPosts(prev => [...prev, ...postsWithMeta]);
      }
      setHasMore(postsWithMeta.length === POSTS_PER_PAGE);
      setLoadingMore(false);
    } catch (err) {
      console.error("Error in fetchPostsWithMeta:", err);
    }
  };
    
  useEffect(() => {
    if (!user) return;
    setPage(1);
    fetchPostsWithMeta(true);
  }, [user, selectedAnime, selectedCategory, selectedSidebarFilter]);

  useEffect(() => {
    if (page === 1) return;
    fetchPostsWithMeta();
    // eslint-disable-next-line
  }, [page, selectedAnime, selectedCategory, selectedSidebarFilter]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 &&
        hasMore &&
        !loadingMore
      ) {
        setLoadingMore(true);
        setPage(prev => prev + 1);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMore, loadingMore]);
  

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

  const deletePostIfOwner = async (
    postId: string,
    currentUserId: string
  ): Promise<{ success: boolean; error?: PostgrestError | string }> => {
    // Step 1: Fetch the post to check ownership
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();
  
    if (fetchError) {
      return { success: false, error: fetchError };
    }
  
    if (!post || post.user_id !== currentUserId) {
      return { success: false, error: 'Unauthorized: You are not the owner of this post.' };
    }
  
    // Step 2: Delete the post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);
  
    if (deleteError) {
      return { success: false, error: deleteError };
    }
  
    return { success: true };
  };
  
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [showConfirmId, setShowConfirmId] = useState<string | null>(null);

  const handleDelete = async (postId: string) => {
  const result = await deletePostIfOwner(postId, user?.id || "");
  
  if (result.success) {
    alert('Post deleted.');
  } else {
    alert(`Failed to delete post: ${result.error}`);
  }

  setShowConfirmId(null);
  setMenuOpenId(null);
};

  const [reportConfirmId, setReportConfirmId] = useState<string | null>(null);

  const handleReport = async (postId: string) => {
  try {
    const { error } = await supabase
      .from("posts")
      .update({ isReported: true })
      .eq("id", postId);

    if (error) {
      console.error("Report failed:", error);
      alert("Failed to report the post.");
    } else {
      alert("Post reported successfully.");
    }
  } catch (err) {
    console.error("Unexpected error reporting post:", err);
    alert("Something went wrong.");
  }
};

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  // Filter posts based on selected category and sidebar filter
  const filteredPosts = posts.filter(post => {
    // Category filter
    const categoryMatch = selectedCategory === "All" || post.post_collections === selectedCategory;
    // Sidebar filter
    if (selectedSidebarFilter === "Following") {
      return categoryMatch && followedIds.includes(post.user_id);
    }
    // 'Recommended' (default) just returns all matching category
    return categoryMatch;
  });

  if (posts.length === 0)
    return <div className="text-white p-4">No posts found.</div>;

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-[#2e2e2e] border-0 p-4 relative">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }


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
             <div className="relative inline-block text-left">
      <button
        className="bg-black/30 p-2 rounded-full text-white hover:text-gray-300"
        onClick={() =>
        setMenuOpenId((prev) => (prev === post.id ? null : post.id))
      }
      >
        <FiMoreHorizontal size={20} />
      </button>

      {menuOpenId === post.id && (
      <div className="absolute right-0 mt-2 w-28 bg-white rounded shadow z-10">
        {user?.id === post.user_id ? (
          <button
            className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
            onClick={() => {
              setShowConfirmId(post.id); // this will trigger the popup
              setMenuOpenId(null);
            }}
          >
            Delete
          </button>
        ): (
      <button
        className="block w-full px-4 py-2 text-left text-yellow-600 hover:bg-gray-100"
        onClick={() => {
          setReportConfirmId(post.id);
          setMenuOpenId(null);
        }}
      >
        Report
      </button>
    )}
      </div>
    )}

      {showConfirmId === post.id && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-20">
    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
      <p className="mb-4 text-black text-lg font-semibold">
        Are you sure you want to delete this post? This action cannot be undone.
      </p>
      <div className="flex justify-center gap-4">
        <button
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          onClick={() => {
            handleDelete(post.id);
            setShowConfirmId(null);
          }}
        >
          Yes
        </button>
        <button
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          onClick={() => setShowConfirmId(null)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

    </div>
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
      {reportConfirmId && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-20">
    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
      <p className="mb-4 text-black text-lg font-semibold">
        Are you sure you want to report this post?
      </p>
      <div className="flex justify-center gap-4">
        <button
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          onClick={() => {
            handleReport(reportConfirmId);
            setReportConfirmId(null);
          }}
        >
          Yes
        </button>
        <button
          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          onClick={() => setReportConfirmId(null)}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
