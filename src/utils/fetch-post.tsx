import { supabase } from "@/lib/supabase";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

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

type PostTag = {
    tags?: {
        name?: string;
    };
};


export default function useFetchPost() {
    const [postsData, setPostsData] = useState<Post[]>([]);
    const { user } = useAuth();


    const fetchPosts = useCallback(async (reset = false) => {
        try {

            const { data: posts, error } = await supabase
                .from("posts")
                .select(`*, Profiles(username, avatar_url),post_tags(tags(name))`, { count: "exact" })
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Post fetch error:", error);
                return;
            }



            let savedPosts: string[] = [];

            // Only fetch saved posts if user is logged in
            if (user?.id) {
                const { data: profileData, error: profileError } = await supabase
                    .from("Profiles")
                    .select("saved_posts")
                    .eq("id", user.id)
                    .maybeSingle();

                if (profileError) {
                    console.error("Failed to fetch saved posts:", profileError);
                }

                savedPosts = profileData?.saved_posts ?? [];
            }

            const postsWithMeta = await Promise.all(
                posts.map(async post => {
                    const tags =
                        post.post_tags?.map((pt: PostTag) => pt.tags?.name).filter(Boolean) || [];

                    // Prepare promises
                    const countLikesPromise = supabase
                        .from("likes")
                        .select("*", { count: "exact", head: true })
                        .eq("post_id", post.id);

                    const countCommentsPromise = supabase
                        .from("comments")
                        .select("*", { count: "exact", head: true })
                        .eq("post_id", post.id);

                    const likeByUserPromise = user?.id
                        ? supabase
                            .from("likes")
                            .select("*")
                            .eq("post_id", post.id)
                            .eq("user_id", user.id)
                            .maybeSingle()
                        : Promise.resolve({ data: null });

                    const [{ count: likes = 0 }, { count: comments = 0 }, { data: likeRecord }] =
                        await Promise.all([countLikesPromise, countCommentsPromise, likeByUserPromise]);

                    return {
                        ...post,
                        tags,
                        likes_count: likes ?? 0,
                        comments_count: comments ?? 0,
                        liked_by_user: !!likeRecord,
                        saved_by_user: savedPosts.includes(post.id),
                        Profiles: Array.isArray(post.Profiles) ? post.Profiles[0] : post.Profiles
                    };
                })
            );

            if (reset) {
                setPostsData(postsWithMeta);
            } else {
                setPostsData(prev => [...prev, ...postsWithMeta]);
            }
        } catch (err) {
            console.error("fetchPosts error:", err);
        }
    }, [user]);

    useEffect(() => {
        fetchPosts(true); // Always call
    }, [user, fetchPosts]);

    return { postsData, setPostsData, fetchPosts };
}