"use client";

import { Card } from "@/components/ui/card";
import { FiShare2, FiFlag, FiHeart, FiMessageCircle } from "react-icons/fi"; // Importing icons

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Comment {
    id: string
    created_at: string
    post_id: string
    user_id: string
    content: string
    parent_id: string | null
    user?: {
      username: string
      avatar_url: string
    }
}

interface Post {
    id: string
    created_at: string
    user_id: string
    title: string
    image_url: string
    content: string
    likes_count: number
    comments_count: number
    views: number
    liked_by_user: boolean
    user?: {
      username: string
      avatar_url: string
    }
}

const PostPage = () => {
  const { id } = useParams(); // Get the post ID from URL
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchPostAndComments = async () => {
      try {
        // Fetch post with user details
        const { data: postData, error: postError } = await supabase
          .from('posts')
          .select(`
            *,
            Profiles!posts_user_id_fkey (
              username,
              avatar_url
            )
          `)
          .eq('id', id)
          .single();

        if (postError) throw postError;

        // Fetch like status if user is logged in
        let likedByUser = false;
        if (user) {
          const { data: likeData } = await supabase
            .from('likes')
            .select('*')
            .eq('post_id', id)
            .eq('user_id', user.id)
            .maybeSingle();
          
          likedByUser = !!likeData;
        }

        // Set post data
        setPost({
          ...postData,
          user: postData.Profiles,
          liked_by_user: likedByUser
        });

        // Fetch comments with user details
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select(`
            *,
            Profiles!comments_user_id_fkey (
              username,
              avatar_url
            )
          `)
          .eq('post_id', id)
          .order('created_at', { ascending: true });

        if (commentsError) throw commentsError;
        setComments(commentsData?.map(comment => ({
          ...comment,
          user: comment.Profiles
        })) || []);
      } catch (error) {
        console.error('Error fetching post and comments:', error);
        toast.error('Failed to load post and comments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostAndComments();
  }, [id, user]);

  const handleAddComment = async () => {
    if (!user) {
      toast.error('Please log in to comment');
      return;
    }

    if (!newComment.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const { data: newCommentData, error } = await supabase
        .from('comments')
        .insert({
          post_id: id,
          user_id: user.id,
          content: newComment.trim(),
          parent_id: replyTo
        })
        .select(`
          *,
          Profiles!comments_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update comments list
      setComments(prev => [...prev, newCommentData]);
      
      // Update post comment count
      if (post) {
        setPost({
          ...post,
          comments_count: (post.comments_count || 0) + 1
        });

        // Update the comments count in the database
        await supabase
          .from('posts')
          .update({ comments_count: (post.comments_count || 0) + 1 })
          .eq('id', id);
      }

      setNewComment('');
      setReplyTo(null);
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Error adding comment:', JSON.stringify(error, null, 2));
      toast.error('Failed to add comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      toast.error('Please log in to delete comments');
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id); // Ensure user can only delete their own comments

      if (error) throw error;

      // Update comments list
      setComments(prev => prev.filter(c => c.id !== commentId));
      
      // Update post comment count
      if (post) {
        setPost({
          ...post,
          comments_count: Math.max(0, (post.comments_count || 1) - 1)
        });

        // Update the comments count in the database
        await supabase
          .from('posts')
          .update({ comments_count: Math.max(0, (post.comments_count || 1) - 1) })
          .eq('id', id);
      }

      toast.success('Comment deleted successfully');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleEditComment = async (commentId: string, updatedContent: string) => {
    if (!user) {
      toast.error('Please log in to edit comments');
      return;
    }

    if (!updatedContent.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const { data: updatedComment, error } = await supabase
        .from('comments')
        .update({ content: updatedContent.trim() })
        .eq('id', commentId)
        .eq('user_id', user.id) // Ensure user can only edit their own comments
        .select(`
          *,
          Profiles!comments_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update comments list
      setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const toggleLike = async () => {
    if (!user) {
      toast.error('Please log in to like posts');
      return;
    }

    if (!post) return;

    try {
      const newLikedState = !post.liked_by_user;

      if (newLikedState) {
        // Add like
        const { error: likeError } = await supabase
          .from('likes')
          .insert({
            post_id: id,
            user_id: user.id
          });

        if (likeError) throw likeError;
      } else {
        // Remove like
        const { error: unlikeError } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', user.id);

        if (unlikeError) throw unlikeError;
      }

      // Always recount likes after the operation
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', id);

      const likeCount = count ?? 0; // Default to 0 if null

      await supabase
        .from('posts')
        .update({ likes_count: likeCount })
        .eq('id', id);

      // Update post in state
      setPost({
        ...post,
        likes_count: likeCount,
        liked_by_user: newLikedState
      });

    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  };

  if (isLoading) {
    return <div className="max-w-3xl mx-auto p-6">Loading...</div>;
  }

  if (!post) {
    return <div className="max-w-3xl mx-auto p-6">Post not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card key={post.id} className="bg-[#2e2e2e] border-0 p-4 relative">
        {/* Report Button */}
        <button className="absolute top-4 right-4 bg-black/30 p-2 rounded-full text-white hover:text-red-500">
          <FiFlag size={20} />
        </button>

        {/* User Info */}
        <div className="flex items-center gap-4">
          <img
            src={post.user?.avatar_url || "/default-avatar.png"}
            alt="User"
            className="w-10 h-10 rounded-full cursor-pointer"
          />
          <div>
            <p className="text-white font-semibold">{post.user?.username || "Unknown User"}</p>
            <p className="text-gray-400 text-sm">{new Date(post.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Post Image */}
        <div className="mt-4">
          <img
            src={post.image_url || "/placeholder.jpg"}
            alt="Post"
            className="w-full h-80 object-cover rounded-lg"
          />
        </div>

        {/* Post Actions */}
        <div className="flex items-center gap-6 mt-4 text-gray-400">
          <button
            className={`flex items-center gap-1 ${post.liked_by_user ? "text-red-500" : "text-gray-400"}`}
            onClick={toggleLike}
          >
            <FiHeart className="cursor-pointer hover:text-red-500" />
            <span>{post.likes_count || 0}</span>
          </button>

          <button className="flex items-center gap-1">
            <FiMessageCircle className="cursor-pointer hover:text-blue-400" />
            <span>{post.comments_count || 0}</span>
          </button>

          <button className="flex items-center gap-1 cursor-pointer hover:text-blue-400">
            <FiShare2 />
          </button>

          <p className="text-sm">{post.views || 0} Views</p>
        </div>
      </Card>

      {/* Comments Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Comments</h2>

        {/* Add Comment Box */}
        <div className="mt-4">
          <textarea
            className="w-full p-2 border rounded bg-[#2e2e2e] text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
          />
          <button 
            onClick={handleAddComment}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {replyTo ? "Reply" : "Add Comment"}
          </button>
        </div>

        {/* Comments List */}
        <div className="mt-6 space-y-4">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="p-4 border border-gray-700 rounded-lg bg-[#2e2e2e]">
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src={comment.user?.avatar_url || "/default-avatar.png"}
                    alt="User"
                    className="w-8 h-8 rounded-full"
                  />
                  <span className="font-semibold">{comment.user?.username || "Unknown User"}</span>
                  <span className="text-gray-400 text-sm">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-200">{comment.content}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => setReplyTo(comment.id)}
                    className="text-blue-500 hover:text-blue-400"
                  >
                    Reply
                  </button>
                  {user?.id === comment.user_id && (
                    <>
                      <button
                        onClick={() => {
                          const updatedContent = prompt("Edit your comment:", comment.content);
                          if (updatedContent) handleEditComment(comment.id, updatedContent);
                        }}
                        className="text-yellow-500 hover:text-yellow-400"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400">Be the first one to comment!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostPage;
