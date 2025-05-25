import { supabase } from "@/lib/supabase";

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
        display_name: string;
    };
    tags?: string[];
    views: number;
}

export default function handleLike(
    user: { id: string } | null,
    setPostsData: React.Dispatch<React.SetStateAction<Post[]>>,
    fetchPosts: () => Promise<void>
) {
    const toggleLike = async (postId: string, liked: boolean) => {
        if (!user) {
            console.log("No user found, cannot like");
            return;
        }

        try {
            console.log("Attempting to toggle like:", { postId, liked, userId: user.id });

            if (liked) {
                // Unlike the post
                const { error: unlikeError } = await supabase
                    .from("likes")
                    .delete()
                    .eq("post_id", postId)
                    .eq("user_id", user.id);

                if (unlikeError) {
                    console.error("Error unliking post:", unlikeError);
                    return;
                }
                console.log("Successfully unliked post");
            } else {
                // Like the post
                const { error: likeError } = await supabase
                    .from("likes")
                    .insert({
                        post_id: postId,
                        user_id: user.id
                    });

                if (likeError) {
                    console.error("Error liking post:", likeError);
                    return;
                }
                console.log("Successfully liked post");
            }

            // Update the UI immediately
            setPostsData(prevPosts =>
                prevPosts.map(post =>
                    post.id === postId
                        ? {
                            ...post,
                            liked_by_user: !liked,
                            likes_count: liked ? post.likes_count - 1 : post.likes_count + 1
                        }
                        : post
                )
            );

            // Then refresh the data in the background
            fetchPosts();
        } catch (error) {
            console.error("Error in toggleLike:", error);
        }
    };

    const handleLikeClick = async (e: React.MouseEvent, postId: string, liked: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        await toggleLike(postId, liked);
    };

    return { handleLikeClick };
}