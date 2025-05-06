"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { FiHeart, FiMessageCircle, FiMoreHorizontal } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { FollowButton } from "@/components/ui/FollowButton";

export function UserPosts({ userId }: { userId?: string }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserPosts = async () => {
      const id = userId || user?.id;
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("*, Profiles(display_name, avatar_url)")
        .eq("user_id", id)
        .order("created_at", { ascending: false });
      if (error) {
        setPosts([]);
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    };
    fetchUserPosts();
  }, [userId, user]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return <div className="w-full lg:w-1/2 mx-auto text-center text-white py-8">Loading...</div>;
  }

  return (
    <div className="w-full lg:w-1/2 space-y-6 mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-white">My Posts</h2>
      {posts.length === 0 ? (
        <div className="text-center text-gray-400">You have not posted anything yet.</div>
      ) : (
        posts.map((post) => (
          <Card key={post.id} className="bg-[#2e2e2e] border-0 p-4 relative">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <FollowButton 
                followedId={post.user_id} 
                className="rounded-full px-6 py-2 bg-blue-900 text-blue-400 font-semibold shadow hover:bg-blue-800 transition" 
              />
              <button
                className="bg-black/30 p-2 rounded-full text-white hover:text-gray-300"
                onClick={() => {/* Menu logic if needed */}}
              >
                <FiMoreHorizontal size={20} />
              </button>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <img
                src={post.Profiles?.avatar_url || "/placeholder.svg"}
                alt={post.Profiles?.display_name || "User"}
                className="w-10 h-10 rounded-full object-cover border border-zinc-700"
              />
              <span className="text-white font-semibold text-base">{post.Profiles?.display_name || "Anonymous"}</span>
            </div>
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
                  className={`flex items-center gap-1 ${post.liked_by_user ? "text-red-500" : "hover:text-red-500 transition-colors"}`}
                  onClick={() => {}}
                >
                  {post.liked_by_user ? (
                    <FaHeart className="text-red-500" />
                  ) : (
                    <FiHeart />
                  )}
                  <span>{post.likes_count || 0}</span>
                </button>
                <button className="flex items-center gap-1">
                  <FiMessageCircle />
                  {post.comments_count || 0}
                </button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
} 