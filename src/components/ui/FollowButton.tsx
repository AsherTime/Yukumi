import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";


type FollowButtonProps = {
  followedId: string;
  isFollowing: boolean;
  onToggle: (followedId: string) => void;
  className?: string;
};

export function FollowButton({ followedId, isFollowing, onToggle, className = "" }: FollowButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!user?.id || user.id === followedId) return null;

  const handleClick = async () => {
    setLoading(true);
    await onToggle(followedId); // Pass followedId to parent handler
    setLoading(false);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={`px-4 py-1 rounded-full text-xs font-semibold transition ${
        isFollowing ? "bg-gray-700 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
      } ${className}`}
    >
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
}
