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
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Twitter, Github, Mail } from "lucide-react";

interface Anime {
  id: number
  title: string
  image_url: string
  avg_score: number
  tags?: string[]
  genres?: string[]
} 

const ANIME_BANNER_URL = "https://rhspkjpeyewjugifcvil.supabase.co/storage/v1/object/sign/animepagebg/Leonardo_Phoenix_10_Highresolution_cinematic_animestyle_hero_b_3.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2EwNWE5MzA2LTNiZGItNDliNC1hZGQ2LTFjMjEzNjhiYzcwMSJ9.eyJ1cmwiOiJhbmltZXBhZ2ViZy9MZW9uYXJkb19QaG9lbml4XzEwX0hpZ2hyZXNvbHV0aW9uX2NpbmVtYXRpY19hbmltZXN0eWxlX2hlcm9fYl8zLmpwZyIsImlhdCI6MTc0NzY2MjAwMywiZXhwIjoxNzc5MTk4MDAzfQ.hLX59XtwEW2FHByKn_5YqBlTB23Tjse5urv4q761b-k";

// Dummy data for tags and status
const STATUS = ["Completed", "Watching", "Planning"];

function getRandomStatus() {
  return STATUS[Math.floor(Math.random() * STATUS.length)];
}

interface AnimeCardProps {
  anime: Anime;
  userScore: number | string;
  status: string;
  onViewDetails: () => void;
  onTagClick: (tag: string) => void;
  selectedTag: string | null;
}

const AnimeCard = ({ anime, userScore, status, onViewDetails, onTagClick, selectedTag }: AnimeCardProps) => {
  // Combine tags and genres, deduplicate, and show up to 3
  const tagSet = new Set([...(anime.tags || []), ...(anime.genres || [])]);
  const tags = Array.from(tagSet).slice(0, 3);
  return (
    <Card className="bg-[#181828] border-zinc-800 shadow-lg hover:scale-[1.025] hover:shadow-xl transition-transform duration-200 relative flex flex-col">
      <button className="absolute top-3 left-3 z-10 bg-black/60 rounded-full p-1 hover:bg-pink-600 transition-colors"><Heart className="w-5 h-5 text-pink-400" /></button>
      <div className="relative w-full h-48 rounded-t-lg overflow-hidden">
        <Image src={anime.image_url || "/placeholder.svg"} alt={anime.title} fill className="object-cover" />
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-white truncate">{anime.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2 pb-2">
        {tags.map((tag) => (
          <Badge
            key={tag + anime.id}
            variant={selectedTag === tag ? "default" : "secondary"}
            className={`cursor-pointer hover:bg-purple-700 hover:text-white transition-colors ${selectedTag === tag ? "bg-purple-700 text-white" : ""}`}
            onClick={() => onTagClick(tag)}
          >
            #{tag}
          </Badge>
        ))}
      </CardContent>
      <CardContent className="flex flex-col gap-1 text-sm text-zinc-300 pb-2">
        <span>Your Score: <span className="font-semibold text-white">{userScore ?? "-"}</span></span>
        <span>
          <Badge variant="outline" className="bg-zinc-700 text-zinc-200 px-2 py-0.5 text-xs font-medium">{status}</Badge>
        </span>
      </CardContent>
      <CardFooter className="flex gap-2 mt-auto">
        <Button variant="outline" className="flex-1">Join Community</Button>
        <Button variant="secondary" className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white" onClick={onViewDetails}>View Details</Button>
      </CardFooter>
    </Card>
  );
};

interface AnimeSearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AnimeSearchBar = ({ value, onChange }: AnimeSearchBarProps) => (
  <div className="flex justify-center w-full py-8">
    <div className="relative w-full max-w-xl">
      <Input
        type="text"
        placeholder="Search anime..."
        value={value}
        onChange={onChange}
        className="pl-10 pr-4 py-3 bg-[#181828] border border-zinc-700 text-white rounded-lg shadow focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition-all placeholder:text-zinc-400"
      />
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
    </div>
  </div>
);

