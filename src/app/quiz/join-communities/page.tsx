"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, ChevronsRight, Search, ChevronsLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

const communities = [
  "Jujutsu Kaisen",
  "Attack On Titan",
  "Solo Leveling",
  "Chainsaw Man",
  "One Piece",
  "Demon Slayer",
  "My Hero Academia",
  "Black Clover",
  "Naruto",
  "Dragon Ball",
]

export default function JoinCommunities() {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")

  return (
    <div className="min-h-screen bg-black overflow-y-auto relative px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        <h1 className="text-4xl font-bold text-white text-center mb-8">Join Communities</h1>
        
        {/* Animated orbs */}
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-green-500/20 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[300px] justify-between hover:scale-105 transition-transform duration-200"
            >
              {value ? communities.find((community) => community === value) : "Select community..."}
              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search communities..." />
              <CommandList>
                <CommandEmpty>No community found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {communities.map((community) => (
                    <CommandItem
                      key={community}
                      value={community}
                      onSelect={(currentValue) => {
                        setValue(currentValue === value ? "" : currentValue)
                        setOpen(false)
                      }}
                      className="cursor-pointer hover:bg-accent"
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === community ? "opacity-100" : "opacity-0")} />
                      {community}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="flex justify-between mt-8">
          <Link href="/quiz/anime-database">
            <Button className="bg-[#2c2c2c] hover:bg-[#3c3c3c] text-white">
              <ChevronsLeft className="mr-2 h-5 w-5" />
              Previous
            </Button>
          </Link>
          <Link href="/quiz/anime-categories">
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

