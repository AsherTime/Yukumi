"use client";

import PostCard from '@/components/post-card';
import useSavedPosts from '@/utils/use-saved-posts';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from 'next/navigation';
import { PostgrestError } from "@supabase/supabase-js";

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
    tags?: string[];
    views: number;
}

type PostCardContainerProps = {
    post: Post;
    idx: number;
    total: number;
    onLikeToggle: (e: React.MouseEvent, postId: string, liked: boolean) => Promise<void>;
    saved: string[];
    onToggleSave: (postId: string) => Promise<void>;
};

export default function PostCardContainer({
    post,
    idx,
    total,
    onLikeToggle,
    saved,
    onToggleSave
}: PostCardContainerProps) {
    const { user } = useAuth();
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [showConfirmId, setShowConfirmId] = useState<string | null>(null);
    const [reportConfirmId, setReportConfirmId] = useState<string | null>(null);;
    const [following, setFollowing] = useState<Set<string>>(new Set());
    const router = useRouter();



    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const handleLikeClick = (e: React.MouseEvent) => {
        onLikeToggle(e, post.id, post.liked_by_user);
    };


    // Redirecting to comment section for each post
    const handleCommentClick = (postId: string) => {
        router.push(`/post/${postId}`);
    };

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

    // Add a click handler with event prevention
    const handleDelete = async (postId: string) => {
        const result = await deletePostIfOwner(postId, user?.id || "");

        if (result.success) {
            alert('Post deleted.');
        } else {
            alert(`Failed to delete post: ${result.error}`);
        }

        setShowConfirmId(null);
        setMenuOpenId(null);
    };

    useEffect(() => {
        const fetchFollowing = async () => {
            if (!user?.id) return;

            const { data, error } = await supabase
                .from("follows")
                .select("followed_id")
                .eq("follower_id", user.id);

            if (!error && data) {
                const followedIds = data.map(f => f.followed_id);
                setFollowing(new Set(followedIds));
            }
        };

        fetchFollowing();
    }, [user?.id]);


    const handleFollowToggle = async (followedUserId: string) => {
        const isFollowingUser = following.has(followedUserId);

        // Optimistic UI update
        setFollowing(prev => {
            const newSet = new Set(prev);
            isFollowingUser ? newSet.delete(followedUserId) : newSet.add(followedUserId);
            return newSet;
        });

        // Update in Supabase
        if (isFollowingUser) {
            await supabase
                .from("follows")
                .delete()
                .eq("follower_id", user?.id)
                .eq("followed_id", followedUserId);
        } else {
            await supabase
                .from("follows")
                .insert({ follower_id: user?.id, followed_id: followedUserId });
        }
    };


    const handleReport = async (postId: string) => {
        try {
            const { error } = await supabase
                .from("posts")
                .update({ isReported: true })
                .eq("id", postId);

            if (error) {
                console.error("Report failed:", error);
                alert("Failed to report the post.");
            } else {
                alert("Post reported successfully.");
            }
        } catch (err) {
            console.error("Unexpected error reporting post:", err);
            alert("Something went wrong.");
        }
    };

    console.log("array.from(following)", Array.from(following))
    console.log("following.has(post.user_id)", following.has(post.user_id))
    return (
        <PostCard
            post={post}
            idx={idx}
            total={total}
            formatDate={formatDate}
            setMenuOpenId={setMenuOpenId}
            menuOpenId={menuOpenId}
            user={user}
            setShowConfirmId={setShowConfirmId}
            showConfirmId={showConfirmId}
            reportConfirmId={reportConfirmId}
            setReportConfirmId={setReportConfirmId}
            handleDelete={handleDelete}
            handleLikeClick={handleLikeClick}
            handleCommentClick={handleCommentClick}
            handleReport={handleReport}
            saved={saved}
            handleSave={onToggleSave}
            isFollowing={following.has(post.user_id)}
            onFollowToggle={() => handleFollowToggle(post.user_id)}
        />
    );
}
