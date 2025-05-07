"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Search, Heart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { TopNav } from "@/components/top-nav";
import Footer from "@/components/footer"
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase"

interface Anime {
  id: number
  title: string
  image_url: string
  avg_score: number
} 

const AnimeBrowser: React.FC = () => {
  const [animeList, setAnimeList] = useState<Anime[]>([])
  const [displayedAnime, setDisplayedAnime] = useState<Anime[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [favorites, setFavorites] = useState<Anime[]>([])
  const [userScores, setUserScores] = useState<Record<number, number>>({})
  const [userStatuses, setUserStatuses] = useState<Record<number, string>>({})

  const { user } = useAuth()

  useEffect(() => {
    fetchAnimeList()
  }, [])

  useEffect(() => {
    const start = (page - 1) * 50
    const end = start + 50
    // If searchQuery is empty, just show paginated animeList
  if (!searchQuery.trim()) {
    console.log(animeList.slice(start, end)); 
    setDisplayedAnime(animeList.slice(start, end));
    return;
  }

  // Filter based on search query
  const filtered = animeList.filter(anime =>
    anime.title?.toLowerCase().includes(searchQuery.toLowerCase())
  ); 

  // If there are no results, fall back to full list for current page
  if (filtered.length === 0) {
    setDisplayedAnime(animeList.slice(start, end));
  } else {
    setDisplayedAnime(filtered.slice(start, end));
  }
  }, [animeList, searchQuery, page])

  const fetchAnimeList = async () => {
    const { data, error } = await supabase.from("Anime").select("*").order("rank")
    if (error) console.error("Failed to fetch anime list:", error)
    else setAnimeList(data || [])
  }

  const loadNextPage = () => {
    setPage((prev) => prev + 1)
  }

  const loadPreviousPage = () => {
    setPage((prev) => Math.max(1, prev - 1))
  }

  const toggleFavorite = (animeId: number) => {
    const alreadyFavorite = favorites.some(f => f.id === animeId)
    if (alreadyFavorite) {
      setFavorites(favorites.filter(f => f.id !== animeId))
    } else {
      const anime = animeList.find(a => a.id === animeId)
      if (anime) setFavorites([...favorites, anime])
    }
  }

  // Fetch user-specific scores and statuses if logged in
  useEffect(() => {
    if (!user) return

    const fetchUserData = async () => {
      const { data, error } = await supabase
        .from("UserAnime")
        .select("anime_id, score, status")
        .eq("user_id", user.id)

      if (data) {
        //console.log(data);
        const scores: Record<string, number> = {}
        const statuses: Record<string, string> = {}
        data.forEach((entry) => {
          scores[entry.anime_id] = entry.score
          statuses[entry.anime_id] = entry.status
        })
        //console.log(scores, statuses);
        setUserScores(scores)
        setUserStatuses(statuses)
      }

      if (error) {
        console.error("Failed to fetch user scores/statuses:", error)
      }
    }

    fetchUserData()
  }, [user])

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <TopNav />

      {/* Hero Section */}
      <div className="text-center space-y-8 relative py-20">
        <h1 className="text-4xl md:text-6xl font-bold text-white">FIND THE BEST ANIME FOR YOU</h1>
        <Link href="/quiz/find-anime">
          <Button className="bg-[#B624FF] hover:bg-[#B624FF]/80 text-white px-8 py-6 text-xl h-auto">
            TRY NOW
          </Button>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center mb-4">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search anime..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-500 rounded-md bg-black text-white"
          />
        </div>
      </div>

      {/* Anime List */}
      <div className="anime-list-container overflow-auto rounded-lg border border-white/10 bg-card">
        <table className="w-full anime-table">
          <thead>
            <tr className="bg-black/20">
              <th className="p-4 text-left">Number</th>
              <th className="p-4 text-center">Anime Title</th>
              <th className="p-4 text-center">Score</th>
              <th className="p-4 text-center">Your Score</th>
              <th className="p-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {displayedAnime.map((anime) => (
              <tr key={anime.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="p-4">
                  <div className="flex items-center gap-4">
                  <div className="relative w-[60px] h-[80px]">
                    <Image
                      src={anime.image_url || "/placeholder.svg"}
                      alt={anime.title}
                      fill
                      sizes="(max-width: 768px) 40px, (max-width: 1200px) 60px, 80px"
                      className="rounded object-contain"
                    />
                  </div>

                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {/* Clickable Link to Anime Detail Page */}
                    <Link href={`/anime/${anime.id}`} className="font-medium text-blue-400 hover:underline">
                      {anime.title}
                    </Link>
                    <button onClick={() => toggleFavorite(anime.id)} className="text-red-500 hover:text-red-400">
                      <Heart className={`w-4 h-4 ${favorites.some(fav => fav.id === anime.id) ? "fill-current" : ""}`} />
                    </button>
                  </div>
                </td>
                <td>{anime.avg_score?.toFixed(2) || "-"}</td>
                <td>{user ? userScores[anime.id] ?? "-" : "-"}</td>
                <td>{user ? userStatuses[anime.id] ?? "-" : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center mt-4 gap-4">
        <button
          onClick={loadPreviousPage}
          disabled={page === 1}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-300"
        >
          Previous 50
        </button>

        <button
          onClick={loadNextPage}
          disabled={page * 50 >= animeList.length}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-orange-600 disabled:bg-gray-300"
        >
          Next 50
        </button>
      </div>
      <Footer />
    </div>
  );
}

export default AnimeBrowser