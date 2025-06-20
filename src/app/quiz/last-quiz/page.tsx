"use client"

import { use, useState } from "react"
import { motion } from "framer-motion"
import { ChevronsRight, ChevronsLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

export default function AnimeSurvey() {
  const [count, setCount] = useState("");
  const [hours, setHours] = useState("");
  const [lastAnime, setLastAnime] = useState<string[]>([]);
  const [readManga, setReadManga] = useState<boolean | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id;

  const handleNext = async () => {

    if (!user) return;

    const { error } = await supabase.from("user_registration_quiz").insert({
      user_id: userId,
      anime_count: count,
      anime_hours: hours,
      read_manga: readManga,
      last_anime: lastAnime, 
    });

    if (error) {
      console.error("Failed to save quiz data:", error.message);
      return;
    }

    // Navigate to next page after successful insert
    router.push("/homepage");
  };

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
            <CardTitle>How many animes have you watched?</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={count} onValueChange={(value) => setCount(value)} className="space-y-2">
              {["Less than 50", "50-200", "200-500", "More than 500"].map((option) => (
                <div
                  key={option}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg border cursor-pointer transition-all
            ${count === option ? "bg-purple-400 border-purple-700" : "bg-zinc-800 hover:bg-zinc-600"}`}
                  onClick={() => setCount(option)}
                >
                  <RadioGroupItem value={option} id={option} />
                  <label htmlFor={option} className="text-sm font-medium cursor-pointer">
                    {option}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Watch Hours Question */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>How many hours do you watch weekly?</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={hours} onValueChange={(value) => setHours(value)} className="space-y-2">
              {["Less than 2", "2-7", "8-14", "More than 14"].map((option) => (
                <div
                  key={option}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-lg border cursor-pointer transition-all
            ${hours === option ? "bg-purple-400 border-purple-700" : "bg-zinc-800 hover:bg-zinc-600"}`}
                  onClick={() => setHours(option)}
                >
                  <RadioGroupItem value={option} id={option} />
                  <label htmlFor={option} className="text-sm font-medium cursor-pointer">
                    {option}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Last Anime Question */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>What are some animes that you are watching or have watched recently?</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Enter anime names"
              className="w-full hover:scale-105 bg-zinc-800 transition-transform"
              onChange={(e) => {
                const value = e.target.value;
                const names = value.split(",").map((name) => name.trim()).filter((n) => n !== "");
                setLastAnime(names);
              }}
            />
          </CardContent>
        </Card>

        {/* Manga Question */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>Do you follow manga?</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={readManga === true ? "Yes" : readManga === false ? "No" : ""}
              onValueChange={(value) => setReadManga(value === "Yes")}
              className="space-y-2"
            >
              {["Yes", "No"].map((option) => {
                const isSelected = (option === "Yes" && readManga === true) || (option === "No" && readManga === false);
                return (
                  <div
                    key={option}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-lg border cursor-pointer transition-all
              ${isSelected ? "bg-purple-400 border-purple-700" : "bg-zinc-800 hover:bg-zinc-600"}`}
                    onClick={() => setReadManga(option === "Yes")}
                  >
                    <RadioGroupItem value={option} id={option} />
                    <label htmlFor={option} className="text-sm font-medium cursor-pointer">
                      {option}
                    </label>
                  </div>
                );
              })}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-8">
          <Link href="/quiz/anime-categories">
            <Button className="bg-[#2c2c2c] hover:bg-[#3c3c3c] text-white">
              <ChevronsLeft className="mr-2 h-5 w-5" />
              Previous
            </Button>
          </Link>
          <Button
            onClick={handleNext}
            className="bg-[#B624FF] hover:bg-[#B624FF]/80 text-white"
          >
            Submit
            <ChevronsRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

