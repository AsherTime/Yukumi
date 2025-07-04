"use client";
export const runtime = "edge";
import { FiEdit2, FiTrash2 } from "react-icons/fi"; // Importing icons
import { ThumbsUpIcon, Flag, PlusCircle, MinusCircle } from 'lucide-react';
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Image from "next/image";
import { FiCornerUpLeft } from 'react-icons/fi';
import { awardPoints } from '@/utils/awardPoints';
import { POINTS } from '@/utils/pointConfig';
import { handleCommentComrade } from '@/utils/dailyTasks';
import PostCardContainer from "@/components/post-card-container";
import useSavedPosts from "@/utils/use-saved-posts";
import fetchPost from "@/utils/fetch-post";
import handleLike from "@/utils/handleLike";
import handleFollow from "@/utils/handleFollow";
import { useLoginGate } from '@/contexts/LoginGateContext';

interface Profile {
  username: string;
  avatar_url: string;
}

interface Comment {
  id: string
  created_at: string
  post_id: string
  user_id: string
  content: string
  parent_id: string | null
  Profiles?: {
    username: string
    avatar_url: string
  }
}

type NestedComment = Comment & {
  replies: NestedComment[];
  depth: number;
};

type CommentItemProps = {
  comment: NestedComment;          // contains id, content, replies[]
  postId: string;         // id of the post the thread belongs to
  onAddComment: (postId: string, parentId: string | null, text: string) => void;
  onEditComment: (commentId: string, updatedContent: string) => void; // optional edit handler
  onDeleteComment: (commentId: string) => void; // optional delete handler
  isLiked: boolean;
  likeCount: number;
  onToggleLike: (commentId: string, isLiked: boolean) => void;
};


interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  liked_by_user: boolean;
  saved_by_user: boolean;
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

function buildCommentTree(
  comments: Comment[],
  likeCounts: Record<string, number>
): NestedComment[] {
  const commentMap: { [key: string]: NestedComment } = {};
  const roots: NestedComment[] = [];

  // 1. Initialize comment map with depth = 0
  comments.forEach((comment) => {
    commentMap[comment.id] = { ...comment, replies: [], depth: 0 };
  });

  // 2. Assign children and compute depth
  comments.forEach((comment) => {
    const current = commentMap[comment.id];
    if (comment.parent_id && commentMap[comment.parent_id]) {
      const parent = commentMap[comment.parent_id];
      current.depth = parent.depth + 1;
      parent.replies.push(current);
    } else {
      roots.push(current);
    }
  });

  // 3. Recursive sort helper
  const sortByLikes = (a: NestedComment, b: NestedComment) =>
    (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0);

  const sortReplies = (node: NestedComment) => {
    node.replies.sort(sortByLikes);
    node.replies.forEach(sortReplies); // Recurse
  };

  // 4. Sort roots and all nested replies
  roots.sort(sortByLikes);
  roots.forEach(sortReplies);

  return roots;
}




