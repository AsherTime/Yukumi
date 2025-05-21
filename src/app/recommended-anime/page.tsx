"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "@/hooks/useUser";
import { Loader2 } from "lucide-react";
import styles from "./styles.module.css";

interface Anime {
  id: string;
  title: string;
  image_url: string;
  genres: string[];
  synopsis: string;
}

const RecommendedAnimePage = () => {
  const [recommendations, setRecommendations] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.functions.invoke(
          "anime-recommendation",
          {
            body: { user_id: user?.id },
          }
        );

        if (error) {
          console.error("Error fetching recommendations:", error);
          setError("Failed to fetch recommendations");
          return;
        }

        if (data?.recommendations) {
          setRecommendations(data.recommendations);
        }
      } catch (err) {
        console.error("Error:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchRecommendations();
    }
  }, [user?.id]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black flex items-center justify-center">
        <p className="text-white text-xl">Please login to see recommendations</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Your Anime Recommendations
        </h1>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 text-white animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400 p-4 rounded-lg bg-red-900/20">
            {error}
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center text-gray-400 p-4">
            No recommendations available yet. Try taking the quiz first!
          </div>
        ) : (
          <div className={styles.cardContainer}>
            <div className={`overflow-x-auto ${styles.scrollbarHide}`}>
              <div className="flex space-x-6 p-4 min-w-full">
                {recommendations.map((anime) => (
                  <div
                    key={anime.id}
                    className="flex-none w-72 bg-gray-900/60 backdrop-blur-sm rounded-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
                  >
                    <div className="relative h-96 w-full">
                      <img
                        src={anime.image_url}
                        alt={anime.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-0 p-4 w-full">
                        <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
                          {anime.title}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {anime.genres?.slice(0, 3).map((genre, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs rounded-full bg-red-500/30 text-red-200"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendedAnimePage; 