"use client";

import { Card } from "@/components/ui/card";
import { FiShare2, FiFlag, FiHeart, FiMessageCircle } from "react-icons/fi"; // Importing icons

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";


interface Comment {
    id: number
    created_at: string
    posts_id: number
    users_id: number
    content: string
    updated_at: string
    parent_id: number
}

interface Post {
    id: number
    created_at: string
    users_id: number
    animes1_id: number
    title: string
    image_url: string
    content: string
    collection: string[]
    OG_Work: boolean
    ref_link: string
    likes: number
    comment_count: number
    comment: [string]
    views: number
    shares: number
    liked?: boolean;
    username?: string;
    profile_pic?: string;
}

const PostPage = () => {
  const { id } = useParams(); // Get the post ID from URL
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [liked, setLiked] = useState<boolean>(false)
  

  useEffect(() => {
    const auth = getAuth();

        onAuthStateChanged(auth, async (user) => {
          if (user) {
            const firebase_uid = user.uid; // Get Firebase UID
      
            try {
              const res = await fetch("https://x8ki-letl-twmt.n7.xano.io/api:hRCl8Tp6/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ firebase_uid }),
              });
      
              if (!res.ok) throw new Error("Failed to fetch user ID");
      
              const data = await res.json();
              setUserId(data.id); // Set Xano user ID
            } catch (error) {
              console.error("Error fetching user ID:", error);
            }
          } else {
            setUserId(null); // No user logged in
          }
        });

    //fetch the like details
    fetch(`https://x8ki-letl-twmt.n7.xano.io/api:eA0dhH6K/likes/getRecord`, {
      method: "POST", // or "PUT" depending on Xano API setup
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ users_id: userId, posts_id: id }),
    })
      .then((res) => res.json())
      .then((data) => {
        setLiked(data?.liked ?? false); // If data is null, set liked to false
      })
      .catch((err) => {
        console.error("Error fetching like record:", err);
        setLiked(false); // Fallback to false in case of an error
      });
    

    // Fetch the post details
    fetch(`https://x8ki-letl-twmt.n7.xano.io/api:0Q68j1tU/posts/${id}`)
      .then((res) => res.json())
      .then((postData) => {
        if (!postData || !postData.users_id) {
          console.error("Post data or users_id missing");
          return;
        }
    
        // Fetch user details using users_id
        fetch(`https://x8ki-letl-twmt.n7.xano.io/api:0Q68j1tU/users/${postData.users_id}`)
          .then((res) => res.json())
          .then((userData) => {
            // Combine post data with username & profile pic
            setPost({
              ...postData,
              liked: liked,
              username: userData.username,
              profile_pic: userData.picture_url,
            });
          })
          .catch((err) => console.error("Error fetching user data:", err));
      })
      .catch((err) => console.error("Error fetching post data:", err));

    // Fetch comments for the post
    fetch("https://x8ki-letl-twmt.n7.xano.io/api:oxZQQ-hr/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }), // Send ID in the request body
      })
        .then((res) => res.json())
        .then((data) => setComments(data));
  }, [id]);

  // Handle adding a comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const commentData = {
      post_id: id,
      user_id: userId,
      content: newComment,
      parent_id: replyTo,
    };

    const res = await fetch("https://x8ki-letl-twmt.n7.xano.io/api:oxZQQ-hr/comments", {
      method: "POST",
      body: JSON.stringify(commentData),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const newCommentData = await res.json();
      setComments([...comments, newCommentData]);
      setNewComment("");
      setReplyTo(null);
    }
  };

  // Handle deleting a comment
  const handleDeleteComment = async (commentId: number) => {
    if (!userId) return;

    const res = await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:oxZQQ-hr/comments/${commentId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setComments(comments.filter((c) => c.id !== commentId));
    }
  };

  // Handle editing a comment
  const handleEditComment = async (commentId: number, updatedContent: string) => {
    const res = await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:oxZQQ-hr/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify({ content: updatedContent }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      setComments(comments.map((c) => (c.id === commentId ? { ...c, content: updatedContent } : c)));
    }
  };

  const toggleLike = async(postId: number) => {
    setPost((post) => {
      if (!post) return post; // Ensure prevPost is not null
    
      return {
        ...post,
        likes: post.liked ? post.likes - 1 : post.likes + 1,
        liked: !post.liked, // Toggle liked state
      };
    });
    if (!post) return post; // Ensure prevPost is not null
    try {
      await fetch("https://x8ki-letl-twmt.n7.xano.io/api:0Q68j1tU/update/likes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ posts_id: postId }),
    });
      await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:eA0dhH6K/likes`, {
        method: "POST", // or "PUT" depending on Xano API setup
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ users_id: userId, posts_id: postId, liked: !post.liked
        }),
      });
  
    } catch (error) {
      console.error("Error updating like count in Xano:", error);
    }
  };
  
  

  return (
    <div className="max-w-3xl mx-auto p-6">
      {post && (
        <Card key={post.id} className="bg-[#2e2e2e] border-0 p-4 relative">
        {/* 🚨 Report Button (Correctly placed on Top-Right) */}
        <button className="absolute top-4 right-4 bg-black/30 p-2 rounded-full text-white hover:text-red-500">
          <FiFlag size={20} />
        </button>

        {/* User Info (Profile Picture Clickable) */}
        <div className="flex items-center gap-4">
          <img
            src={post.profile_pic || "/default-avatar.png"} // Fallback image
            alt="User"
            className="w-10 h-10 rounded-full cursor-pointer"
          />
          <div>
            <p className="text-white font-semibold">{post.username || "Unknown User"}</p>
            <p className="text-gray-400 text-sm">{post.created_at || "Just now"}</p>
          </div>
        </div>

        {/* Post Image */}
        <div className="mt-4">
          <img
            src={post.image_url || "/placeholder.jpg"} // Fallback image
            alt="Post"
            className="w-full h-80 object-cover rounded-lg"
          />
        </div>

        {/* Post Actions (Like, Comment, Share, Views) */}
        <div className="flex items-center gap-6 mt-4 text-gray-400">
          {/* ✅ Like Button */}
          <button
            className={`flex items-center gap-1 ${post.liked ? "text-red-500" : "text-gray-400"}`}
            onClick={() => toggleLike(post.id)}
          >
            <FiHeart className="cursor-pointer hover:text-red-500" />
            <span>{post.likes || 0}</span>
          </button>

          {/* ✅ Comment Button */}
          <button className="flex items-center gap-1">
            <FiMessageCircle className="cursor-pointer hover:text-blue-400" />
            <span>{post.comment_count || 0}</span>
          </button>

          {/* ✅ Share Button (Now Left of Views) */}
          <button className="flex items-center gap-1 cursor-pointer hover:text-blue-400">
            <FiShare2 />
          </button>

          {/* ✅ Views (Now Right of Share) */}
          <p className="text-sm">{post.views || 0} Views</p>
        </div>
      </Card>
      )}
 
      <div className="mt-6">
        <h2 className="string-2xl font-semibold">Comments</h2>

        {/* Add Comment Box */}
        <div className="mt-4">
          <textarea
            className="w-full p-2 border rounded"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
          />
          <button onClick={handleAddComment} className="mt-2 px-4 py-2 bg-blue-500 string-white rounded">
            {replyTo ? "Reply" : "Add Comment"}
          </button>
        </div>

        {/* Comment List */}
        <div className="mt-6">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="p-4 border-b">
              <p>{comment.content}</p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => setReplyTo(comment.id)} className="string-blue-500">
                  Reply
                </button>
                {userId === comment.users_id && (
                  <>
                    <button
                      onClick={() => {
                        const updatedContent = prompt("Edit your comment:", comment.content);
                        if (updatedContent) handleEditComment(comment.id, updatedContent);
                      }}
                      className="string-yellow-500"
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDeleteComment(comment.id)} className="string-red-500">
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        ): (
          <p>Be the first one to comment!</p>
        )}
        </div>
      </div>
    </div>
  );
};

export default PostPage;
