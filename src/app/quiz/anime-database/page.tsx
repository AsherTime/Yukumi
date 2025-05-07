"use client"

import Image from "next/image"
import Link from "next/link"
import { Play, ChevronsRight } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export default function ImportPage() {
  return (
    <div className="min-h-screen w-full bg-black relative overflow-hidden flex flex-col items-center justify-center px-4">
      {/* Glowing orb effects */}
      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-purple-500/20 blur-[100px]" />
      <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-green-500/20 blur-[100px]" />

      {/* Main content */}
      <motion.div
        className="max-w-3xl w-full text-center z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-white text-4xl md:text-6xl font-bold leading-tight mb-12 tracking-tight">
          DO YOU ALREADY AN ANIME DATABASE ACCOUNT (MAL, AniList, etc.)?
        </h1>

        <div className="relative w-64 h-64 mx-auto mb-8">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Yukumi_1-lVVpIKPVL1X9AzxZecIVJgqlYA4XOs.png"
            alt="Anime Character"
            fill
            className="object-cover rounded-lg"
          />
        </div>

        <div className="flex justify-center gap-4">
          <Link href="/import">
            <motion.button
              className="bg-[#2c2c2c] text-white px-8 py-3 rounded-md text-lg font-medium transition-all"
              whileHover={{ scale: 1.05, backgroundColor: "#3c3c3c" }}
              whileTap={{ scale: 0.95 }}
            >
              IMPORT
            </motion.button>
          </Link>
          <Link href="/quiz/join-communities">
            <Button className="bg-[#B624FF] hover:bg-[#B624FF]/80 text-white px-8 py-3 text-lg">
              Next
              <ChevronsRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Navigation button */}
      <Link href="/next-page" className="absolute bottom-8 right-8">
        <motion.div
          className="bg-white p-3 rounded-lg cursor-pointer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Play className="w-6 h-6 text-black" />
        </motion.div>
      </Link>
    </div>
  )
}

