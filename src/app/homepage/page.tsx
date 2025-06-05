"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LeftSidebar } from "@/components/left-sidebar";
import { FeaturePanel } from "@/components/feature-panel";
import { TopNav } from "@/components/top-nav";
import useSavedPosts from "@/utils/use-saved-posts";
import { Card } from "@/components/ui/card";
import { FiFlag, FiHeart, FiMessageCircle, FiMoreHorizontal, FiBookmark } from "react-icons/fi";
import { FaHeart, FaBookmark } from "react-icons/fa"; // Filled heart
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { FollowButton } from "@/components/ui/FollowButton";
import { motion, AnimatePresence } from "framer-motion";
import { UserCircle, Heart, MessageCircle, Eye, MoreVertical, FootprintsIcon } from "lucide-react";
import { PostgrestError } from "@supabase/supabase-js";
import Footer from "@/components/footer"
import PostCard from "@/components/post-card";
import PostCardContainer from "@/components/post-card-container";
import fetchPost from "@/utils/fetch-post";
import handleLike from "@/utils/handleLike";
import handleFollow from "@/utils/handleFollow";


export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
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
  ];
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
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
  }, [user])

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
    const categoryMatch = selectedCategory === "All" || post.post_collections === selectedCategory;
    if (selectedSidebarFilter === "Following") {
      return categoryMatch && followedIds.includes(post.user_id);
    }
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
          <div className="w-1/4 hidden lg:block">
            <LeftSidebar
              selectedFilter={selectedSidebarFilter}
              onFilterChange={setSelectedSidebarFilter}
            />
          </div>

          {/* Main Content */}
          <div className="w-full lg:w-1/2 flex flex-col gap-y-6">
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
              <AnimatePresence mode="wait">
                {uniquePosts.length === 0 ? (
                  <motion.div
                    key="no-posts"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center text-zinc-400 py-12"
                  >
                    No posts found in this category.
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
            <FeaturePanel />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