const AnimeBanner = () => (
  <section className="w-full relative h-[260px] md:h-[340px] flex items-end justify-center overflow-hidden">
    <Image src={ANIME_BANNER_URL} alt="Anime Banner" fill className="object-cover w-full h-full" priority />
    <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/90 flex flex-col items-center justify-center text-center px-4">
      <h1 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow-lg mb-2">FIND THE BEST ANIME FOR YOU</h1>
      <p className="text-zinc-300 mb-4">Take the quiz and discover what fits your vibe</p>
      <Link href="/quiz/find-anime">
        <Button className="px-8 py-3 text-lg font-bold bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg hover:scale-105 hover:shadow-pink-500/40 transition-transform">TRY NOW</Button>
      </Link>
    </div>
  </section>
);

const AnimeFooter = () => (
  <footer className="w-full py-8 bg-[#181828] border-t border-zinc-800 mt-12">
    <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 px-4">
      <div className="flex gap-4 text-zinc-400 text-sm mb-2 md:mb-0">
        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
        <span>|</span>
        <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
        <span>|</span>
        <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
      </div>
      <div className="flex gap-4 text-zinc-400">
        <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors"><Twitter /></a>
        <a href="https://github.com/" target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors"><Github /></a>
        <a href="mailto:info@yukumi.com" className="hover:text-pink-400 transition-colors"><Mail /></a>
      </div>
    </div>
  </footer>
);

const AnimeBrowser: React.FC = () => {
  const [animeList, setAnimeList] = useState<Anime[]>([])
  const [displayedAnime, setDisplayedAnime] = useState<Anime[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [favorites, setFavorites] = useState<Anime[]>([])
  const [userScores, setUserScores] = useState<Record<number, number>>({})
  const [userStatuses, setUserStatuses] = useState<Record<number, string>>({})
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const { user } = useAuth()

  useEffect(() => {
    fetchAnimeList()
  }, [])

  useEffect(() => {
    const start = (page - 1) * 50
    const end = start + 50
    let filtered = animeList
    if (searchQuery.trim()) {
      filtered = filtered.filter(anime =>
        anime.title?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    if (selectedTag) {
      filtered = [
        ...filtered.filter(anime =>
          [...(anime.tags || []), ...(anime.genres || [])].includes(selectedTag)
        ),
        ...filtered.filter(anime =>
          ![...(anime.tags || []), ...(anime.genres || [])].includes(selectedTag)
        ),
      ]
    }
    setDisplayedAnime(filtered.slice(start, end))
  }, [animeList, searchQuery, page, selectedTag])

  const fetchAnimeList = async () => {
    const { data, error } = await supabase.from("Anime").select("*, tags, genres").order("rank")
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
    <div className="min-h-screen bg-[#10101a] flex flex-col">
      <TopNav />
      <main className="flex-1 flex flex-col">
        <AnimeBanner />
        <AnimeSearchBar value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        {selectedTag && (
          <div className="max-w-7xl mx-auto w-full px-4 pb-2 flex items-center gap-2">
            <span className="text-zinc-300 text-sm">Filtering by tag:</span>
            <Badge variant="default" className="bg-purple-700 text-white">#{selectedTag}</Badge>
            <Button size="sm" variant="ghost" className="text-xs px-2 py-1" onClick={() => setSelectedTag(null)}>Clear</Button>
          </div>
        )}
        <section className="max-w-7xl mx-auto w-full px-4 pb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedAnime.length === 0 ? (
              <div className="col-span-full text-center text-zinc-400 py-16 text-lg">No anime found.</div>
            ) : (
              displayedAnime.map((anime) => (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  userScore={userScores[anime.id] ?? "-"}
                  status={userStatuses[anime.id] ?? getRandomStatus()}
                  onViewDetails={() => window.location.href = `/anime/${anime.id}`}
                  onTagClick={setSelectedTag}
                  selectedTag={selectedTag}
                />
              ))
            )}
          </div>
        </section>
      </main>
      <AnimeFooter />
    </div>
  );
}

export default AnimeBrowser