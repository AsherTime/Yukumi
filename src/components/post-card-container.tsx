"use client";

import PostCard from '@/components/post-card';
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from 'next/navigation';
import { PostgrestError } from "@supabase/supabase-js";
import { formatDistanceToNow } from "date-fns";

interface Post {
    id: string;
    title: string;
    content: string;
    created_at: string;
    user_id: string;
    likes_count: number;
    comments_count: number;
    liked_by_user: boolean;
    saved_by_user: boolean; // Added to track if the post is saved by the user
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

type PostCardContainerProps = {
    post: Post;
    idx: number;
    total: number;
    onLikeToggle: (e: React.MouseEvent, postId: string, liked: boolean) => Promise<void>;
    following: Set<string>;
    handleFollowToggle: (followedUserId: string) => Promise<void>;
    saved: string[];
    onToggleSave: (postId: string) => Promise<void>;
    onPostOpen?: (post: Post) => void;
};

export default function PostCardContainer({
    post,
    idx,
    total,
    onLikeToggle,
    following,
    handleFollowToggle,
    saved,
    onToggleSave,
    onPostOpen
}: PostCardContainerProps) {
    const { user } = useAuth();
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [showConfirmId, setShowConfirmId] = useState<string | null>(null);
    const [reportConfirmId, setReportConfirmId] = useState<string | null>(null);;
    const router = useRouter();



    const formatDate = (dateString: string) => {
        return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    };

    const navigateToCommunity = async (animeName: string | null) => {

        const { data: animeData, error: animeError } = await supabase
            .from("Anime")
            .select("id")
            .ilike("title", `${animeName}`) 
            .limit(1);

        if (animeError) {
            console.error("Error fetching anime:", animeError.message);
            return null;
        }
        const animeId = animeData?.[0]?.id;
        const { data, error } = await supabase
            .from("community")
            .select("id")
            .eq("anime_id", animeId)
            .maybeSingle(); 

        if (error) {
            console.error("Error fetching community ID:", error.message);
            return;
        }

        if (data?.id) {
            router.push(`/community/${data.id}`);
        }
    };

    const handleLikeClick = (e: React.MouseEvent) => {
        onLikeToggle(e, post.id, post.liked_by_user);
    };

    async function handleFollowClick(followedUserId: string): Promise<void> {
        await handleFollowToggle(followedUserId);
    }


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
            .maybeSingle();

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

    return (
        <PostCard
            post={post}
            idx={idx}
            total={total}
            formatDate={formatDate}
            navigatetoCommunity={navigateToCommunity}
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
            handleFollowClick={handleFollowClick}
            onPostOpen={onPostOpen}
        />
    );
}
