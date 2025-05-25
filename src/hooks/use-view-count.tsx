import { useRef } from "react";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";


// Custom hook for view counting on visible post
export default function useViewCountOnVisible(postId: string) {
  const ref = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hasCountedRef = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new window.IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasCountedRef.current) {
          timerRef.current = setTimeout(() => {
            supabase.rpc("increment_post_view", { post_id: postId })
              .then(({ error }) => {
                if (error) {
                  console.error("Failed to increment view (feed):", error);
                } else {
                  console.log("View counted (feed) for", postId);
                  hasCountedRef.current = true;
                }
              });
          }, 8000);
        } else {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(ref.current);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      observer.disconnect();
    };
  }, [postId]);
  return ref;
}