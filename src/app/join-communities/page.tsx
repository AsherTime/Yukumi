"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, ChevronsRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"

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
    <div className="relative min-h-screen bg-black overflow-hidden flex flex-col items-center justify-center px-4">
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

      {/* Content */}
      <motion.h1
        className="text-white text-5xl md:text-7xl font-black mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        JOIN COMMUNITIES
      </motion.h1>

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

      {/* Next button */}
      <motion.div
        className="absolute bottom-8 right-8"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Button size="lg" className="hover:scale-105 transition-transform duration-200">
          Next
          <ChevronsRight className="ml-2 h-5 w-5" />
        </Button>
      </motion.div>
    </div>
  )
}

