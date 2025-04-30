"use client"

import React, { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { TopNav } from "./top-nav"

export function CommunityNavbar({ onSearch }: { onSearch: (anime: string) => void }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Fetch anime names from Xano based on searchTerm
  useEffect(() => {
    const fetchAnimeList = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([])
        return
      }

      try {
        const response = await fetch(`https://x8ki-letl-twmt.n7.xano.io/api:8BJgb0Hk/animes1/${searchTerm}`)
        const data = await response.json()
        setSearchResults(data.map((anime: { name: string }) => anime.name)) // Assuming API returns anime objects with a "name" field
      } catch (error) {
        console.error("Error fetching anime list:", error)
      }
    }

    fetchAnimeList()
  }, [searchTerm])

  const handleSearchSelect = (anime: string) => {
    setSelectedTags((prevTags) => [...new Set([...prevTags, anime])])
    onSearch(anime) // Notify ContentFeed of the selected anime
    setSearchTerm("") // Clear search input
    setSearchResults([]) // Clear suggestions
  }

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove))
  }

  return (
    <div className="z-50 w-full bg-[#121212] border-b border-zinc-800">
      <div className="px-4 pb-4 pt-4">
        <div className="relative">
          <Input
            type="search"
            placeholder="Search Communities"
            className="w-[300px] bg-zinc-900 border-zinc-700 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          {searchResults.length > 0 && (
            <ul className="absolute left-0 mt-2 w-[300px] bg-zinc-900 border border-zinc-700 rounded-md shadow-lg text-white">
              {searchResults.map((anime) => (
                <li
                  key={anime}
                  className="px-3 py-2 hover:bg-zinc-800 cursor-pointer"
                  onClick={() => handleSearchSelect(anime)}
                >
                  {anime}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <div key={tag} className="flex items-center gap-1 rounded-full bg-zinc-800 px-3 py-1">
              <span className="text-sm text-white">{tag}</span>
              <button onClick={() => removeTag(tag)} className="ml-1 rounded-full text-zinc-400 hover:text-white">
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
