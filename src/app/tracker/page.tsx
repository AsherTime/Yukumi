"use client"

import React, { useState, useEffect } from "react"
import { CheckCircle, Trophy, BarChart3, MessageSquare, BookOpen, Flame, Star, Hexagon } from "lucide-react"
import { TopNav } from "@/components/top-nav"
import { awardPoints } from '@/utils/awardPoints'
import { wasTaskCompletedToday } from '@/utils/dailyTasks'
import { supabase } from '@/lib/supabase'
import WeeklyStatsSidebar from "@/components/weekly-stats-sidebar"
import Footer from "@/components/footer"

// Minimal Card component for self-containment
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-gray-700 bg-gray-900/60 p-4 shadow-lg backdrop-blur-md ${className || ''}`}>
      {children}
    </div>
  )
}

// Custom Tailwind colors for a cozy dark anime vibe
const customColors = {
  'cozy-bg-dark': '#1A1A2E',
  'cozy-text-light': '#E0E0E0',
  'cozy-card-bg': 'rgba(30, 30, 45, 0.7)',
  'cozy-star-glow-light': '#9DD6FF',
  'cozy-star-glow-dark': '#6FA8DC',
  'cozy-progress-fill': '#8FB8DE',
  'cozy-button-bg': '#5A6A80',
  'cozy-button-hover': '#6F8095',
  'cozy-card-bg-transparent': 'rgba(30, 30, 45, 0.55)',
}

const trackerData = {
  score: 742,
  level: 12,
  levelName: "Rising Hunter",
  levelProgress: 68,
  encouragement: "You're doing great!",
  features: [
    {
      id: 1,
      title: "Daily Tasks",
      icon: CheckCircle,
      value: "5/5",
      status: "Completed",
      color: "from-emerald-500 to-teal-600",
    },
    {
      id: 2,
      title: "Badge Display",
      icon: Trophy,
      value: "12",
      status: "Earned",
      color: "from-amber-500 to-orange-600",
    },
    {
      id: 3,
      title: "Weekly Stats",
      icon: BarChart3,
      value: "94%",
      status: "Progress",
      color: "from-blue-500 to-indigo-600",
    },
    {
      id: 4,
      title: "Community Posts",
      icon: MessageSquare,
      value: "23",
      status: "New",
      color: "from-purple-500 to-violet-600",
    },
    {
      id: 5,
      title: "Manga Tracker",
      icon: BookOpen,
      value: "8/12",
      status: "Reading",
      color: "from-pink-500 to-rose-600",
    },
    {
      id: 6,
      title: "Daily Login",
      icon: Flame,
      value: "15",
      status: "Day Streak",
      color: "from-red-500 to-orange-600",
    },
  ],
}

function getScoreGradient(score: number) {
  if (score <= 200) return "from-gray-400 to-gray-600"
  if (score <= 400) return "from-yellow-400 to-amber-500"
  if (score <= 600) return "from-green-400 to-emerald-500"
  if (score <= 800) return "from-blue-400 to-indigo-500"
  return "from-purple-400 to-violet-500"
}

function getScoreGlow(score: number) {
  if (score <= 200) return "shadow-gray-500/20"
  if (score <= 400) return "shadow-yellow-500/30"
  if (score <= 600) return "shadow-green-500/30"
  if (score <= 800) return "shadow-blue-500/30"
  return "shadow-purple-500/40"
}

// Falling star animation component
function FallingStar({ left, onEnd }: { left: number; onEnd: () => void }) {
  // Randomize diagonal direction (left-to-right or right-to-left)
  const isLeftToRight = Math.random() > 0.5;
  // Randomize the angle (between 20deg and 35deg)
  const angle = isLeftToRight ? 28 : -28;
  useEffect(() => {
    const timer = setTimeout(onEnd, 7000) // 7s for slow, cozy fall
    return () => clearTimeout(timer)
  }, [onEnd])
  return (
    <span
      className="pointer-events-none fixed z-20"
      style={{
        left: `${left}%`,
        top: 0,
        animation: `falling-star-diagonal-${isLeftToRight ? 'ltr' : 'rtl'} 7s linear 0s 1`,
        opacity: 0.7,
      }}
    >
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <defs>
          <linearGradient id="fallingStarGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9DD6FF" stopOpacity="0.8" />
            <stop offset="1" stopColor="#6FA8DC" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path d="M16 0 L18 12 L32 16 L18 20 L16 32 L14 20 L0 16 L14 12 Z" fill="url(#fallingStarGrad)" />
      </svg>
      <style jsx global>{`
        @keyframes falling-star-diagonal-ltr {
          0%   { transform: translateY(-40px) translateX(0vw) scale(0.7) rotate(-10deg); opacity: 0; }
          10%  { opacity: 0.5; }
          80%  { opacity: 0.5; }
          100% { transform: translateY(100vh) translateX(40vw) scale(1) rotate(10deg); opacity: 0; }
        }
        @keyframes falling-star-diagonal-rtl {
          0%   { transform: translateY(-40px) translateX(0vw) scale(0.7) rotate(10deg); opacity: 0; }
          10%  { opacity: 0.5; }
          80%  { opacity: 0.5; }
          100% { transform: translateY(100vh) translateX(-40vw) scale(1) rotate(-10deg); opacity: 0; }
        }
      `}</style>
    </span>
  )
}

// Add a component for the forming star at the top
function FormingStar({ left, onEnd }: { left: number; onEnd: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onEnd, 1200) // 1.2s for fade in/out
    return () => clearTimeout(timer)
  }, [onEnd])
  return (
    <span
      className="pointer-events-none fixed z-30"
      style={{
        left: `${left}%`,
        top: 0,
        animation: `forming-star 1.2s ease-in-out 0s 1`,
        opacity: 0.8,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <defs>
          <radialGradient id="formingStarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff" stopOpacity="1" />
            <stop offset="100%" stopColor="#9DD6FF" stopOpacity="0.2" />
          </radialGradient>
        </defs>
        <circle cx="9" cy="9" r="7" fill="url(#formingStarGlow)" />
      </svg>
      <style jsx global>{`
        @keyframes forming-star {
          0% { opacity: 0; transform: scale(0.7); }
          30% { opacity: 0.8; transform: scale(1.1); }
          60% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.7); }
        }
      `}</style>
    </span>
  )
}

function BackgroundElements() {
  const [fallingStars, setFallingStars] = useState<{ id: number; left: number }[]>([])
  const [floatingStars, setFloatingStars] = useState<any[]>([])
  const [floatingHexagons, setFloatingHexagons] = useState<any[]>([])
  const [formingStars, setFormingStars] = useState<{ id: number; left: number }[]>([])

  // Generate floating stars and hexagons only once on mount
  useEffect(() => {
    setFloatingStars(
      Array.from({ length: 14 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 3,
        duration: 2.5 + Math.random() * 2.5,
        size: Math.random() * 14 + 8,
      }))
    )
    setFloatingHexagons(
      Array.from({ length: 8 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 2.5,
        size: Math.random() * 20 + 12,
      }))
    )
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const left = 10 + Math.random() * 80;
      const formingId = Math.random();
      setFormingStars((stars) => [...stars, { id: formingId, left }]);
      setTimeout(() => {
        setFallingStars((stars) => {
          if (stars.length < 4) {
            return [...stars, { id: formingId, left }];
          } else {
            return stars;
          }
        });
      }, 1100);
    }, 3500 + Math.random() * 1500); // 3.5s to 5s
    return () => clearInterval(interval);
  }, [fallingStars.length]);

  // Remove forming star after animation
  useEffect(() => {
    if (formingStars.length === 0) return
    const timer = setTimeout(() => {
      setFormingStars((stars) => stars.slice(1))
    }, 1200)
    return () => clearTimeout(timer)
  }, [formingStars])

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-10">
      {/* Floating stars */}
      {floatingStars.map((star, i) => (
        <Star
          key={`star-${i}`}
          className="absolute text-indigo-200/30"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            filter: 'drop-shadow(0 0 8px #9DD6FF88)',
            animation: `float-fade-glow ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
          size={star.size}
        />
      ))}
      {/* Hex patterns */}
      {floatingHexagons.map((hex, i) => (
        <Hexagon
          key={`hex-${i}`}
          className="absolute text-cyan-200/20"
          style={{
            left: `${hex.left}%`,
            top: `${hex.top}%`,
            filter: 'drop-shadow(0 0 8px #6FA8DC66)',
            animation: `float-fade-glow ${hex.duration}s ease-in-out ${hex.delay}s infinite`,
          }}
          size={hex.size}
        />
      ))}
      {/* Forming stars at the top */}
      {formingStars.map((star) => (
        <FormingStar key={star.id} left={star.left} onEnd={() => { }} />
      ))}
      {/* Looping falling stars */}
      {fallingStars.map((star) => (
        <FallingStar
          key={star.id}
          left={star.left}
          onEnd={() => setFallingStars((stars) => stars.filter((s) => s.id !== star.id))}
        />
      ))}
      <style jsx global>{`
        @keyframes falling-star-diagonal-ltr {
          0%   { transform: translateY(-40px) translateX(0vw) scale(0.7) rotate(-10deg); opacity: 0; }
          10%  { opacity: 0.5; }
          80%  { opacity: 0.5; }
          100% { transform: translateY(100vh) translateX(40vw) scale(1) rotate(10deg); opacity: 0; }
        }
        @keyframes falling-star-diagonal-rtl {
          0%   { transform: translateY(-40px) translateX(0vw) scale(0.7) rotate(10deg); opacity: 0; }
          10%  { opacity: 0.5; }
          80%  { opacity: 0.5; }
          100% { transform: translateY(100vh) translateX(-40vw) scale(1) rotate(-10deg); opacity: 0; }
        }
        @keyframes float-fade-glow {
          0% {
            opacity: 0;
            filter: drop-shadow(0 0 0px #9DD6FF00);
          }
          20% {
            opacity: 0.7;
            filter: drop-shadow(0 0 8px #9DD6FF88);
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 16px #9DD6FF);
          }
          80% {
            opacity: 0.7;
            filter: drop-shadow(0 0 8px #9DD6FF88);
          }
          100% {
            opacity: 0;
            filter: drop-shadow(0 0 0px #9DD6FF00);
          }
        }
      `}</style>
    </div>
  )
}

