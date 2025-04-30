"use client"

import Image from "next/image"
import Link from "next/link"
import { Search, ListPlus, Pause, X, Check, ChevronDown } from "lucide-react"
import { useState } from "react"
import { TopNav } from "@/components/top-nav" 

export default function AnimePage() {
  const [watchlistStatus, setWatchlistStatus] = useState<string | null>(null)

  const handleStatusChange = (newStatus: string) => {
    if (watchlistStatus === newStatus) {
      setWatchlistStatus(null)
    } else {
      setWatchlistStatus(newStatus)
    }
  } 

  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <TopNav />    
      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Column - Image and Streaming */}
          <div className="space-y-4">
            {/* Anime Image */}
            <div className="bg-white p-4 flex justify-center items-center h-[400px]">
              <div className="text-black text-center text-4xl font-bold">IMAGE</div>
            </div>

            {/* Join Community Button */}
            <button className="w-full py-3 bg-[#4f74c8] text-white font-medium rounded hover:bg-[#1c439b] transition-colors">
              JOIN COMMUNITY
            </button>

            {/* Streaming Platforms */}
            <div className="bg-[#f8f8f8] text-black p-4 rounded">
              <h3 className="font-bold mb-3">Streaming Platforms</h3>
              <div className="space-y-3">
                <Link
                  href="https://www.crunchyroll.com"
                  className="flex items-center space-x-2 hover:bg-gray-200 p-1 rounded"
                >
                  <div className="w-6 h-6 rounded-full bg-orange-500 flex items-center justify-center">
                    <span className="text-white text-xs">CR</span>
                  </div>
                  <span>Crunchyroll</span>
                </Link>

                <Link
                  href="https://www.netflix.com"
                  className="flex items-center space-x-2 hover:bg-gray-200 p-1 rounded"
                >
                  <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center">
                    <span className="text-white text-xs">N</span>
                  </div>
                  <span>Netflix</span>
                </Link>

                <button className="flex items-center text-[#1c439b] hover:underline">
                  <ChevronDown className="h-4 w-4 mr-1" />
                  <span>More services</span>
                </button>

                <p className="text-xs text-gray-500 mt-2">May be unavailable in your region.</p>
              </div>
            </div>
          </div>

          {/* Right Column - Anime Details */}
          <div className="md:col-span-3 space-y-4">
            {/* Title Section */}
            <div className="bg-white text-black p-6">
              <h1 className="text-3xl font-bold">NAME</h1>
            </div>

            {/* Stats Section */}
            <div className="bg-white text-black p-4">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                <div className="bg-[#4f74c8] text-white px-2 py-1 text-xs">
                  SCORE
                  <div className="text-xl font-bold">0.69</div>
                </div>

                <div>
                  Ranked <span className="font-bold">#69</span>
                </div>

                <div>
                  Popularity <span className="font-bold">#69</span>
                </div>

                <div>
                  COMMUNITY Members <span className="font-bold">1,056,330</span>
                </div>

                <div className="text-sm text-gray-500 border-l pl-4 ml-2">year of release</div>
              </div>
            </div>

            {/* Actions Section */}
            <div className="bg-white p-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusChange("list")}
                  className={`flex items-center px-3 py-1.5 rounded text-sm ${
                    watchlistStatus === "list"
                      ? "bg-[#1c439b] text-white"
                      : "bg-[#f8f8f8] text-[#323232] hover:bg-gray-300"
                  }`}
                >
                  <ListPlus className="h-4 w-4 mr-2" />
                  Add to My List
                </button>

                <button
                  onClick={() => handleStatusChange("on-hold")}
                  className={`flex items-center px-3 py-1.5 rounded text-sm ${
                    watchlistStatus === "on-hold"
                      ? "bg-[#1c439b] text-white"
                      : "bg-[#f8f8f8] text-[#323232] hover:bg-gray-300"
                  }`}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  ON-HOLD
                </button>

                <button
                  onClick={() => handleStatusChange("dropped")}
                  className={`flex items-center px-3 py-1.5 rounded text-sm ${
                    watchlistStatus === "dropped"
                      ? "bg-[#1c439b] text-white"
                      : "bg-[#f8f8f8] text-[#323232] hover:bg-gray-300"
                  }`}
                >
                  <X className="h-4 w-4 mr-2" />
                  DROPPED
                </button>

                <button
                  onClick={() => handleStatusChange("completed")}
                  className={`flex items-center px-3 py-1.5 rounded text-sm ${
                    watchlistStatus === "completed"
                      ? "bg-[#1c439b] text-white"
                      : "bg-[#f8f8f8] text-[#323232] hover:bg-gray-300"
                  }`}
                >
                  <Check className="h-4 w-4 mr-2" />
                  COMPLETED
                </button>
              </div>
            </div>

            {/* Details Section */}
            <div className="bg-white text-black p-6 min-h-[300px] flex items-center justify-center">
              <h2 className="text-4xl font-bold">MORE DETAILS</h2>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

