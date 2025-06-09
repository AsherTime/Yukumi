"use client";

import { useState, useEffect } from "react";
import { FeaturePanel } from "@/components/feature-panel";
import { TopNav } from "@/components/top-nav";
import useSavedPosts from "@/utils/use-saved-posts";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/footer"
import PostCardContainer from "@/components/post-card-container";
import fetchPost from "@/utils/fetch-post";
import handleLike from "@/utils/handleLike";
import handleFollow from "@/utils/handleFollow";
import { RecentPosts } from "@/components/recent-posts";

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

export default function HomePage() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedSidebarFilter, setSelectedSidebarFilter] = useState<string>("Recommended");
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const categories = [
    { label: "All", value: "All" },
    { label: "Fanart", value: "Fanart" },
    { label: "Memes", value: "Memes" },
    { label: "Discussion", value: "Discussion" },
    { label: "News", value: "News" },
    { label: "Following", value: "Following" },
    { label: "Events", value: "Events" },
  ];
  const [, setPage] = useState(1);
  const [hasMore,] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
 const [recentPosts, setRecentPosts] = useState<Post[]>(() => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("recentPosts");
    return stored ? JSON.parse(stored) : [];
  }
  return [];
});

  const { postsData, setPostsData, fetchPosts } = fetchPost();
  const { saved, toggleSave } = useSavedPosts(user, setPostsData, fetchPosts); // pass fetchPosts here
  const { handleLikeClick } = handleLike(user, setPostsData, fetchPosts);
  const { following, handleFollowToggle } = handleFollow(user);


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
  }, [following])

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


  const filteredPosts = postsData.filter(post => {
    if (selectedCategory === "Following") {
      return followedIds.includes(post.user_id);
    }
    const categoryMatch = selectedCategory === "All" || post.post_collections === selectedCategory;
    return categoryMatch;
  });

  // Deduplicate posts by id to avoid duplicate React keys
  const uniquePosts = Array.from(new Map(filteredPosts.map(p => [p.id, p])).values());

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
    <>
      <TopNav />
      <div className="container mx-auto px-4 py-8 space-y-12">
        <div className="flex gap-6 pt-16">
          {/* Left Sidebar */}
          <div className="w-[20%] hidden lg:block">
            <FeaturePanel />
          </div>

          {/* Main Content */}
          <div className="w-full lg:w-[55%] flex flex-col gap-y-6">
            {/* Main Box for Posts and Filter Bar */}
            <div className="relative rounded-2xl bg-[#1f1f1f] border border-zinc-800 shadow-md max-h-[90vh] overflow-y-auto">
              {/* Collection Filter Bar inside the box, sticky */}
              <div className="sticky top-0 z-10 w-full bg-[#1f1f1f] border-b border-zinc-800 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
                <div className="flex gap-3 min-w-max py-2 px-4">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => { setSelectedCategory(cat.value); setPage(1); fetchPosts(true); }}
                      className={`px-5 py-2 rounded-full font-semibold transition-all duration-200 whitespace-nowrap focus:outline-none
                        ${selectedCategory === cat.value
                          ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow scale-105"
                          : "bg-[#232232] text-zinc-300 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white"}
                      `}
                      style={{ boxShadow: selectedCategory === cat.value ? '0 2px 16px 0 rgba(236,72,153,0.2)' : undefined }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Posts List */}
              <AnimatePresence>
                {uniquePosts.length === 0 ? (
                  <motion.div
                    key="no-posts"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center text-zinc-400 py-12"
                  >
                    Loading posts...
                  </motion.div>
                ) : (
                  uniquePosts.map((post, idx) => (
                    <PostCardContainer
                      key={post.id || idx}  // Use post.id if available, fallback to index
                      post={post}
                      idx={idx}
                      total={uniquePosts.length}
                      onLikeToggle={handleLikeClick}
                      following={following}
                      handleFollowToggle={handleFollowToggle}
                      saved={saved}
                      onToggleSave={() => toggleSave(post.id)}
                      onPostOpen={(post: Post) => {
                        setRecentPosts(prev => {
                          const filtered = prev.filter(p => p.id !== post.id);
                          const updated = [post, ...filtered].slice(0, 10);
                          localStorage.setItem("recentPosts", JSON.stringify(updated));
                          return updated;
                        });
                      }}
                    />
                  ))

                )}
              </AnimatePresence>
              {loadingMore && (
                <div className="text-center text-zinc-400 py-4 animate-pulse">Loading more...</div>
              )}
              {/* ... */}

            </div>
          </div>

          {/* Right Sidebar - Feature Panel */}
          <div className="w-1/4 hidden lg:block">
            <RecentPosts recentPosts={recentPosts} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
