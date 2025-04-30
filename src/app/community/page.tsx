"use client";
import { ContentFeed } from "@/components/content-feed"
import { CommunitiesSidebar } from "@/components/communities-sidebar"
import { CommunityNavbar } from "@/components/communities-navbar"
import { RecentPosts } from "@/components/recent-posts"
import { TopNav } from "@/components/top-nav"
import Footer from "@/components/footer"
import { useState } from "react"

export default function Home() {
  const [selectedAnime, setSelectedAnime] = useState<string | null>(null)
  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
    <TopNav />
    <div className="h-1"></div>
    <div className="h-screen flex flex-col bg-[#121212] pt-3">
    <CommunityNavbar onSearch={setSelectedAnime} />
      <div className="flex flex-1 overflow-hidden">
        {" "}
        {/* Container for all scrollable areas */}
        <CommunitiesSidebar />
        <main className="flex-1">
        <ContentFeed selectedAnime={selectedAnime} />
        </main>
        <RecentPosts />
      </div>
    </div>
    <Footer />
    </div>
  )
}

