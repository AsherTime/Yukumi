"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { ChevronsRight, ChevronsLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function AnimeSurvey() {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({
    animeCount: [],
    watchHours: [],
    mangakas: [],
    manga: [],
  })

  const handleSelect = (question: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [question]: prev[question].includes(value)
        ? prev[question].filter((v) => v !== value)
        : [...prev[question], value],
    }))
  }

  return (
    <div className="min-h-screen bg-black overflow-y-auto relative px-4 py-8">
      {/* Animated orbs */}
      <motion.div
        className="fixed top-20 left-20 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="fixed bottom-20 right-20 w-96 h-96 rounded-full bg-green-500/20 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      />

      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        {/* Anime Count Question */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>How many animes do you watch weekly?</CardTitle>
          </CardHeader>
          <CardContent>
            {["1", "2", "3", "More than 3"].map((option) => (
              <Select key={option} onValueChange={(value) => handleSelect("animeCount", value)}>
                <SelectTrigger
                  className={`w-full mb-2 hover:scale-105 transition-transform ${
                    selectedOptions.animeCount.includes(option) ? "bg-purple-50 scale-105" : ""
                  }`}
                >
                  <SelectValue placeholder={option} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={option}>{option}</SelectItem>
                </SelectContent>
              </Select>
            ))}
          </CardContent>
        </Card>

        {/* Watch Hours Question */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>How many hours do you watch weekly?</CardTitle>
          </CardHeader>
          <CardContent>
            {["2", "4", "6", "More than 6"].map((option) => (
              <Select key={option} onValueChange={(value) => handleSelect("watchHours", value)}>
                <SelectTrigger
                  className={`w-full mb-2 hover:scale-105 transition-transform ${
                    selectedOptions.watchHours.includes(option) ? "bg-purple-50 scale-105" : ""
                  }`}
                >
                  <SelectValue placeholder={option} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={option}>{option}</SelectItem>
                </SelectContent>
              </Select>
            ))}
          </CardContent>
        </Card>

        {/* Last Anime Question */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>What are the last anime that you watch?</CardTitle>
          </CardHeader>
          <CardContent>
            <Input placeholder="Enter anime name" className="w-full hover:scale-105 transition-transform" />
          </CardContent>
        </Card>

        {/* Manga Question */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Do you follow manga?</CardTitle>
          </CardHeader>
          <CardContent>
            {["Yes", "No"].map((option) => (
              <Select key={option} onValueChange={(value) => handleSelect("manga", value)}>
                <SelectTrigger
                  className={`w-full mb-2 hover:scale-105 transition-transform ${
                    selectedOptions.manga.includes(option) ? "bg-purple-50 scale-105" : ""
                  }`}
                >
                  <SelectValue placeholder={option} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={option}>{option}</SelectItem>
                </SelectContent>
              </Select>
            ))}
          </CardContent>
        </Card>

        {/* Mangaka Question */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Do you follow any of these mangakas?</CardTitle>
          </CardHeader>
          <CardContent>
            {["Kentarou Miura", "Tatsuki Fujimoto", "Naoki Urasawa", "Eiichiro Oda", "SKIP"].map((option) => (
              <Select key={option} onValueChange={(value) => handleSelect("mangakas", value)}>
                <SelectTrigger
                  className={`w-full mb-2 hover:scale-105 transition-transform ${
                    selectedOptions.mangakas.includes(option) ? "bg-purple-50 scale-105" : ""
                  }`}
                >
                  <SelectValue placeholder={option} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={option}>{option}</SelectItem>
                </SelectContent>
              </Select>
            ))}
          </CardContent>
        </Card>

        {/* Next Button */}
        <motion.div
          className="fixed bottom-8 right-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex gap-4">
            <Link href="/quiz/anime-categories">
              <Button
                size="lg"
                className="hover:scale-105 transition-transform duration-200 bg-[#2c2c2c] text-white hover:bg-[#3c3c3c]"
              >
                <ChevronsLeft className="mr-2 h-5 w-5" />
                Previous
              </Button>
            </Link>
            <Link href="/">
              <Button
                size="lg"
                className="hover:scale-105 transition-transform duration-200 bg-white text-black hover:bg-purple-50"
              >
                Next
                <ChevronsRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

