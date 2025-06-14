"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

interface Manga {
  id: string;
  user_id: string;
  title: string;
  synopsis: string;
  content: string;
  tags: string;
  cover_image_url: string;
  created_at: string;
  updated_at: string;
  status: string;
  views: number;
}

export function MangaFeed() {
  const [mangas, setMangas] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMangas = async () => {
      try {
        console.log("Starting to fetch mangas...");
        const { data, error } = await supabase
          .from("fan_stories")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching mangas:", error);
          return;
        }

        console.log("Raw manga data:", data);
        if (!data || data.length === 0) {
          console.log("No mangas found in the database");
        } else {
          console.log(`Found ${data.length} mangas`);
          data.forEach((manga, index) => {
            console.log(`Manga ${index + 1}:`, {
              id: manga.id,
              title: manga.title,
              status: manga.status,
              created_at: manga.created_at
            });
          });
        }

        setMangas(data || []);
      } catch (error) {
        console.error("Error in fetchMangas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMangas();
  }, []);

  if (loading) {
    return <div className="text-center text-white py-8">Loading mangas...</div>;
  }

  if (mangas.length === 0) {
    return <div className="text-center text-white py-8">No manga stories found.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-white mb-6">Latest Manga Stories</h2>
      <div className="space-y-6">
        {mangas.map((manga) => (
          <Link
            href={`/fan-manga/${manga.id}`}
            key={manga.id}
            className="block bg-white/10 backdrop-blur-md rounded-lg overflow-hidden hover:bg-white/20 transition-all"
          >
            <div className="p-4">
              <div className="flex items-start gap-4">
                <div className="relative w-24 h-32 flex-shrink-0">
                  {manga.cover_image_url ? (
                    <Image
                      src={manga.cover_image_url}
                      alt={manga.title}
                      fill
                      className="object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 rounded-md flex items-center justify-center">
                      <span className="text-gray-400">No Cover</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{manga.title}</h3>
                  {manga.synopsis ?
                  (<div
                    className="text-gray-300 text-sm prose"
                    dangerouslySetInnerHTML={{ __html: manga.synopsis }}
                  />) : <div className='text-gray-300 text-sm prose'>No synopsis available</div>
                  }
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-400">
                    <span>👁️ {manga.views || 0} views</span>
                    <span>📅 {new Date(manga.created_at).toLocaleDateString()}</span>
                    <span className="ml-auto text-xs bg-gray-700/50 px-2 py-1 rounded-full capitalize">{manga.status}</span>
                  </div>
                  {Array.isArray(manga.tags) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {manga.tags.map((tag, index) => (
                        <span key={index} className="text-xs bg-gray-800/50 px-2 py-1 rounded-full text-gray-300">
                          #{tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
} 