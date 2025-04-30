"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LeftSidebar } from "@/components/left-sidebar";
import { RightSidebar } from "@/components/right-sidebar";
import { TopNav } from "@/components/top-nav";
import { Card } from "@/components/ui/card";
import { FiShare2, FiFlag, FiHeart, FiMessageCircle } from "react-icons/fi";
import { FaHeart } from "react-icons/fa"; // Filled heart
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  likes?: number;
  liked?: boolean;
}

interface UserEntry {
  id: number;
  username: string;
  profile_pic: string;
}

export default function HomePage() {
  const [postsData, setPostsData] = useState<Post[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const fetchUserData = async (firebase_uid: string): Promise<UserEntry> => {
    try {
      const response = await fetch("https://x8ki-letl-twmt.n7.xano.io/api:hRCl8Tp6/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebase_uid }),
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching user data:", error);
      throw error;
    }
  };

  // Fetch user data on load and cache it for better performance
  const { data: userDetails, isLoading: userLoading, isError: userError } = useQuery({
    queryKey: ["userDetails", user?.uid],
    queryFn: () => fetchUserData(user?.uid || ""),
    enabled: !loading && user !== null,
    retry: 2
  });

  useEffect(() => {
    if (userDetails) {
      setUserId(userDetails.id);
    }
  }, [userDetails]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setPostsData(data || [])
      } catch (error) {
        console.error('Error fetching posts:', error)
      }
    }

    fetchPosts()
  }, [])

  // Handle Like Button Click
  const toggleLike = async (postId: string) => {
    const updatedPosts = postsData.map((post) =>
      post.id === postId
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 }
        : post
    );

    setPostsData(updatedPosts);

    try {
      await fetch("https://x8ki-letl-twmt.n7.xano.io/api:0Q68j1tU/update/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts_id: postId }),
      });

      await fetch("https://x8ki-letl-twmt.n7.xano.io/api:eA0dhH6K/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          users_id: userId,
          posts_id: postId,
          liked: !postsData.find((post) => post.id === postId)?.liked,
        }),
      });
    } catch (error) {
      console.error("Error updating like count:", error);
      // Handle error by reverting the optimistic update
      setPostsData(postsData);
    }
  };

  // Handle Comment Button Click (Redirects to the post detail page)
  const handleCommentClick = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Don't render content until after hydration
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
                onClick={() => {/* Handle flag click */}}
              >
                <FiFlag size={20} />
              </button>
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">{post.title}</h3>
                  <p className="text-gray-400">{post.content}</p>
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
