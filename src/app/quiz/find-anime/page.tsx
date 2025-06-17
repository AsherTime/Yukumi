"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import Image from "next/image"
import { ChevronsLeft, ChevronsRight, Heart, RefreshCw, Play } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

interface QuizAnswer {
  watchType: string
  companion: string
  genres: string[]
  mood: string
  tags: string[]
  lengthPreference: string
  ageGroup: string
  streamingOnly: boolean
  countryPreference: string
}

interface Anime {
  id: string
  title: string
  image_url: string
  synopsis: string
  genres: string[]
}

interface Question {
  id: string
  question: string
  type: "radio" | "select" | "multiSelect" | "multiCheckbox" | "switch"
  options?: Array<{ value: string; label: string }> | string[]
  label?: string
}

export default function FindAnimeQuiz() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswer>(() => {
    // Try to get previous answers from URL
    const previousAnswersStr = searchParams.get('previousAnswers')
    if (previousAnswersStr) {
      try {
        return JSON.parse(previousAnswersStr)
      } catch (e) {
        console.error('Error parsing previous answers:', e)
      }
    }
    // Default state if no previous answers
    return {
      watchType: "",
      companion: "",
      genres: [],
      mood: "",
      tags: [],
      lengthPreference: "",
      ageGroup: "",
      streamingOnly: false,
      countryPreference: "",
    }
  })
  const [loading, setLoading] = useState(false)

  const questions: Question[] = [
    {
      id: "watchType",
      question: "Do you prefer watching or reading?",
      type: "radio",
      options: [
        { value: "anime", label: "🎥 Anime" },
        { value: "manga", label: "📖 Manga" },
      ],
    },
    {
      id: "companion",
      question: "Who are you watching with?",
      type: "radio",
      options: [
        { value: "solo", label: "🧍 Solo" },
        { value: "friends", label: "👥 Friends" },
        { value: "partner", label: "💞 Partner" },
        { value: "family", label: "👪 Family" },
      ],
    },
    {
      id: "genres",
      question: "Pick your favorite genres:",
      type: "multiSelect",
      options: [
        "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
        "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Thriller"
      ],
    },
    {
      id: "mood",
      question: "What's your current mood?",
      type: "select",
      options: [
        { value: "Happy", label: "🙂 Happy" },
        { value: "Sad", label: "😔 Sad" },
        { value: "Hype", label: "🔥 Hype" },
        { value: "Relaxed", label: "😌 Relaxed" },
        { value: "Romantic", label: "💖 Romantic" },
      ],
    },
    {
      id: "tags",
      question: "Pick tags that describe your taste:",
      type: "multiCheckbox",
      options: [
        "Dark", "Psychological", "Emotional", "Supernatural", "Isekai",
        "Game", "Gore", "Time Travel", "School", "Strategy"
      ],
    },
    {
      id: "lengthPreference",
      question: "Preferred episode length?",
      type: "select",
      options: [
        { value: "Short", label: "📘 Short (≤12 episodes)" },
        { value: "Long", label: "📗 Long (>12 episodes)" },
      ],
    },
    {
      id: "ageGroup",
      question: "What's your age group?",
      type: "radio",
      options: [
        { value: "kid", label: "👶 Kid" },
        { value: "teen", label: "🧒 Teen" },
        { value: "adult", label: "🧑 Adult" },
        { value: "senior", label: "👴 Senior" },
      ],
    },
    {
      id: "countryPreference",
      question: "Preferred country of origin?",
      type: "select",
      options: [
        { value: "japan", label: "🇯🇵 Japan" },
        { value: "korea", label: "🇰🇷 Korea" },
        { value: "china", label: "🇨🇳 China" },
        { value: "any", label: "🌍 No preference" },
      ],
    },
    {
      id: "streamingOnly",
      question: "Preferred format?",
      type: "switch",
      label: "💻 Streaming only",
    },
  ]

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }))
  }

  const handleNext = async () => {
    if (currentStep === questions.length - 1) {
      await submitQuiz()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1)
  }

  const submitQuiz = async () => {
    if (!user) {
      toast.error("Please log in to save your quiz results")
      return
    }

    setLoading(true)
    try {
      // Insert quiz results
      const { data: quizResult, error: quizError } = await supabase
        .from('quiz_results')
        .insert({
          user_id: user.id,
          taken_at: new Date().toISOString(),
          genre_preferences: answers.genres,
          age_group: answers.ageGroup,
          watch_type: answers.watchType,
          companion: answers.companion,
          mood: answers.mood,
          tags: answers.tags,
          length_preference: answers.lengthPreference,
          streaming_preference: answers.streamingOnly,
          country_preference: answers.countryPreference,
        })
        .select()
        .single()

      if (quizError) throw quizError

      toast.success("Quiz completed! Redirecting to your recommendations...")
      router.push("/recommended-anime")
    } catch (error: any) {
      console.error("Error submitting quiz:", error)
      toast.error("Failed to submit quiz. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const renderQuestion = () => {
    const question = questions[currentStep]
    if (!question || !question.options) return null

    switch (question.type) {
      case "radio":
        return (
          <RadioGroup
            value={answers[question.id as keyof QuizAnswer] as string}
            onValueChange={(value) => handleAnswer(question.id, value)}
            className="space-y-4"
          >
            {(question.options as Array<{ value: string; label: string }>).map((option) => (
              <motion.div
                key={option.value}
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-2 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="text-lg cursor-pointer">{option.label}</Label>
              </motion.div>
            ))}
          </RadioGroup>
        )

      case "select":
        return (
          <Select
            value={answers[question.id as keyof QuizAnswer] as string}
            onValueChange={(value) => handleAnswer(question.id, value)}
          >
            <SelectTrigger className="w-full bg-white/5 border-white/10 text-lg">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent className="bg-black/90 border-white/10">
              {(question.options as Array<{ value: string; label: string }>).map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="text-lg hover:bg-white/10"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "multiSelect":
      case "multiCheckbox":
        return (
          <div className="grid grid-cols-2 gap-4">
            {(question.options as string[]).map((option) => (
              <motion.div
                key={option}
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-2 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Checkbox
                  id={option}
                  checked={(answers[question.id as keyof QuizAnswer] as string[]).includes(option)}
                  onCheckedChange={(checked) => {
                    const current = answers[question.id as keyof QuizAnswer] as string[]
                    handleAnswer(
                      question.id,
                      checked
                        ? [...current, option]
                        : current.filter((item) => item !== option)
                    )
                  }}
                />
                <Label htmlFor={option} className="text-lg cursor-pointer">{option}</Label>
              </motion.div>
            ))}
          </div>
        )

      case "switch":
        return (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center space-x-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Switch
              checked={answers[question.id as keyof QuizAnswer] as boolean}
              onCheckedChange={(checked) => handleAnswer(question.id, checked)}
            />
            <Label className="text-lg">{question.label}</Label>
          </motion.div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
      
      {/* Content */}
      <div className="relative z-10 p-8">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Question {currentStep + 1} of {questions.length}</span>
                  <span>{Math.round(((currentStep + 1) / questions.length) * 100)}%</span>
                </div>
                <Progress
                  value={((currentStep + 1) / questions.length) * 100}
                  className="h-2 bg-white/10"
                />
              </div>

              {/* Question card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/40 backdrop-blur-sm rounded-xl p-8 border border-white/10"
              >
                <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {questions[currentStep].question}
                </h1>

                <div className="space-y-6">
                  {renderQuestion()}
                </div>
              </motion.div>

              {/* Navigation buttons */}
              <div className="flex justify-between">
                <Button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  variant="outline"
                  className="border-white/20 hover:bg-white/10"
                >
                  <ChevronsLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {currentStep === questions.length - 1 ? "Submit" : "Next"}
                  <ChevronsRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
} 