function LevelBar({ level, levelName, progress }: { level: number; levelName: string; progress: number }) {
  return (
    <div className="w-full max-w-md mx-auto mt-4">
      <div className="flex justify-between items-center text-sm mb-1">
        <span className="text-gray-300 font-medium">Level {level}</span>
        <span className="text-indigo-400 font-semibold">{levelName}</span>
      </div>
      <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full" />
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-indigo-500/30"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full animate-pulse" />
      </div>
      <div className="text-right text-xs text-gray-400 mt-1">{progress.toFixed(1)}% to next level</div>
    </div>
  )
}

function FeatureCard({ feature }: { feature: (typeof trackerData.features)[0] }) {
  const Icon = feature.icon
  return (
    <Card className="group hover:bg-gray-800/70 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-indigo-500/20 overflow-hidden">
      <div className="flex items-center space-x-3 mb-4">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${feature.color} bg-opacity-20`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
      </div>
      <div className="text-2xl font-bold text-white font-mono mb-1">{feature.value}</div>
      <div className="text-xs text-gray-400 uppercase tracking-wide">{feature.status}</div>
    </Card>
  )
}

function TrackerScore({ score }: { score: number }) {
  const gradient = getScoreGradient(score)

  return (
    <div className="relative group">
      {/* Main circle with transparent background, subtle border, and glow */}
      <div
        className={`relative w-64 h-64 rounded-full flex flex-col items-center justify-center backdrop-blur-sm transition-transform duration-300 group-hover:scale-105`}
        style={{
          backgroundColor: 'rgba(30, 30, 45, 0.16)',
          border: `1px solid ${customColors['cozy-star-glow-light']}`,
          boxShadow: `0 0 15px ${customColors['cozy-star-glow-light']}, inset 0 0 8px ${customColors['cozy-star-glow-dark']}`,
        }}
      >
        {/* Inner glow effect - very subtle, slow smooth pulse, fades to 15% opacity */}
        <div
          className={`absolute inset-2 rounded-full bg-gradient-to-r ${gradient}`}
          style={{
            animation: 'orb-pulse 3.5s ease-in-out infinite',
            opacity: 0.15,
          }}
        />
        {/* Score display */}
        <div className="relative z-10 text-center">
          <div className="text-5xl font-bold text-white mb-2 font-mono tracking-wider">{score.toLocaleString()}</div>
          <div className="text-sm text-gray-300 uppercase tracking-widest">Tracker Score</div>
        </div>
        {/* Pulse keyframes */}
        <style jsx>{`
          @keyframes orb-pulse {
            0% { opacity: 0.15; }
            40% { opacity: 0.35; }
            60% { opacity: 0.35; }
            100% { opacity: 0.15; }
          }
        `}</style>
      </div>
    </div>
  )
}


export default function TrackerPage() {
  const [tracker, setTracker] = useState<{ xp: number; level: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [reflection, setReflection] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoadingReflection, setIsLoadingReflection] = useState(false)
  const [awardStatus, setAwardStatus] = useState<string | null>(null)
  const [dailyTasks, setDailyTasks] = useState({
    dailyCheckIn: false,
    commentComrade: false,
    quickReviewer: false,
  });


  // Get the current user (adjust for your auth setup)
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.error('Error getting user:', error)
      }
      console.log('Auth user:', data?.user)
      setUserId(data?.user?.id || null)
    })
  }, [])

  useEffect(() => {
    async function fetchTracker() {
      if (!userId) {
        setLoading(false)
        return
      }
      const { data, error } = await supabase
        .from('user_tracker')
        .select('xp, level')
        .eq('user_id', userId)
        .single()
      console.log('Fetched tracker:', { data, error, userId })
      if (error) {
        console.error('Supabase error:', error)
      }
      if (data) {
        setTracker(data)
      }
      setLoading(false)
    }
    fetchTracker()
  }, [userId, awardStatus])

  useEffect(() => {
    if (!userId) return;

    // Check daily tasks status
    const checkDailyTasks = () => {
      const dailyCheckIn = wasTaskCompletedToday(`daily_check_in_${userId}`);
      const commentComrade = wasTaskCompletedToday(`comment_comrade_${userId}_${new Date().toDateString()}`);
      const quickReviewer = wasTaskCompletedToday(`quick_reviewer_${userId}_${new Date().toDateString()}`);

      setDailyTasks({
        dailyCheckIn,
        commentComrade,
        quickReviewer,
      });
    };

    checkDailyTasks();
    // Check every minute to update the status
    const interval = setInterval(checkDailyTasks, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  // Test award points button handler
  const handleTestAward = async () => {
    setAwardStatus(null)
    if (!userId) return
    try {
      await awardPoints(
        userId,
        'test_award',
        10,
      )
      setAwardStatus('Points awarded! Reloading...')
      setTimeout(() => setAwardStatus(null), 2000)
    } catch (e) {
      setAwardStatus('Error awarding points. See console.')
    }
  }

  const fetchCozyReflection = async () => {
    setIsLoadingReflection(true);
    setReflection("");
    setIsModalOpen(true);
    try {
      const prompt = `Generate a short, comforting, and reflective thought or a gentle affirmation, similar in style to calming anime narration or a peaceful journal entry. It should evoke a sense of quiet contemplation and personal journey. Do not include any character names or specific anime titles. Keep it concise, around 1-3 sentences.`;

      const chatHistory = [
        { role: "user", parts: [{ text: prompt }] }
      ];

      const payload = { contents: chatHistory };
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (
        result.candidates?.[0]?.content?.parts?.[0]?.text
      ) {
        setReflection(result.candidates[0].content.parts[0].text);
      } else {
        console.warn("Unexpected response:", result);
        setReflection("Failed to generate a reflection. Please try again.");
      }
    } catch (error) {
      console.error("Error generating reflection:", error);
      setReflection("Error generating reflection. Please check your connection.");
    } finally {
      setIsLoadingReflection(false);
    }
  };


  const closeModal = () => {
    setIsModalOpen(false)
    setReflection("")
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-300">Loading your tracker...</div>

  if (!tracker && !loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-300">
        No tracker data found for your user.<br />
      </div>
    )
  }

  // Use real data if available, otherwise fallback to demo
  const score = tracker?.xp ?? trackerData.score
  const level = tracker?.level ?? trackerData.level
  const levelName = trackerData.levelName // You may want to fetch this from DB in the future
  const levelProgress = tracker ? ((score % 200) / 200) * 100 : trackerData.levelProgress

  // Update the trackerData.features array in the return statement
  const features = [
    {
      id: 1,
      title: "Daily Check-In",
      icon: CheckCircle,
      value: dailyTasks.dailyCheckIn ? "Completed" : "5 XP",
      status: dailyTasks.dailyCheckIn ? "Completed" : "Available",
      color: "from-emerald-500 to-teal-600",
    },
    {
      id: 2,
      title: "Comment Comrade",
      icon: MessageSquare,
      value: dailyTasks.commentComrade ? "Completed" : "15 XP",
      status: dailyTasks.commentComrade ? "Completed" : "Available",
      color: "from-blue-500 to-indigo-600",
    },
    {
      id: 3,
      title: "Quick Reviewer",
      icon: Star,
      value: dailyTasks.quickReviewer ? "Completed" : "25 XP",
      status: dailyTasks.quickReviewer ? "Completed" : "Available",
      color: "from-amber-500 to-orange-600",
    },
  ];

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="https://rhspkjpeyewjugifcvil.supabase.co/storage/v1/object/sign/animepagebg/Leonardo_Anime_XL_Generate_a_wide_horizontal_image_for_a_websi_1.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hMDVhOTMwNi0zYmRiLTQ5YjQtYWRkNi0xYzIxMzY4YmM3MDEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhbmltZXBhZ2ViZy9MZW9uYXJkb19BbmltZV9YTF9HZW5lcmF0ZV9hX3dpZGVfaG9yaXpvbnRhbF9pbWFnZV9mb3JfYV93ZWJzaV8xLmpwZyIsImlhdCI6MTc1MDA5MDEwOSwiZXhwIjoxNzgxNjI2MTA5fQ.fWu7BWc3R8PgN7n8Q8XrSS0sK3m8jC5Rub8EVZP6LUk"
          className="object-cover w-full h-full blur-[2.25px] brightness-70 grayscale-[0.07]"
          style={{ pointerEvents: 'none' }}
          alt="Background"
        />
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content Layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <TopNav />
        <BackgroundElements />

        {/* Main Row Layout */}
        <div className="flex-grow pt-24 w-full flex justify-center">
          <div className="flex w-full max-w-[1280px] gap-8">
            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center">
              <div className="flex flex-col items-center mt-8 mb-6">
                <TrackerScore score={score} />
              </div>
              <LevelBar level={level} levelName={levelName} progress={levelProgress} />
              <button
                onClick={fetchCozyReflection}
                disabled={isLoadingReflection}
                className="mb-10 mt-10 px-8 py-3 rounded-full text-lg font-semibold transition-all duration-300 ease-in-out"
                style={{
                  backgroundColor: customColors['cozy-button-bg'],
                  color: customColors['cozy-text-light'],
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                  textShadow: '0 0 5px rgba(0,0,0,0.3)',
                }}
              >
                {isLoadingReflection ? 'Reflecting...' : 'Get a Cozy Reflection'}
              </button>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full mb-12">
                {features.map((feature) => (
                  <FeatureCard key={feature.id} feature={feature} />
                ))}
              </div>
            </div>

            {/* Right Sidebar */}
            <div
              className="hidden lg:block w-[260px] rounded-xl p-6"
              style={{
                backgroundColor: customColors['cozy-bg-dark'],
              }}
            >
              <WeeklyStatsSidebar />
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50"
          onClick={closeModal}
        >
          <div
            className="bg-gray-800 rounded-xl p-8 max-w-sm w-full relative shadow-2xl"
            style={{
              backgroundColor: customColors['cozy-card-bg'],
              backdropFilter: 'blur(10px)',
              border: `1px solid ${customColors['cozy-star-glow-light']}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200 text-2xl"
              onClick={closeModal}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center" style={{ color: customColors['cozy-text-light'] }}>
              Your Cozy Reflection
            </h2>
            {isLoadingReflection ? (
              <p className="text-center text-gray-400">Brewing a moment of peace...</p>
            ) : (
              <p className="text-lg text-center leading-relaxed" style={{ color: customColors['cozy-text-light'] }}>
                {reflection || "No reflection generated. Please try again."}
              </p>
            )}
          </div>
        </div>
      )}
    </div>



  )
} 