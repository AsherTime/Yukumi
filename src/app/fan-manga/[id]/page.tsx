"use client";
export const runtime = "edge";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MangaReaderPage from "@/components/MangaReaderPage";

interface FanStoryFromDB {
  id: string;
  user_id: string;
  title: string;
  synopsis: string | null;
  content: string;
  tags: string[] | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  views: number;
}

type Pages = {
  id: string;
  content: string;
}

type Chapter = {
  id: number;
  pages: Pages[];
  title: string;
  name: string;
  length: number;
};

interface FanStory extends FanStoryFromDB {
  chapters: Chapter[];
}

export default function FanMangaReadPage() {
  const router = useRouter();
  const params = useParams();
  const mangaId = params?.id as string;
  const [mangaData, setMangaData] = useState<FanStory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mangaId) return;
    const incrementViews = async () => {
      const { error } = await supabase.rpc("increment_fan_story_views", {
        story_id: mangaId,
      });
      if (error) console.error("Failed to increment views:", error.message);
    };

    incrementViews();
  }, [params, mangaId]);


  useEffect(() => {
    if (!mangaId) return;
    const fetchManga = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("fan_stories")
        .select("*")
        .eq("id", mangaId)
        .maybeSingle();
      if (error) {
        setMangaData(null);
      } else {
        // Parse chapters/pages from content
        if (data) {
          let chapters = [];
          try {
            chapters = JSON.parse(data.content || "[]");
          } catch {
            chapters = [];
          }
          const storyWithChapters: FanStory = {
            ...data,
            chapters,
          };
          setMangaData(storyWithChapters);
        } else {
          setMangaData(null);
        }
      }
      setLoading(false);
    };
    fetchManga();
  }, [mangaId]);

  if (loading) return <div className="p-8 text-center text-white">Loading manga...</div>;
  if (!mangaData) return <div className="p-8 text-center text-red-400">Manga not found.</div>;

  return (
    <MangaReaderPage
      mangaData={mangaData}
      onBack={() => router.back()}
    />
  );
} 