"use client"

import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface LeftSidebarProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

export function LeftSidebar({ selectedFilter, onFilterChange }: LeftSidebarProps) {
  const links = [
    { name: "Recommended", value: "Recommended" },
    { name: "Following", value: "Following" },
    { name: "Events", value: "Events" },
  ];

  return (
    <div className="w-64 min-h-screen bg-[#1f1f1f] border-r border-zinc-800 p-4">
      <nav className="space-y-2">
        {links.map((link) => (
          <motion.button
            key={link.value}
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onFilterChange(link.value)}
            className={cn(
              "block w-full text-left px-4 py-3 rounded-xl transition-all duration-200 font-medium focus:outline-none",
              selectedFilter === link.value
                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20 scale-105"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            {link.name}
          </motion.button>
        ))}
      </nav>  
    </div>
  )
}

