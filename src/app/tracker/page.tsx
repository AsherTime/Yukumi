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




type AnimeStatus = "ALL ANIME" | "Currently Watching" | "Completed" | "On-Hold" | "Dropped" | "Plan to Watch"

interface Anime{ 
  id: number
  user_id: number
  animes1_id: number
  status: Exclude<AnimeStatus, "ALL ANIME">
  progress: number
  score: number
}

interface UserEntry {
  id: number
  created_at: string
  firebase_uid: string
  username: string
  picture_url: string
  auth_provider: string
  display_name: string
  gender: string[]
  country: string
  age: number
  favourites: number[]
}

interface FavAnime {
  id: number
created_at: string
image_url: string
title: string
Type: string
episodes: number
aired_from: string
aired_to: string
Genres: string[]
avg_score: number
rank: number
popularity: number
members: number
}

interface StatsData {
  watching: number
  completed: number
  onHold: number
  dropped: number
  planToWatch: number
}

export default function Page() {
  const [activeTab, setActiveTab] = useState("ALL ANIME");
const [activeStatusKey, setActiveStatusKey] = useState<string | null>(null);


  
  
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
        label: "Plan to Watch",
        hover: "hover:bg-[#847f7c]/80",
      },
    }
  
    
  
    const handleStatusClick = (status: keyof StatsData) => {
      const statusMap = {
        watching: "Currently Watching",
        completed: "Completed",
        onHold: "On-Hold",
        dropped: "Dropped",
        planToWatch: "Plan to Watch",
      }
      setActiveTab(statusMap[status]);
      setActiveStatusKey(status);
    }
  
    








    
    const [error, setError] = useState<string | null>(null);
    const [userAnime, setUserAnime] = useState<Anime[]>([]); // User's anime
    const [animeIds, setAnimeIds] = useState<number[]>([]);
    const [page, setPage] = useState(1);
    const [firebase_uid, setFirebase_uid] = useState<string | null>(null);
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [favoriteAnimes, setFavoriteAnimes] = useState<FavAnime[]>([]);
    const [userData, setUserData] = useState<UserEntry | null>(null);
    const { user, loading } = useAuth();
    const router = useRouter();
    const [debouncedUserData, setDebouncedUserData] = useState(userData);

    

  
useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push("/auth/login-page"); // Redirect if not logged in
        } else {
          setFirebase_uid(user.uid); // Update firebase_uid when user is set
        }
      }
}, [user, loading, router]);

//START FETCHING USER DATA HERE

const fetchUserData = async() => {
      try{
      const response = await fetch("https://x8ki-letl-twmt.n7.xano.io/api:hRCl8Tp6/users", {
        method: "POST",
        headers: {
          "Content-Type" : "application/json",
        },
        body : JSON.stringify({ firebase_uid: firebase_uid }),
          });
      const data = await response.json();
      const response2 = await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:hRCl8Tp6/users/${data}`);
      const data2 = await response2.json();      
      setUserData(data2);  
      return data2;    
    }
      catch (error) {
          console.error("Error fetching user anime:", error);
      }
};

const { data: userDetails, error: userQueryError, isLoading: isUserLoading,} = useQuery({
  queryKey: ["userDetails", firebase_uid],
  queryFn: () => {
    if (!firebase_uid) return Promise.resolve(null); 
    return fetchUserData(); 
  },
  enabled: !!firebase_uid,
  staleTime: 1000 * 60 * 1, // 1 minute before refetch is triggered
  gcTime: 1000 * 60 * 2,    // Cache garbage collected after 2 minutes unused
  retry: 3,
  retryDelay: attempt => Math.min(1000 * 2 ** attempt, 30000),
});

//END FETCHING USER DATA HERE
        
// START FETCHING USER ANIME DATA HERE
const fetchAnimeDetails = async (userData: UserEntry) => {
  if (!userData?.favourites || userData.favourites.length === 0) return [];
  try {
    const response = await fetch(
      `https://x8ki-letl-twmt.n7.xano.io/api:8BJgb0Hk/fetchanimedata/getFavourites`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anime_ids: userData.favourites }),
      }
    );
    const extractedData = await response.json();
    //console.log(extractedData); // Log the extracted data
    return extractedData; // Return the data
  } catch (error) {
    console.error("Error fetching favorite anime details:", error);
    return []; // Return an empty array in case of an error
  }
};


const { data: favoriteAnimeList, error: queryError, isLoading } = useQuery({
  queryKey: ["favoriteAnimes", firebase_uid],
  queryFn: () => {
    if (!userData) return Promise.resolve(null); 
    return fetchAnimeDetails(userData); 
  },
  enabled: !!userData,
  staleTime: 1000 * 60 * 1,
  gcTime: 1000 * 60 * 2,
  retry: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
});

//END FETCHING USER ANIME DATA HERE

useEffect(() => {
  if (userDetails && firebase_uid) {
    localStorage.setItem(`userDetails_${firebase_uid}`, JSON.stringify(userDetails));
  }
  if (favoriteAnimeList && firebase_uid) {
    localStorage.setItem(`favoriteAnimes_${firebase_uid}`, JSON.stringify(favoriteAnimeList));
  }
}, [userDetails, firebase_uid, favoriteAnimeList]);


        
    
const filteredAnime = activeTab === "ALL ANIME" ? userAnime : userAnime.filter((anime) => anime.status === activeTab);
const Episodes = userAnime.reduce((sum, anime) => sum + (anime.progress || 0), 0);
const Days = parseFloat((Episodes / 60).toFixed(1));
const totalScore = userAnime.reduce((sum, anime) => sum + (anime.score || 0), 0);
const Mean = userAnime.length > 0 ? parseFloat((totalScore / userAnime.length).toFixed(2)) : 0;
const stats: StatsData = {
      watching: userAnime.filter((anime) => anime.status === "Currently Watching").length,
      completed: userAnime.filter((anime) => anime.status === "Completed").length,
      onHold: userAnime.filter((anime) => anime.status === "On-Hold").length,
      dropped: userAnime.filter((anime) => anime.status === "Dropped").length,
      planToWatch: userAnime.filter((anime) => anime.status === "Plan to Watch").length,
  };