const PostPage = () => {
  const { id } = useParams(); // Get the post ID from URL
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [, setReplyTo] = useState<string | null>(null);
  const { setPostsData, fetchPosts } = fetchPost();
  const { saved, toggleSave } = useSavedPosts(user, setPostsData, fetchPosts); // pass fetchPosts here
  const { handleLikeClick } = handleLike(user, setPostsData, fetchPosts);
  const { following, handleFollowToggle } = handleFollow(user);
  const [, setProfile] = useState<Profile | null>(null);
  const { requireLogin } = useLoginGate();

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("Profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

      if (data) setProfile(data);
    };

    fetchProfile();
  }, [user]);



  useEffect(() => {
    if (!id) return;

    const fetchPostAndComments = async () => {
      const [{ count: likes = 0 }, { count: comments = 0 }] = await Promise.all([
        supabase.from("likes").select("*", { count: "exact", head: true }).eq("post_id", id),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("post_id", id),
      ]);

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
          .maybeSingle();

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
          liked_by_user: likedByUser,
          likes_count: likes,
          comments_count: comments
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

  // View counting effect (1 second)
  useEffect(() => {
    if (!id) return;
    const timer = setTimeout(() => {
      supabase.rpc("increment_post_view", { post_id: id })
        .then(({ error }) => {
          if (error) {
            console.error("Failed to increment view:", error);
          } else {
            console.log("View counted (detail page) for", id);
          }
        });
    }, 1000);
    return () => clearTimeout(timer);
  }, [id]);


  const handleAddComment: (postId: string, parentId: string | null, content: string) => Promise<void> = async (
    postId,
    parentId,
    content
  ) => {
    if (!user) {
      toast.error('Please log in to comment');
      return;
    }

    if (!content.trim()) {
      toast.error('Comment cannot be empty');
      return;
    }

    try {
      const { data: newCommentData, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
          parent_id: parentId
        })
        .select(`
        *,
        Profiles!comments_user_id_fkey (
          username,
          avatar_url
        )
      `)
        .maybeSingle();

      if (error) throw error;
      console.log("Supabase returned newCommentData:", newCommentData); // <--- ADD THIS


      const enrichedComment = {
        ...newCommentData,
        Profiles: { // Ensure this matches the structure your comment rendering component expects
          username: newCommentData.Profiles.username,
          avatar_url: newCommentData.Profiles.avatar_url,
        }
      };
      console.log("Constructed enrichedComment:", enrichedComment); // <--- ADD THIS

      setComments(prev => [enrichedComment, ...prev]);


      // Update post comment count
      if (post) {
        setPost({
          ...post,
          comments_count: (post.comments_count || 0) + 1
        });

        await supabase
          .from('posts')
          .update({ comments_count: (post.comments_count || 0) + 1 })
          .eq('id', postId);
      }
      setNewComment(''); // Clear input field
      setReplyTo(null); // Reset reply state
      toast.success('Comment added successfully');
      try {
        // Award regular comment points
        await awardPoints(
          user.id,
          'comment_post',
          POINTS.comment_post,
          String(id),
          'post'
        );

        // Try to award daily task points
        const wasAwarded = await handleCommentComrade(
          user.id,
          String(id),
          'post'
        );

        if (wasAwarded) {
          toast.success('Comment added and daily task completed! +15 XP');
        } else {
          toast.success('Comment added and points awarded!');
        }
      } catch (pointsError) {
        console.error('Failed to award points for comment:', pointsError);
        toast.warning('Comment added, but points system is temporarily unavailable');
      }
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
        .maybeSingle();

      if (error) throw error;

      // Update comments list
      if (updatedComment) {
        const transformedComment = {
          ...updatedComment,
          user: updatedComment.Profiles || updatedComment.profiles || null,
        };
        delete transformedComment.Profiles;
        delete transformedComment.profiles;

        setComments(prev => prev.map(c => c.id === commentId ? transformedComment : c));
      }

      toast.success('Comment updated successfully');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Failed to update comment');
    }
  };

  const reportComment = async (commentId: string, userId: string | null) => {
    if (!userId) {
      alert("You must be logged in to report a comment.");
      return;
    }

    const { error } = await supabase
      .from("comments")
      .update({ is_reported: true })
      .eq("id", commentId)
      .eq("is_reported", false); // avoid unnecessary updates

    if (error) {
      console.error("Failed to report comment:", error);
      alert("Something went wrong while reporting the comment.");
    } else {
      alert("Comment has been reported.");
      // Optionally update UI or re-fetch comments
    }
  };

  const onLikeClick = async (e: React.MouseEvent, postId: string, liked: boolean) => {
    // Optimistically update post state
    setPost(prev => {
      if (!prev || prev.id !== postId) return prev;

      return {
        ...prev,
        liked_by_user: !liked,
        likes_count: liked ? prev.likes_count - 1 : prev.likes_count + 1,
      };
    });

    // Then call the real function
    await handleLikeClick(e, postId, liked);
  };


  const toggleCommentLike = async (commentId: string, isLiked: boolean) => {
    if (!user) {
      alert("You must be logged in to like a comment.");
      return;
    }

    setLikeCounts(prev => ({
      ...prev,
      [commentId]: Math.max(0, (prev[commentId] || 0) + (isLiked ? -1 : 1)),
    }));

    setUserLikedSet(prev => {
      const updated = new Set(prev);
      if (isLiked) {
        updated.delete(commentId);
      } else {
        updated.add(commentId);
      }
      return updated;
    });

    if (isLiked) {
      // Remove like
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('comment_id', commentId)
        .eq('user_id', user.id);

      if (error) console.error("Error removing like:", error);
    } else {
      // Add like
      const { error } = await supabase
        .from('comment_likes')
        .upsert([{ comment_id: commentId, user_id: user.id }], { onConflict: 'comment_id,user_id' });

      if (error) console.error("Error adding like:", error);
    }

    // Optionally: re-fetch likes/comments here or update local state
  };

  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [userLikedSet, setUserLikedSet] = useState<Set<string>>(new Set());

  useEffect(() => {

    const fetchLikes = async () => {
      // 1. Fetch like counts
      // 1. Fetch all comment likes
      const { data: allLikes, error: likeError } = await supabase
        .from('comment_likes')
        .select('comment_id');

      if (likeError) {
        console.error("Error fetching like counts:", likeError);
      } else {
        const countsMap: Record<string, number> = {};

        allLikes.forEach(({ comment_id }) => {
          countsMap[comment_id] = (countsMap[comment_id] || 0) + 1;
        });

        setLikeCounts(countsMap); // Now you can use likeCounts[comment.id]
      }


      // 2. Fetch likes by current user
      if(user){
      const { data: likedData, error: likedError } = await supabase
        .from('comment_likes')
        .select('comment_id')
        .eq('user_id', user?.id);

      if (likedError) console.error(likedError);
      setUserLikedSet(new Set(likedData?.map(d => d.comment_id)));
      }
    };

    fetchLikes();
  }, [user]);

  const [nestedComments, setNestedComments] = useState<NestedComment[]>(() => buildCommentTree(comments, likeCounts));

  useEffect(() => {
    setNestedComments(buildCommentTree(comments, likeCounts));
  }, [comments, likeCounts]);


  if (isLoading) {
    return <div className="max-w-3xl mx-auto p-6">Loading...</div>;
  }

  if (!post) {
    return <div className="max-w-3xl mx-auto p-6">Post not found</div>;
  }

  const shouldAutoCollapse = (comment: NestedComment) =>
    (comment.depth ?? 0) >= 2;

  const CommentItem = ({
    comment,
    postId,
    onAddComment,
    onEditComment,
    onDeleteComment,
    likeCount,
    isLiked,
    onToggleLike
  }: CommentItemProps) => {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [collapsed, setCollapsed] = useState(shouldAutoCollapse(comment));

    const FIFTEEN_MINUTES = 15 * 60 * 1000; // in milliseconds

    const canEdit = (() => {
      if (!comment.created_at) return false; // no timestamp, disallow editing
      const createdAt = new Date(comment.created_at).getTime();
      const now = Date.now();
      return now - createdAt <= FIFTEEN_MINUTES;
    })();

    const handleSubmitReply = () => {
      onAddComment(postId, comment.id, replyText);
      setReplyText("");
      setIsReplying(false);
    };

    const handleEditClick = (): void => {
      const updatedContent = prompt("Edit your comment:", comment.content);
      if (updatedContent) {
        onEditComment(comment.id, updatedContent);
      }
    };

    const handleDeleteClick = (): void => {
      if (confirm("Are you sure you want to delete this comment?")) {
        onDeleteComment(comment.id);
      }
    };

    const username = comment.Profiles?.username || "Anonymous";
    const avatarUrl = comment.Profiles?.avatar_url || "/placeholder.svg"; // No fallback here if Image component handles null/undefined

    return (
      <div className="space-y-4 shadow-md p-4 rounded-lg">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <PlusCircle size={18} /> : <MinusCircle size={18} />}
          </button>
          {comment.Profiles?.avatar_url && (
            <Image
              src={avatarUrl} // Use the avatarUrl variable
              alt="Avatar"
              width={32}
              height={32}
              className="rounded-full object-cover w-10 h-10"
            />
          )}
          <p className="font-semibold">{username}</p>
        </div>
        {!collapsed &&
          <div className="ml-10">
            <p className="mt-2 pt-2">{comment.content}</p>
            <div className="flex space-x-6 mt-3 items-center pt-2 pb-2">
              <button
                onClick={() => {
                  const allowed = requireLogin();
                  if (!allowed) return;
                  onToggleLike(comment.id, isLiked)
                }}
                className={`flex items-center space-x-1 text-sm ${isLiked ? 'text-blue-500 font-bold' : 'text-gray-500'} hover:underline`}
              >
                {isLiked ? (
                  <ThumbsUpIcon className="w-5 h-5 text-blue-500" />
                ) : (
                  <ThumbsUpIcon className="w-5 h-5 text-gray-400 hover:text-blue-500" />
                )}
                <span>{likeCount}</span>
              </button>

              <button
                onClick={() => {
                  const allowed = requireLogin();
                  if (!allowed) return;
                  setReplyTo(comment.id);
                  setIsReplying(true);
                }}
                className="text-blue-500 hover:text-blue-400 text-sm flex items-center"
                aria-label="Reply"
              >
                <FiCornerUpLeft size={20} />&nbsp;&nbsp;Reply
              </button>

              {comment.user_id === user?.id && canEdit && (
                <button
                  onClick={handleEditClick}
                  className="text-green-500 hover:text-green-400 text-sm flex items-center"
                  aria-label="Edit"
                >
                  <FiEdit2 size={18} />&nbsp;&nbsp;Edit
                </button>
              )}

              {comment.user_id === user?.id && (
                <button
                  onClick={handleDeleteClick}
                  className="text-red-500 hover:text-red-400 text-sm flex items-center"
                  aria-label="Delete"
                >
                  <FiTrash2 size={18} />&nbsp;&nbsp;Delete
                </button>
              )}

              {comment.user_id !== user?.id && (
                <button
                  onClick={() => {
                    const allowed = requireLogin();
                    if (!allowed) return;
                    reportComment(comment.id, user?.id || null)
                  }}
                  className="flex items-center text-xs text-red-500 hover:text-red-400"
                  aria-label="Report comment"
                >
                  <Flag className="w-5 h-5" />&nbsp;&nbsp;Report
                </button>
              )}

            </div>

            {isReplying && (
              <div className="mt-2">
                <textarea
                  className="w-full p-2 border rounded bg-[#2e2e2e] text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  id="replyText"
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write your reply..."
                />
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={handleSubmitReply}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => setIsReplying(false)}
                    className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        }
        {!collapsed && comment.replies?.length > 0 && (
          <div className="ml-4 mt-4 border-l-2 border-gray-300 pl-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                onAddComment={onAddComment}
                onEditComment={onEditComment}
                onDeleteComment={onDeleteComment}
                likeCount={likeCounts[reply.id] || 0}
                isLiked={userLikedSet.has(reply.id)}
                onToggleLike={toggleCommentLike}
              />

            ))}
          </div>
        )}
      </div>
    );
  };


  const bg_url = "https://ik.imagekit.io/g19tkydww/Background_Images/night-view-3615087_1280.jpg?updatedAt=1748103791775";
  return (
    <div className="relative min-h-screen">
      <div className="fixed top-0 left-0 w-full h-full -z-10">
        <Image
          src={bg_url}
          alt="Anime Banner"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="absolute inset-0 bg-black opacity-70 z-10"></div>
      <div className="relative z-10 max-w-7xl mx-auto p-6 text-white">
        <div className="relative rounded-2xl bg-[#1f1f1f] border border-zinc-800 shadow-md">
          <PostCardContainer
            key={post.id}
            idx={0}
            total={1}
            post={post}
            onLikeToggle={onLikeClick}
            following={following}
            handleFollowToggle={handleFollowToggle}
            saved={saved}
            onToggleSave={() => toggleSave(post.id)}
          />
        </div>
        {post.image_url && post.content && (
          <div className="relative rounded-2xl bg-[#1f1f1f] border border-zinc-800 shadow-md mt-6 pt-3 pb-3">
            <p className="text-gray-300 px-6 pb-2" dangerouslySetInnerHTML={{ __html: post.content }}></p>
          </div>
        )}
        {/* Comments Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Comments</h2>

          {/* Add Comment Box */}
          <div className="mt-4">
            <textarea
              id="newComment"
              className="w-full p-2 border rounded bg-[#2e2e2e] text-white border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
            />
            <button
              onClick={() => {
                const allowed = requireLogin();
                if (!allowed) return;
                handleAddComment(post.id, null, newComment)
              }}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Add Comment
            </button>
          </div>

          {/* Comments List */}
          <div className="mt-6 space-y-4 bg-slate-900 shadow-md p-4 rounded-lg">
            {nestedComments.length > 0 ? (
              nestedComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  postId={id as string}
                  onAddComment={handleAddComment}
                  onEditComment={handleEditComment}
                  onDeleteComment={handleDeleteComment}
                  likeCount={likeCounts[comment.id] || 0}
                  isLiked={userLikedSet.has(comment.id)}
                  onToggleLike={toggleCommentLike}
                />

              ))
            ) : (
              <p className="text-gray-400">Be the first one to comment!</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PostPage;
