import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";


export default function useHandleFollow(
    user: { id: string } | null,
) {
    const [following, setFollowing] = useState<Set<string>>(new Set());

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
            if (isFollowingUser) {
                newSet.delete(followedUserId);
            } else {
                newSet.add(followedUserId);
            }
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

    return {
        following,
        handleFollowToggle
    };
}