"use client";
import { TopNav } from "@/components/top-nav"
import Footer from "@/components/footer"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation";
import * as Tooltip from "@radix-ui/react-tooltip"
import { getAuth, onAuthStateChanged, User, setPersistence, browserLocalPersistence } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { FiCalendar, FiAward, FiGift, FiClock, FiStar, FiTrendingUp, FiThumbsUp, FiMessageCircle } from 'react-icons/fi';
import { FaFire } from 'react-icons/fa';
import { motion } from 'framer-motion';

// Dummy data for the graph
const graphData = [
  { name: 'Mon', visits: 40, follows: 24 },
  { name: 'Tue', visits: 30, follows: 13 },
  { name: 'Wed', visits: 20, follows: 98 },
  { name: 'Thu', visits: 27, follows: 39 },
  { name: 'Fri', visits: 18, follows: 48 },
  { name: 'Sat', visits: 23, follows: 38 },
  { name: 'Sun', visits: 34, follows: 43 },
];

// Dummy data for leaderboard
const leaderboardData = [
  { id: 1, name: 'Alex', level: 8, xp: 25000, avatar: '/avatars/1.png' },
  { id: 2, name: 'Sarah', level: 7, xp: 22000, avatar: '/avatars/2.png' },
  { id: 3, name: 'Mike', level: 7, xp: 21000, avatar: '/avatars/3.png' },
  { id: 4, name: 'Emma', level: 6, xp: 19000, avatar: '/avatars/4.png' },
  { id: 5, name: 'John', level: 6, xp: 18000, avatar: '/avatars/5.png' },
];

// Dummy data for badges
const badgesData = [
  { id: 1, title: 'First Post', description: 'Created your first post', status: 'unlocked', level: 1 },
  { id: 2, title: 'Quiz Master', description: 'Completed 10 quizzes', status: 'locked', level: 3 },
  { id: 3, title: 'Social Butterfly', description: 'Made 50 comments', status: 'locked', level: 4 },
];

