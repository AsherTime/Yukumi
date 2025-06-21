import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; 


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

export default function useSavedPosts(
  user: { id: string } | null,
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>,
  fetchPosts: () => Promise<void>
) {
  const [saved, setSaved] = useState<string[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);

  /* ──────────────── 1. Load saved post IDs once user is known ──────────────── */
  useEffect(() => {
    const loadSavedPosts = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("Profiles")
        .select("saved_posts")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching saved posts:", error);
        return;
      }

      setSaved(data?.saved_posts ?? []);
      setSavedLoading(false);
    };

    loadSavedPosts();
  }, [user]);

  /* ──────────────── 2. Toggle save / unsave for a single post ──────────────── */
  const toggleSave = async (postId: string) => {
    if (!user) return;

    /* ––– optimistic local state ––– */
    const alreadySaved = saved.includes(postId);
    const updatedIDs = alreadySaved
      ? saved.filter(id => id !== postId)
      : [...saved, postId];

    setSaved(updatedIDs);

    /* also patch the post list so UI flips instantly */
    setPosts(prev =>
      prev.map(p =>
        p.id === postId ? { ...p, saved_by_user: !alreadySaved } : p
      )
    );

    /* ––– persist to Supabase ––– */
    const { error } = await supabase
      .from("Profiles")
      .update({ saved_posts: updatedIDs })
      .eq("id", user.id);

    if (error) {
      console.error("Failed to persist saved posts:", error);

      /* rollback both local states */
      setSaved(saved); // revert IDs

      setPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, saved_by_user: alreadySaved } : p
        )
      );
      return;
    }

    /* ––– optional hard refresh to guarantee consistency ––– */
    await fetchPosts();
  };

  return { saved, savedLoading, toggleSave };
}
