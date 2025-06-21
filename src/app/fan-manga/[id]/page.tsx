"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MangaReaderPage from "../page";

export default function FanMangaReadPage() {
  const router = useRouter();
  const params = useParams();
  const mangaId = params?.id as string;
  const [mangaData, setMangaData] = useState<any>(null);
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
  }, [params]);


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
        let chapters = [];
        try {
          chapters = JSON.parse(data.content || "[]");
        } catch {
          chapters = [];
        }
        setMangaData({
          ...data,
          chapters,
        });
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