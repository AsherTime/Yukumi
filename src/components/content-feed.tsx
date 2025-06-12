import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 
import { Card } from "@/components/ui/card";
import { FollowButton } from "@/components/FollowButton";
import { FiHeart, FiMessageCircle, FiMoreHorizontal } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PostgrestError } from "@supabase/supabase-js";
import { UserCircle, Heart, MessageCircle, Eye, MoreVertical } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import FanMangaCard from './fan-manga-card';
import PostCard from './post-card';
import { awardPoints } from '@/utils/awardPoints';



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
  isFanManga: boolean;
}

type ContentFeedProps = {
  selectedAnime: string[];
  recentPosts: Post[];
  setRecentPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  homepageStyle?: boolean;
  filterType?: "Recommended" | "Recents";
};

interface MergedFeedItem extends Post {
  isFanManga: boolean;
}

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
      // Fetch regular posts
      let baseQuery = supabase
        .from("posts")
        .select(`
          id, title, content, created_at, user_id, image_url, 
          Profiles(display_name, avatar_url), 
          animetitle_post, post_collections, original_work, reference_link,
          post_tags (
            tags (name)
          )
        `, { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);
      if (selectedAnime.length > 0) {
        baseQuery = baseQuery.in("animetitle_post", selectedAnime);
      }
      const { data: posts, error: postsError } = await baseQuery;
      // Fetch fan mangas
      const { data: mangas, error: mangasError } = await supabase
        .from("fan_stories")
        .select(`
          id, title, synopsis, content, created_at, user_id, cover_image_url, tags, status, views,
          Profiles:Profiles(avatar_url, username, id)
        `)
        .order("created_at", { ascending: false });
      if (postsError || mangasError) {
        console.error("Error fetching posts or mangas:", postsError, mangasError);
        return;
      }
      // Normalize and merge
      const normalizedMangas = (mangas || []).map(manga => ({
        id: manga.id,
        title: manga.title,
        content: manga.content || '',
        created_at: manga.created_at,
        user_id: manga.user_id,
        likes_count: 0,
        comments_count: 0,
        liked_by_user: false,
        image_url: manga.cover_image_url,
        animetitle_post: null,
        post_collections: null,
        original_work: false,
        reference_link: null,
        Profiles: Array.isArray(manga.Profiles) ? manga.Profiles[0] : manga.Profiles,
        tags: manga.tags || [],
        views: manga.views || 0,
        isFanManga: true,
      }));
      const normalizedPosts = (posts || []).map(post => ({
        ...post,
        isFanManga: false,
        Profiles: Array.isArray(post.Profiles) ? post.Profiles[0] : post.Profiles
      }));
      const merged: MergedFeedItem[] = [...normalizedPosts, ...normalizedMangas].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      if (reset) {
        setPosts(merged);
      } else {
        setPosts(prev => [...prev, ...merged]);
      }
      setHasMore(merged.length === POSTS_PER_PAGE);
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
        // Award points for liking
        try {
          await awardPoints(
            user.id,
            'post_liked',
            5,
            postId,
            'post'
          );
        } catch (pointsError) {
          console.error('Failed to award points for like:', pointsError);
        }
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

  // For shares, add a function to award points when a post is shared
  const handleShare = async (postId: string) => {
    if (!user) return;
    try {
      await awardPoints(
        user.id,
        'post_shared',
        2,
        postId,
        'post'
      );
    } catch (pointsError) {
      console.error('Failed to award points for share:', pointsError);
    }
  };

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
        post.isFanManga ? (
          <FanMangaCard key={post.id} manga={post} idx={idx} total={posts.length} />
        ) : (
          <PostCard
            key={post.id}
            post={post}
            idx={idx}
            total={posts.length}
            formatDate={formatDate}
            navigatetoCommunity={() => {}}
            setMenuOpenId={() => {}}
            menuOpenId={null}
            user={user}
            setShowConfirmId={() => {}}
            showConfirmId={null}
            reportConfirmId={null}
            setReportConfirmId={() => {}}
            handleDelete={() => {}}
            handleLikeClick={() => {}}
            handleCommentClick={() => {}}
            handleReport={() => {}}
            saved={[]}
            handleSave={() => {}}
            isFollowing={false}
            handleFollowClick={async () => {}}
            onPostOpen={() => {}}
          />
        )
      ))}
    </div>
  );
}
