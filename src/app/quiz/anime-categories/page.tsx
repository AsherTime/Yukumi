"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronsLeft, ChevronsRight } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useRouter } from 'next/navigation'
import { useAuth } from "@/contexts/AuthContext"

interface Category {
  id: string
  name: string
}

const categories: Category[] = [
  {
    id: "Action",
    name: "Action",
  },
  {
    id: "Comedy",
    name: "Comedy",
  },
  {
    id: "Drama",
    name: "Drama",
  },
  {
    id: "Fantasy",
    name: "Fantasy",
  },
  {
    id: "Horror",
    name: "Horror",
  },
  {
    id: "Mystery",
    name: "Mystery",
  },
  {
    id: "Romance",
    name: "Romance",
  },
  {
    id: "Sci-Fi",
    name: "Sci-Fi",
  },
  {
    id: "Slice of Life",
    name: "Slice of Life",
  },
  {
    id: "Supernatural",
    name: "Supernatural",
  },
  {
    id: "Thriller",
    name: "Thriller",
  },
  {
    id: "Adventure",
    name: "Adventure",
  },
  {
    id: "Psychological",
    name: "Psychological",
  },
  {
    id: "Suspense",
    name: "Suspense",
  },
  {
    id: "Mecha",
    name: "Mecha",
  },
  {
    id: "Music",
    name: "Music",
  }
]

export default function AnimeCategories() {
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const { user } = useAuth()
  const userId = user?.id
  const router = useRouter()

  const toggleCategory = (categoryId: string) => {
    const newSelected = new Set(selectedCategories)
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId)
    } else {
      newSelected.add(categoryId)
    }
    setSelectedCategories(newSelected)
  }

  const handleNext = async () => {
    try {
      setIsSaving(true)
      // Save selected categories
      const selectedGenreNames = Array.from(selectedCategories)
        .map((categoryId) => categories.find((c) => c.id === categoryId)?.name)
        .filter((name): name is string => !!name); // removes undefined values

      const { error } = await supabase.from('user_genre_preferences').insert({
        user_id: userId,
        genres: selectedGenreNames,
      });

      if (error) throw error;
      router.push('/quiz/last-quiz')
    } catch (error: any) {
      console.error('Error saving preferences:', error.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-black overflow-y-auto relative px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        <h1 className="text-4xl font-bold text-white text-center mb-8">Anime Categories</h1>

        <div className="max-w-6xl mx-auto space-y-8">
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((category) => (
              <li key={category.id} className="inline-block m-2">
                <button
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    `w-32 h-32 flex items-center justify-center 
         text-white font-medium rounded-full
         transition-all duration-200`,
                    selectedCategories.has(category.id)
                      ? "bg-gradient-to-r from-blue-400 to-blue-600 hover:opacity-90"
                      : "bg-gradient-to-r from-pink-400 to-purple-600 hover:opacity-90"
                  )}
                >
                  <span className="text-center">{category.name}</span>
                </button>
              </li>
            ))}

          </ul>
        </div>

        <div className="flex justify-between mt-8">
          <Link href="/quiz/join-communities">
            <Button className="bg-[#2c2c2c] hover:bg-[#3c3c3c] text-white">
              <ChevronsLeft className="mr-2 h-5 w-5" />
              Previous
            </Button>
          </Link>
          <Button
            onClick={handleNext}
            disabled={isSaving || selectedCategories.size === 0}
            className="bg-[#B624FF] hover:bg-[#B624FF]/80 text-white"
          >
            {isSaving ? 'Saving...' : 'Next'}
            <ChevronsRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}