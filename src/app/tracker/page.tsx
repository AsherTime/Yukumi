"use client";
import { TopNav } from "@/components/top-nav"
import Footer from "@/components/footer"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation";
import * as Tooltip from "@radix-ui/react-tooltip"
import { getAuth, onAuthStateChanged, User, setPersistence, browserLocalPersistence } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface StatsData {
  watching: number
  completed: number
  onHold: number
  dropped: number
  planToWatch: number
}

export default function Page() {
  type AnimeStatus = "ALL ANIME" | "Watching" | "Completed" | "On-Hold" | "Dropped" | "Planning"

  type FavAnime = {
    id: number;
    title?: string;
    image_url: string;
  };

  const { user } = useAuth();
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);
  const [favoriteAnimeList, setFavoriteAnimeList] = useState<FavAnime[]>([]);
  const [activeTab, setActiveTab] = useState("ALL ANIME");
  const [activeStatusKey, setActiveStatusKey] = useState<string | null>(null);
  const [userAnime, setUserAnime] = useState<any[]>([]);
  const [userAnimeDetails, setUserAnimeDetails] = useState<Record<string, any>>({});

  const statusColors = {
    watching: {
      color: "#074e06",
      label: "Watching",
      hover: "hover:bg-[#074e06]/80",
    },
    completed: {
      color: "#ff7f27",
      label: "Completed",
      hover: "hover:bg-[#ff7f27]/80",
    },
    onHold: {
      color: "#c3b705",
      label: "On Hold",
      hover: "hover:bg-[#c3b705]/80",
    },
    dropped: {
      color: "#ee0c0c",
      label: "Dropped",
      hover: "hover:bg-[#ee0c0c]/80",
    },
    planToWatch: {
      color: "#847f7c",
      label: "Planning",
      hover: "hover:bg-[#847f7c]/80",
    },
  }
  const filteredAnime = activeTab === "ALL ANIME" ? userAnime : userAnime.filter((anime) => anime.status === activeTab);
  const Episodes = userAnime.reduce((sum, anime) => sum + (anime.progress || 0), 0);
  const Days = parseFloat((Episodes / 60).toFixed(1));
  const totalScore = userAnime.reduce((sum, anime) => sum + (anime.score || 0), 0);
  const Mean = userAnime.length > 0 ? parseFloat((totalScore / userAnime.length).toFixed(2)) : 0;
  const stats: StatsData = {
    watching: userAnime.filter((anime) => anime.status === "Watching").length,
    completed: userAnime.filter((anime) => anime.status === "Completed").length,
    onHold: userAnime.filter((anime) => anime.status === "On-Hold").length,
    dropped: userAnime.filter((anime) => anime.status === "Dropped").length,
    planToWatch: userAnime.filter((anime) => anime.status === "Planning").length,
  };
  const total = Object.values(stats).reduce((acc, curr) => acc + curr, 0)

  const handleStatusClick = (status: keyof StatsData) => {
    const statusMap = {
      watching: "Watching",
      completed: "Completed",
      onHold: "On-Hold",
      dropped: "Dropped",
      planToWatch: "Planning",
    }
    setActiveTab(statusMap[status]);
    setActiveStatusKey(status);
  }

  useEffect(() => {
    const fetchProfilePic = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("Profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile picture:", error.message);
      } else {
        setProfilePicUrl(data.avatar_url);
      }
    };

    fetchProfilePic();
  }, [user?.id]);

  useEffect(() => {
    const fetchFavoriteAnime = async () => {
      if (!user?.id) {
        console.log("No user ID available");
        return;
      }
      
      console.log("Starting fetchFavoriteAnime with user ID:", user.id);
      
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
        return;
      }

      if (!session) {
        console.error("No active session found");
        return;
      }

      if (!session.access_token) {
        console.error("No access token in session");
        return;
      }

      console.log("Session and token available, attempting fetch...");

      try {
        const requestBody = { user_id: user.id };
        console.log("Request body:", requestBody);
        
        const response = await fetch("https://rhspkjpeyewjugifcvil.supabase.co/functions/v1/get-favourite-anime", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestBody),
          mode: 'cors',
          credentials: 'omit'
        });

        console.log("Response received:", {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries())
        });

        if (!response.ok) {
          let errorText;
          try {
            errorText = await response.text();
            console.log("Error response text:", errorText);
          } catch (e) {
            errorText = "Could not read error response";
            console.error("Error reading response:", e);
          }

          console.error("Failed to fetch favorites:", {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            headers: Object.fromEntries(response.headers.entries()),
            requestBody: requestBody,
            hasToken: !!session.access_token,
            tokenLength: session.access_token?.length
          });
          return;
        }

        let data;
        try {
          data = await response.json();
          console.log("Response data:", data);
        } catch (e) {
          console.error("Error parsing JSON response:", e);
          return;
        }

        if (!Array.isArray(data)) {
          console.error("Invalid response format:", {
            received: typeof data,
            data: data
          });
          return;
        }

        const validAnimeList = data.filter((anime: any) => anime.image_url);
        console.log("Processed anime list:", validAnimeList);
        setFavoriteAnimeList(validAnimeList);
      } catch (err) {
        console.error("Error fetching favorites:", {
          error: err,
          message: err instanceof Error ? err.message : 'Unknown error',
          stack: err instanceof Error ? err.stack : undefined,
          user_id: user.id,
          has_session: !!session,
          has_token: !!session?.access_token,
          token_length: session?.access_token?.length
        });
      }
    };

    fetchFavoriteAnime();
  }, [user?.id]);

  useEffect(() => {
    const fetchUserAnime = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("UserAnime")
        .select("*")
        .eq("user_id", user.id);
      if (error) {
        console.error("Error fetching UserAnime:", error.message);
        return;
      }
      const sortedData = [...data].sort((a, b) => b.id - a.id);
      setUserAnime(sortedData);
      // Fetch associated anime details
      const animeIds = sortedData.map((entry) => entry.anime_id);
      const { data: animeDetails, error: animeError } = await supabase
        .from("Anime")
        .select("id, title, image_url, type")
        .in("id", animeIds);

      if (animeError) {
        console.error("Error fetching Anime details:", animeError.message);
      } else {
        const detailsMap: Record<string, any> = {};
        animeDetails.forEach((anime) => {
          detailsMap[anime.id] = anime;
        });
        setUserAnimeDetails(detailsMap);
      }
    };

    fetchUserAnime();
  }, [user?.id]);



  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <TopNav />
      <div className="w-10"></div> {/* Adds horizontal space */}
      <div className="min-h-screen bg-black text-white p-6">
        {/* Profile Section */}
        <div className="bg-white/5 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-6">
            <div className="relative w-24 h-24">
              <Image
                src={profilePicUrl || "https://res.cloudinary.com/difdc39kr/image/upload/v1742924882/DisplayPicture/vrhljafkwcbkc9wp5hws.jpg"}
                alt="Profile Picture"
                fill
                sizes="96px"
                className="object-cover rounded-full"
                priority
              />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-4">Favourites</h2>
              <div className="flex gap-4 flex-wrap">
                {favoriteAnimeList?.length > 0 ? (
                  favoriteAnimeList.map((anime) =>
                    anime && anime.image_url ? (
                      <div key={anime.id} className="relative w-20 h-28">
                        <Image
                          src={anime.image_url}
                          alt={anime.title || `Anime ${anime.id}`}
                          fill
                          sizes="(max-width: 768px) 100vw,(max-width: 1200px) 50vw, 33vw"
                          className="rounded-md object-cover"
                          priority
                        />
                      </div>
                    ) : null // ✅ Skip undefined or incomplete data
                  )
                ) : (
                  <p>No favorites selected yet.</p>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white/5 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-400">Days:</div>
              <div className="font-bold">{Days}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Mean Score:</div>
              <div className="font-bold">{Mean}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Total Entries:</div>
              <div className="font-bold">{total}</div>
            </div>
            <div>
              <div className="text-sm text-gray-400">Episodes:</div>
              <div className="font-bold">{Episodes}</div>
            </div>
          </div>

          {/* Interactive Stats Bar */}
          <div className="relative h-8 mb-8">
            <div className="absolute inset-0 flex rounded-md overflow-hidden">
              {(Object.keys(stats) as Array<keyof StatsData>).map((status) => {
                const count = stats[status]
                const percentage = (count / total) * 100
                const config = statusColors[status]

                return (
                  <Tooltip.Provider key={status}>
                    <Tooltip.Root>
                      <Tooltip.Trigger asChild>
                        <button
                          className={`h-full transition-all duration-200 ${activeTab === statusColors[status].label.toUpperCase() ? "opacity-80" : ""
                            } ${config.hover}`}
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: config.color,
                          }}
                          onClick={() => handleStatusClick(status)}
                        />
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content className="bg-black/90 text-white px-3 py-2 rounded-md text-sm" sideOffset={5}>
                          <div className="font-medium">{config.label}</div>
                          <div className="text-gray-300">
                            {count} {count === 1 ? "series" : "series"}
                          </div>
                          <div className="text-gray-400">{percentage.toFixed(1)}%</div>
                          <Tooltip.Arrow className="fill-black/90" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                )
              })}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {["ALL ANIME", "Watching", "Completed", "On-Hold", "Dropped", "Planning"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as AnimeStatus)}
                className={`px-4 py-2 rounded whitespace-nowrap ${activeTab === tab ? "bg-white/20" : "bg-white/5 hover:bg-white/10"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Anime List Table */}
        <div className="bg-white/5 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10">
                <tr>
                  <th className="py-3 px-4 text-left w-10">#</th>
                  <th className="py-3 px-4 text-left w-[300px]">Title</th>
                  <th className="py-3 px-4 text-right w-16">Score</th>
                  <th className="py-3 px-4 text-left w-24">Type</th>
                  <th className="py-3 px-4 text-right w-24">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAnime.map((anime, index) => (
                  <tr key={anime.id} className="hover:bg-white/5">
                    <td className="py-3 px-4">{index + 1}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-[40px] h-[60px]">
                          <Image
                            src={userAnimeDetails?.[anime.anime_id]?.image_url || "/placeholder.svg"}
                            alt={userAnimeDetails?.[anime.anime_id]?.title || `Anime ${anime.anime_id}`}
                            fill
                            sizes="96px"
                            className="rounded object-cover"
                          />
                        </div>
                        <span>{userAnimeDetails?.[anime.anime_id]?.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">{anime.score || "-"}</td>
                    <td className="py-3 px-4">{userAnimeDetails?.[anime.anime_id]?.type || `Anime ${anime.anime_id}`}</td>
                    <td className="py-3 px-4 text-right">{anime.progress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

