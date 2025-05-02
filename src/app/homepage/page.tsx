"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LeftSidebar } from "@/components/left-sidebar";
import { RightSidebar } from "@/components/right-sidebar";
import { TopNav } from "@/components/top-nav";
import { Card } from "@/components/ui/card";
import { FiFlag, FiHeart, FiMessageCircle } from "react-icons/fi";
import { FaHeart } from "react-icons/fa"; // Filled heart
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
 
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
}

export default function HomePage() {
  const [postsData, setPostsData] = useState<Post[]>([]);
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Ensuring content is only rendered after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPostsWithMeta = async () => {
    try {
      console.log("Fetching posts with meta data...");
      // First, get all posts
      const { data: posts, error: postsError } = await supabase
        .from("posts")
        .select("id, title, content, created_at, user_id, image_url")
        .order("created_at", { ascending: false });

      if (postsError) {
        console.error("Error fetching posts:", postsError);
        return;
      }

      if (!posts) {
        console.log("No posts found");
        return;
      }

      console.log("Fetched posts:", posts.length);

      // Then get likes and comments counts for each post
      const postsWithMeta = await Promise.all(
        posts.map(async (post) => {
          const [{ count: likesCount, error: likesError }, { count: commentsCount }, { data: likeRecord }] =
            await Promise.all([
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
          };
        })
      );

      console.log("Setting posts data with meta:", postsWithMeta.length);
      setPostsData(postsWithMeta);
    } catch (err) {
      console.error("Error in fetchPostsWithMeta:", err);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchPostsWithMeta();
  }, [user]);

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
      setPostsData(prevPosts => 
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

  // Redirecting to comment section for each post
  const handleCommentClick = (postId: string) => {
    router.push(`/post/${postId}`);
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
    <div className="container mx-auto px-4 py-8 space-y-12">
      <TopNav />
      <div className="flex gap-6 pt-16">
        {/* Left Sidebar */}
        <div className="w-1/4 hidden lg:block">
          <LeftSidebar />
        </div>

        {/* Main Content */}
        <div className="w-full lg:w-1/2 space-y-6">
          {postsData.map((post) => (
            <Card key={post.id} className="bg-[#2e2e2e] border-0 p-4 relative">
              <button
                className="absolute top-4 right-4 bg-black/30 p-2 rounded-full text-white hover:text-red-500"
                onClick={() => {/* Flag logic if needed */}}
              >
                <FiFlag size={20} />
              </button>
              <h3 className="text-lg font-semibold text-white mb-1">{post.title}</h3>
              {post.image_url && (
                <div className="relative w-full h-64 mb-4">
                  <img
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                </div>
              )}
              <p className="text-gray-400 mb-2">{post.content}</p>
              <div className="flex items-center justify-between text-sm text-gray-400 mt-4">
                <span>{formatDate(post.created_at)}</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => handleLikeClick(e, post.id, post.liked_by_user)}
                    className="flex items-center gap-1 hover:text-red-500 transition-colors"
                  >
                    {post.liked_by_user ? (
                      <FaHeart className="text-red-500" />
                    ) : (
                      <FiHeart />
                    )}
                    <span>{post.likes_count || 0}</span>
                  </button>
                  <button
                    onClick={() => handleCommentClick(post.id)}
                    className="flex items-center gap-1"
                  >
                    <FiMessageCircle />
                    {post.comments_count}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Right Sidebar */}
        <div className="w-1/4 hidden lg:block">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
}
