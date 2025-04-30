"use client"

import { X } from "lucide-react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "@/components/ui/search" // Import the Search component

interface Tag {
  id: string
  name: string
}

export function SearchBar() {
  const [tags, setTags] = React.useState<Tag[]>([
    { id: "1", name: "Solo Leveling" },
    { id: "2", name: "Jujutsu Kaisen" },
    { id: "3", name: "Chainsaw Man" },
    { id: "4", name: "Konosuba" },
    { id: "5", name: "Demon Slayer" },
  ])

  const removeTag = (id: string) => {
    setTags(tags.filter((tag) => tag.id !== id))
  }

  return (
    <div className="relative w-full max-w-2xl">
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Input type="search" placeholder="Search Communities" className="pl-8 text-sm" />
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span key={tag.id} className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-sm">
            {tag.name}
            <Button variant="ghost" size="icon" className="ml-1 h-4 w-4 rounded-full" onClick={() => removeTag(tag.id)}>
              <X className="h-3 w-3" />
            </Button>
          </span>
        ))}
      </div>
    </div>
  )
}

