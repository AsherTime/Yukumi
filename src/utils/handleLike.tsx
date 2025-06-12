import { supabase } from "@/lib/supabase";
import { awardPoints } from '@/utils/awardPoints';
import { POINTS } from '@/utils/pointConfig';

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



export default function handleLike(
    user: { id: string } | null,
    setPostsData: React.Dispatch<React.SetStateAction<Post[]>>,
    fetchPosts: () => Promise<void>
) {

    const toggleLike = async (postId: string, liked: boolean, userId: string) => {
    try {
        if (liked) {
            // Unlike
            const { error } = await supabase
                .from('likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', userId);

            if (error) throw error;

            // Update post likes count
            await supabase.rpc('decrement_likes', { post_id: postId });
        } else {
            // Like
            const { error } = await supabase
                .from('likes')
                .insert([{ post_id: postId, user_id: userId }]);

            if (error) throw error;

            // Update post likes count
            await supabase.rpc('increment_likes', { post_id: postId });
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

            fetchPosts();

            // Award points for liking
            try {
                await awardPoints(
                    userId,
                    'post_liked',
                    5,
                    postId,
                    'post'
                );
            } catch (pointsError) {
                console.error('Failed to award points for like:', pointsError);
            }

            
    } catch (error) {
        console.error('Error toggling like:', error);
        throw error;
    }
};

    const handleLikeClick = async (e: React.MouseEvent, postId: string, liked: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (user) {
            await toggleLike(postId, liked, user.id);
        } else {
            console.log("No user found, cannot like");
        }
    };

    return { handleLikeClick };
}