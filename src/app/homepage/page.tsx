"use client";

import React, { useState, useEffect } from "react";
import { FeaturePanel } from "@/components/feature-panel";
import { TopNav } from "@/components/top-nav";
import useSavedPosts from "@/utils/use-saved-posts";
import { MangaFeed } from "@/components/manga/manga-feed";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/footer"
import PostCardContainer from "@/components/post-card-container";
import fetchPost from "@/utils/fetch-post";
import handleLike from "@/utils/handleLike";
import handleFollow from "@/utils/handleFollow";

// Ad Placeholder Components
/*
const AdPlaceholder = ({ 
  size, 
  className = "", 
  label, 
  variant = "default" 
}: { 
  size: string; 
  className?: string; 
  label: string; 
  variant?: "default" | "sponsored" | "sticky";
}) => {
  const baseClasses = "flex items-center justify-center border-2 border-dashed border-zinc-700 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-lg relative overflow-hidden";
  
  const variantClasses = {
    default: "text-zinc-400 hover:border-zinc-600 transition-colors duration-200",
    sponsored: "text-zinc-400 border-zinc-600 bg-gradient-to-br from-zinc-800/30 to-zinc-900/30",
    sticky: "text-zinc-400 border-zinc-600 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 shadow-lg"
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      <div className="text-center">
        <div className="text-xs font-medium text-zinc-500 mb-1">ADVERTISEMENT</div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-xs text-zinc-600 mt-1">{size}</div>
      </div>
      {variant === "sponsored" && (
        <div className="absolute top-2 right-2">
          <span className="bg-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded-full font-medium">
            Sponsored
          </span>
        </div>
      )}
    </div>
  );
};
*/

// In-Feed Ad Component
/*
const InFeedAd = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    className="my-4"
  >
    <AdPlaceholder 
      size="468x60" 
      label="In-Feed Advertisement" 
      variant="sponsored"
      className="w-full h-[60px]"
    />
  </motion.div>
);
*/

export default function HomePage() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const categories = [
    { label: "All", value: "All" },
    { label: "Fanart", value: "Fanart" },
    { label: "Memes", value: "Memes" },
    { label: "Discussion", value: "Discussion" },
    { label: "News", value: "News" },
    { label: "Following", value: "Following" },
    { label: "Fanfic", value: "Fanfic" },
  ];
  const [, setPage] = useState(1);
  const [hasMore,] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const { postsData, setPostsData, fetchPosts } = fetchPost();
  const { saved, toggleSave } = useSavedPosts(user, setPostsData, fetchPosts); // pass fetchPosts here
  const { handleLikeClick } = handleLike(user, setPostsData, fetchPosts);
  const { following, handleFollowToggle } = handleFollow(user);

  // Fetch followed user IDs for 'Following' filter
  useEffect(() => {
    const fetchFollowedIds = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("follows")
        .select("followed_id")
        .eq("follower_id", user.id);
      if (!error && data) {
        setFollowedIds(data.map((row) => row.followed_id));
      }
    };
    if (user) fetchFollowedIds();
  }, [following, user])

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

  // Function to render posts with in-feed ads
  const renderPostsWithAds = () => {
    const postsWithAds: React.ReactElement[] = [];
    
    uniquePosts.forEach((post, idx) => {
      // Add post
      postsWithAds.push(
        <PostCardContainer
          key={post.id || idx}
          post={post}
          idx={idx}
          total={uniquePosts.length}
          onLikeToggle={handleLikeClick}
          following={following}
          handleFollowToggle={handleFollowToggle}
          saved={saved}
          onToggleSave={() => toggleSave(post.id)}
          onPostOpen={() => {          }}
        />
      );
      
      // Add in-feed ad after every 4th post
      /*
      if ((idx + 1) % 4 === 0) {
        postsWithAds.push(<InFeedAd key={`ad-${idx}`} />);
      }
        */
    });
    
    return postsWithAds;
  };

  return (
    <>
      <TopNav />
      <div className="container mx-auto px-4 py-8 space-y-12">
        <div className="flex flex-col lg:flex-row gap-6 pt-16">
          {/* Left Sidebar */}
          <div className="ml-4 w-full lg:w-[20%] order-1 lg:order-none">
            <FeaturePanel />
            {/* Left Sidebar Ad - 300x250 
            <div className="mt-6">
              <AdPlaceholder 
                size="300x250" 
                label="Sidebar Advertisement" 
                className="w-full h-[250px]"
              />
            </div>
            */}
          </div>

          {/* Main Content */}
          <div className="w-full lg:w-[55%] flex flex-col gap-y-6 order-2 lg:order-none">
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
                          ? cat.value === "Fanfic"
                            ? "bg-gradient-to-r from-orange-400 to-orange-700 text-white font-bold shadow scale-105"
                            : "bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow scale-105"
                          : cat.value === "Fanfic"
                            ? "bg-[#232232] text-zinc-300 hover:bg-gradient-to-r hover:from-orange-400 hover:to-orange-700 hover:text-white"
                            : "bg-[#232232] text-zinc-300 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white"
                          }
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
                {selectedCategory === "Fanfic" ? (
                  <MangaFeed />
                ) : uniquePosts.length === 0 ? (
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
                  <>
                    {renderPostsWithAds()}
                    
                    {/* Bottom Large Banner Ad - 728x90 
                    <div className="mt-6 px-4 pb-4">
                      <AdPlaceholder 
                        size="728x90" 
                        label="Banner Advertisement" 
                        className="w-full h-[90px]"
                      />
                    </div>
                    */}
                  </>
                )}
              </AnimatePresence>

              {loadingMore && (
                <div className="text-center text-zinc-400 py-4 animate-pulse">Loading more...</div>
              )}
              {/* ... */}

            </div>
          </div>

          {/* Right Sidebar - Vertical Ad 
          <div className="w-[25%] hidden lg:block">
            {/* Right Side Vertical Ad - 160x600 }
            <div className="sticky top-20">
              <AdPlaceholder 
                size="160x600" 
                label="Vertical Advertisement" 
                className="w-full h-[600px]"
              />
            </div>
          </div>
          */}
        </div>
      </div>
      
      {/* Mobile Sticky Footer Ad - 320x50 
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 border-t border-zinc-800 p-2">
        <AdPlaceholder 
          size="320x50" 
          label="Mobile Advertisement" 
          variant="sticky"
          className="w-full h-[50px]"
        />
      </div>
      */}
      
      <Footer />
    </>
  );
}
