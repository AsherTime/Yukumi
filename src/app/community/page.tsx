"use client";
import { ContentFeed } from "@/components/content-feed"
import { CommunitiesSidebar } from "@/components/communities-sidebar"
import { RecentPosts } from "@/components/recent-posts"
import { TopNav } from "@/components/top-nav"
import Footer from "@/components/footer"
import { useState } from "react"

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
 
export default function Home() {
  const [selectedAnime, setSelectedAnime] = useState<string[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  return (
    <div className="container mx-auto px-4 space-y-0">
  <TopNav />
  {/* Add margin-top to the entire flex container to push everything down */}
  <div className="flex bg-[#121212] h-auto"> {/* Increased mt-4 to mt-8 */}
    <div className="w-[250px] mt-16"> {/* Apply mt-8 to CommunitiesSidebar */}
    <CommunitiesSidebar 
        selectedAnime={selectedAnime} 
        setSelectedAnime={setSelectedAnime} 
      />
    </div>
    <main className="flex-1 mt-16"> {/* Apply mt-8 to main */}
      <ContentFeed 
      recentPosts={recentPosts}
      setRecentPosts={setRecentPosts}
      selectedAnime={selectedAnime} />
    </main>
    <div className="mt-16"> {/* Apply mt-8 to RecentPosts */}
      <RecentPosts 
      recentPosts={recentPosts}
      setRecentPosts={setRecentPosts} 
      />
    </div>
  </div>
  <Footer />
</div>


  ) 
}
 
