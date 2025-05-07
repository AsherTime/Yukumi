"use client"

import * as React from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { ChevronsLeft, ChevronsRight } from "lucide-react"
import Link from "next/link"

interface Category {
  id: string
  name: string
  image: string
  options: string[]
}

const categories: Category[] = [
  {
    id: "action",
    name: "Action",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Yukumi_1-J8E91y5yIvE4yMBoBhcOoV2MjRvjBD.png",
    options: ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
  },
  {
    id: "comedy",
    name: "Comedy",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Yukumi_1-J8E91y5yIvE4yMBoBhcOoV2MjRvjBD.png",
    options: ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
  },
  {
    id: "drama",
    name: "Drama",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Yukumi_1-J8E91y5yIvE4yMBoBhcOoV2MjRvjBD.png",
    options: ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"],
  },
]

export default function AnimeCategories() {
  const [selectedCategories, setSelectedCategories] = React.useState<Set<string>>(new Set())
  const [selectedOptions, setSelectedOptions] = React.useState<{ [key: string]: Set<string> }>({})

  const toggleCategory = (categoryId: string) => {
    const newSelected = new Set(selectedCategories)
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId)
      const newOptions = { ...selectedOptions }
      delete newOptions[categoryId]
      setSelectedOptions(newOptions)
    } else {
      newSelected.add(categoryId)
      setSelectedOptions({
        ...selectedOptions,
        [categoryId]: new Set(),
      })
    }
    setSelectedCategories(newSelected)
  }

  const toggleOption = (categoryId: string, option: string) => {
    const categoryOptions = selectedOptions[categoryId] || new Set()
    const newOptions = new Set(categoryOptions)
    if (newOptions.has(option)) {
      newOptions.delete(option)
    } else {
      newOptions.add(option)
    }
    setSelectedOptions({
      ...selectedOptions,
      [categoryId]: newOptions,
    })
  }

  return (
    <div className="min-h-screen bg-black overflow-y-auto relative px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        <h1 className="text-4xl font-bold text-white text-center mb-8">Anime Categories</h1>
        
        <div className="max-w-6xl mx-auto space-y-8">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center gap-6">
              <button
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  "relative group transition-transform duration-300 transform",
                  selectedCategories.has(category.id) ? "scale-110" : "hover:scale-105",
                )}
              >
                <div className="relative w-48 h-48 rounded-lg overflow-hidden">
                  <Image src={category.image || "/placeholder.svg"} alt={category.name} fill className="object-cover" />
                  <div
                    className={cn(
                      "absolute inset-0 transition-colors duration-300",
                      selectedCategories.has(category.id) ? "bg-white/20" : "group-hover:bg-white/10",
                    )}
                  />
                </div>
                <p className="absolute bottom-2 left-2 text-white text-xl font-bold">{category.name}</p>
              </button>
  
              {selectedCategories.has(category.id) && (
                <Carousel className="w-full max-w-4xl">
                  <CarouselContent>
                    {category.options.map((option, index) => (
                      <CarouselItem key={index} className="basis-1/5">
                        <button
                          onClick={() => toggleOption(category.id, option)}
                          className={cn(
                            "w-full aspect-square rounded-lg transition-all duration-300",
                            "bg-gray-800 hover:bg-gray-700",
                            selectedOptions[category.id]?.has(option) ? "scale-110 ring-2 ring-white" : "hover:scale-105",
                          )}
                        >
                          <span className="sr-only">{option}</span>
                        </button>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="text-white" />
                  <CarouselNext className="text-white" />
                </Carousel>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between mt-8">
          <Link href="/quiz/join-communities">
            <Button className="bg-[#2c2c2c] hover:bg-[#3c3c3c] text-white">
              <ChevronsLeft className="mr-2 h-5 w-5" />
              Previous
            </Button>
          </Link>
          <Link href="/quiz/last-quiz">
            <Button className="bg-[#B624FF] hover:bg-[#B624FF]/80 text-white">
              Next
              <ChevronsRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}