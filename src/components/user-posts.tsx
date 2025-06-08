"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { FiHeart, FiMessageCircle, FiMoreHorizontal } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { FollowButton } from "@/components/FollowButton";
import { PostgrestError } from "@supabase/supabase-js";

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
  const result = await deletePostIfOwner(postId, userId || user?.id || "");
  
  if (result.success) {
    alert('Post deleted.');
  } else {
    alert(`Failed to delete post: ${result.error}`);
  }

  setShowConfirmId(null);
  setMenuOpenId(null);
};


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
        {userId === post.user_id && (
          <button
            className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
            onClick={() => {
              setShowConfirmId(post.id); // this will trigger the popup
              setMenuOpenId(null);
            }}
          >
            Delete
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
            <h3 className="text-lg font-semibold text-white mb-1" dangerouslySetInnerHTML={{ __html: post.content }}></h3>
            
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
  ); }