import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

interface FollowButtonProps {
  followedId: string;
  className?: string;
}

export function FollowButton({ followedId, className }: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id || !followedId || user.id === followedId) return;
    const checkFollow = async () => {
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("followed_id", followedId)
        .maybeSingle();
      setIsFollowing(!!data);
    };
    checkFollow();
  }, [user?.id, followedId]);

  const handleFollow = async () => {
    if (!user?.id || !followedId) return;
    setLoading(true);
    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("followed_id", followedId);
      setIsFollowing(false);
    } else {
      await supabase
        .from("follows")
        .insert({ follower_id: user.id, followed_id: followedId });
      setIsFollowing(true);
    }
    setLoading(false);
  };

  if (!user?.id || user.id === followedId) return null;

  return (
    <Button
      type="button"
      variant={isFollowing ? "secondary" : "default"}
      className={"ml-2 px-4 py-1 rounded-full text-xs font-semibold transition " + (isFollowing ? "bg-gray-700 text-white" : "bg-blue-600 text-white hover:bg-blue-700 ") + (className || "")}
      disabled={loading}
      onClick={handleFollow}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
} 