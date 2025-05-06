"use client"

import { X } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"

export function CommunitiesSidebar() {
  const [communities, setCommunities] = React.useState([
    "Solo Leveling",
    "Jujutsu Kaisen", 
    "Chainsaw Man",
    "Konosuba",
    "Demon Slayer",
    "One Piece",
    "Naruto",
    "Attack on Titan",
    "My Hero Academia",
    "Dragon Ball",
  ])

  const removeCommunity = (communityToRemove: string) => {
    setCommunities(communities.filter((community) => community !== communityToRemove))
  }

  return (
    <div className="w-[250px] border-r border-zinc-800 flex flex-col">
      <div className="h-[calc(100vh-104px)] mt-[104px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="px-4 pb-4">
          {communities.map((community) => (
            <div
              key={community}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-zinc-800/50 cursor-pointer group"
            >
              <span className="text-white text-sm">{community}</span>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100"
                onClick={() => removeCommunity(community)}
              >
                <X className="h-4 w-4 text-zinc-400" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