const total = Object.values(stats).reduce((acc, curr) => acc + curr, 0)




const fetchUserAnimeData = async (firebase_uid: string) => {
      const response = await fetch(
        "https://x8ki-letl-twmt.n7.xano.io/api:P5mUuktq/fullList",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ firebaseUid: firebase_uid }),
        }
      );
    
      if (!response.ok) {
        throw new Error("Failed to fetch user anime");
      }
    
      const userAnimeData = await response.json();
      const SortedData = userAnimeData.sort((a: Anime, b: Anime) => b.id - a.id);
      console.log(SortedData); // Log the sorted data
      return SortedData;  // Return sorted data for caching
};


const { data: userAnimeData, error: queryError2, isLoading: queryLoading } = useQuery({
      queryKey: ['userAnime', firebase_uid],
      queryFn: () => {
        if (!firebase_uid) return Promise.resolve(null); 
        return fetchUserAnimeData(firebase_uid); 
      },
      enabled: !!firebase_uid,
      staleTime: 1000 * 60 * 1,
      gcTime: 1000 * 60 * 2,
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    });
    
    // 🔹 Store the anime IDs separately
    useEffect(() => {
      if (userAnimeData) {
        setUserAnime(userAnimeData);
        const ids = userAnimeData.map((entry: { animes1_id: number }) => entry.animes1_id);
        setAnimeIds(ids);
        localStorage.setItem(`userAnimeIds_${firebase_uid}`, JSON.stringify(ids));
      }
    }, [userAnimeData, firebase_uid]);
    
    
    
    // Fetch anime details based on animeIds
    const { data: animeDetails, error: animeError, isLoading: isAnimeLoading } = useQuery({
      queryKey: ["animeDetails", animeIds],
      queryFn: async () => {
        console.log(animeIds);
        if (!animeIds || animeIds.length === 0) return null; // ✅ Prevents API call when animeIds is empty

    // 🔹 Attempt to fetch from local storage
    const storageKey = `animeDetails_${animeIds.join(",")}`;
    const cachedData = localStorage.getItem(storageKey);
if (cachedData) {
  try {
    const parsed = JSON.parse(cachedData); // parsed is an array
    const mappedData: Record<number, { image_url: string; title: string; type: string }> = {};
    parsed.forEach((entry: any) => {
      mappedData[entry.id] = {
        image_url: entry.image_url,
        title: entry.title,
        type: entry.Type,
      };
    });
    return mappedData; // ✅ Now consistent with your expected return type
  } catch (error) {
    console.error("Failed to parse and map local storage data:", error);
  }
}


    // 🔹 No cache? Fetch fresh data
    const response = await fetch("https://x8ki-letl-twmt.n7.xano.io/api:8BJgb0Hk/fetchanimeData/userAnime", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: animeIds }),
    });

    if (!response.ok) throw new Error("Failed to fetch anime details");

    const animeDetailsData = await response.json();
    // 🔹 Format API response
    const animeDetailsMap: Record<number, { image_url: string; title: string; type: string }> = {};
    animeDetailsData.forEach((entry: { id: number; image_url: string; title: string; Type: string }) => {
      animeDetailsMap[entry.id] = {
        image_url: entry.image_url,
        title: entry.title,
        type: entry.Type,
      };
    });

    // 🔹 Save fetched data to local storage
    localStorage.setItem(storageKey, JSON.stringify(animeDetailsMap));
    return animeDetailsMap;
  },
      enabled: !!animeIds?.length,
      staleTime: 1000 * 60 * 1, // Cache data for 10 minutes
      gcTime: 1000 * 60 * 2, // Remove unused data after 30 minutes
      retry: 3,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    });
    
    
    if (loading) return <p>Loading...</p>;
//JSX STARTS HERE
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
    src="https://res.cloudinary.com/difdc39kr/image/upload/v1742924882/DisplayPicture/vrhljafkwcbkc9wp5hws.jpg"
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
  favoriteAnimeList.map((anime: FavAnime) =>
    anime && anime.image_url ? (
      <div key={anime.id} className="relative w-20 h-28">
        <Image
          src={anime.image_url}
          alt={anime.title || `Anime ${anime.id}`}
          fill
          sizes="(max-width: 768px) 100vw,
         (max-width: 1200px) 50vw,
         33vw"
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
                        className={`h-full transition-all duration-200 ${
                          activeTab === statusColors[status].label.toUpperCase() ? "opacity-80" : ""
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
          {["ALL ANIME", "Currently Watching", "Completed", "On-Hold", "Dropped", "Plan to Watch"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as AnimeStatus)}
              className={`px-4 py-2 rounded whitespace-nowrap ${
                activeTab === tab ? "bg-white/20" : "bg-white/5 hover:bg-white/10"
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
                      <Image
                        src={animeDetails?.[anime.animes1_id]?.image_url || "/placeholder.svg"}
                        alt={animeDetails?.[anime.animes1_id]?.title || `Anime ${anime.animes1_id}`}
                        width={40}
                        height={60}
                        className="rounded"
                      />
                      <span>{animeDetails?.[anime.animes1_id]?.title }</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">{anime.score || "-"}</td>
                  <td className="py-3 px-4">{animeDetails?.[anime.animes1_id]?.type || `Anime ${anime.animes1_id}`}</td>
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