export default function TrackerPage() {
  const [currentLevel] = useState(5);
  const [currentXP] = useState(13451);
  const [xpToNextLevel] = useState(15000);
  const [streakDays] = useState(5);
  const [missions] = useState([
    { id: 1, text: 'Post 2 times today', completed: true },
    { id: 2, text: 'Join 1 event', completed: true },
    { id: 3, text: 'Comment on 3 posts', completed: true },
    { id: 4, text: 'Complete daily quiz', completed: false },
    { id: 5, text: 'Visit 5 profiles', completed: false },
  ]);

  // Dummy activity calendar data (intensity: 0-4)
  const activityCalendar = Array.from({ length: 35 }, (_, i) => ({
    date: `2024-05-${(i + 1).toString().padStart(2, "0")}`,
    xp: Math.floor(Math.random() * 10),
    intensity: Math.floor(Math.random() * 5),
  }));

  // Dummy leaderboard with avatars
  const leaderboardData = [
    { id: 1, name: 'Alex Johnson', level: 9, xp: 25000, avatar: '/avatars/1.png' },
    { id: 2, name: 'Irene Lee', level: 9, xp: 22000, avatar: '/avatars/2.png' },
    { id: 3, name: 'Paul Hogan', level: 9, xp: 21000, avatar: '/avatars/3.png' },
    { id: 4, name: 'Taylor Smith', level: 8, xp: 20000, avatar: '/avatars/4.png' },
    { id: 5, name: 'Taylor Brown', level: 8, xp: 19000, avatar: '/avatars/5.png' },
    { id: 6, name: 'Your Rank 124', level: 5, xp: 13451, avatar: '/avatars/6.png' },
  ];

  // Dummy badges with icons
  const badgesData = [
    { id: 1, title: 'First Post', description: 'Created your first post', status: 'unlocked', level: 1, icon: '/badges/first-post.png' },
    { id: 2, title: 'Quiz Master', description: 'Completed 10 quizzes', status: 'locked', level: 3, icon: '/badges/quiz-master.png' },
  ];

  // Remove graph, leaderboard, and streak tracker. Add tracker score section.
  const trackerScore = 742;
  let scoreColor = "bg-gray-700";
  let glow = "shadow-gray-500/50";
  let badge = null;
  if (trackerScore > 800) {
    scoreColor = "bg-purple-700";
    glow = "shadow-purple-500/70";
    badge = <span className="ml-3 px-3 py-1 rounded-full bg-purple-500 text-white text-xs font-bold animate-pulse">Legendary</span>;
  } else if (trackerScore > 600) {
    scoreColor = "bg-blue-700";
    glow = "shadow-blue-500/70";
  } else if (trackerScore > 400) {
    scoreColor = "bg-green-600";
    glow = "shadow-green-400/60";
  } else if (trackerScore > 200) {
    scoreColor = "bg-yellow-400";
    glow = "shadow-yellow-300/60";
  }

  // Example interaction stats (replace with real data as needed)
  const interactions = [
    { label: 'Posts', value: 62 },
    { label: 'Communities', value: 8 },
    { label: 'Events', value: 5 },
    { label: 'Quizzes', value: 12 },
  ];

  // Score gradient logic
  let scoreGradient = 'from-gray-400 via-gray-500 to-gray-700';
  if (trackerScore > 800) scoreGradient = 'from-blue-500 via-blue-400 to-indigo-500';
  else if (trackerScore > 600) scoreGradient = 'from-green-400 via-green-500 to-emerald-500';
  else if (trackerScore > 400) scoreGradient = 'from-yellow-300 via-yellow-400 to-yellow-500';
  else if (trackerScore > 200) scoreGradient = 'from-gray-400 via-gray-500 to-gray-700';
  else scoreGradient = 'from-red-500 via-pink-500 to-red-700';

  // Score color logic for ring and progress bar (updated colors)
  let ringColor = '#64748b'; // Slate Blue
  if (trackerScore > 900) ringColor = '#8b5cf6'; // Electric Purple
  else if (trackerScore > 700) ringColor = '#6366f1'; // Vivid Indigo
  else if (trackerScore > 500) ringColor = '#0ea5e9'; // Bright Aqua Blue
  else if (trackerScore > 300) ringColor = '#22d3ee'; // Neon Cyan

  const { user } = useAuth();
  const [postCount, setPostCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    // Fetch posts count
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .then(({ count }) => setPostCount(count || 0));
    // Fetch likes count
    supabase.from('likes').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .then(({ count }) => setLikeCount(count || 0));
    // Fetch comments count
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      .then(({ count }) => setCommentCount(count || 0));
  }, [user?.id]);

  // Stats row data (dynamic)
  const stats = [
    { icon: <FiStar />, label: 'Posts', value: postCount },
    { icon: <FiThumbsUp />, label: 'Likes', value: likeCount },
    { icon: <FiMessageCircle />, label: 'Comments', value: commentCount },
    { icon: <FiCalendar />, label: 'Events', value: 0 },
  ];

  return (
    <>
      <TopNav />
      <div className="flex flex-row w-full min-h-[90vh] bg-[#0d0d0d] pt-8 px-4 gap-8">
        {/* Left Main Tracker Panel */}
        <div className="w-full max-w-sm flex flex-col items-center rounded-3xl bg-gradient-to-br from-[#181828]/80 via-[#232232]/90 to-[#181828]/80 backdrop-blur-md border-2 border-[#a21caf] p-8 shadow-2xl relative mt-16 mb-8" style={{boxShadow: '0 0 32px 0 #a21caf99, 0 4px 32px 0 #0008'}}>
          {/* Soft radial glow behind score */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-radial from-purple-500/30 via-fuchsia-500/10 to-transparent rounded-full blur-2xl opacity-80 z-0" />
          {/* Smooth single-color ring with hover effect, no square background behind number */}
          <div className={`relative flex items-center justify-center w-60 h-60 mb-6 group`}> 
            <svg
              className="relative z-10 transition-transform duration-300"
              width="240" height="240" viewBox="0 0 240 240"
              style={{
                filter: `drop-shadow(0 0 0px ${ringColor})`,
                transition: 'filter 0.3s',
              }}
              onMouseEnter={e => e.currentTarget.style.filter = `drop-shadow(0 0 24px ${ringColor})`}
              onMouseLeave={e => e.currentTarget.style.filter = `drop-shadow(0 0 0px ${ringColor})`}
            >
              <circle cx="120" cy="120" r="100" strokeWidth="20" fill="none" stroke="#232232" />
              <circle
                cx="120" cy="120" r="100" strokeWidth="10" fill="none"
                stroke={ringColor}
                strokeDasharray={2 * Math.PI * 100}
                strokeDashoffset={2 * Math.PI * 100 * (1 - trackerScore / 1000)}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 12px ${ringColor}cc)` }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[4rem] font-extrabold text-white font-[Orbitron,Oxanium,sans-serif] drop-shadow-[0_2px_16px_rgba(168,85,247,0.7)] select-none">{trackerScore}{badge}</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full mt-2 mb-6">
            <div className="relative w-full h-2 bg-[#232232] rounded-full overflow-hidden">
              <div className="absolute left-0 top-0 h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(100, Math.round((trackerScore / 1000) * 100))}%`, background: ringColor }} />
            </div>
          </div>
          {/* Stats Row - now vertical, one per row */}
          <div className="flex flex-col w-full gap-3 mt-2">
            {stats.map((stat, idx) => (
              <div key={stat.label} className="flex flex-row items-center justify-center bg-[#181828]/80 rounded-full px-6 py-3 shadow-md border border-[#232232] hover:scale-105 hover:shadow-[0_0_8px_2px_rgba(168,85,247,0.2)] transition-all duration-200 cursor-pointer mx-auto w-3/4">
                <span className="text-lg mr-4" style={{ color: ringColor }}>{stat.icon}</span>
                <span className="text-white font-bold text-base font-[Orbitron,Oxanium,sans-serif] mr-2">{stat.value}</span>
                <span className="text-xs text-zinc-400 mt-0.5">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Right panel placeholder for future cards */}
        <div className="flex-1" />
      </div>
    </>
  );
}

/* Add to your global CSS (e.g. globals.css or in a <style jsx global>)
@keyframes float-slow { 0% { transform: translateY(0); } 50% { transform: translateY(-16px); } 100% { transform: translateY(0); } }
@keyframes float-slower { 0% { transform: translateY(0); } 50% { transform: translateY(-8px); } 100% { transform: translateY(0); } }
.animate-float-slow { animation: float-slow 4s ease-in-out infinite; }
.animate-float-slower { animation: float-slower 7s ease-in-out infinite; }
*/



