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
import { FiCalendar, FiAward, FiGift, FiClock, FiStar, FiTrendingUp } from 'react-icons/fi';
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

  return (
    <>
      <TopNav />
      {/* XP & Level Header - now above main */}
      <div className="bg-[#181828] rounded-xl mx-2 md:mx-6 mt-4 mb-6 shadow-lg flex flex-col md:flex-row items-center justify-between border-l-4 border-[#FF00FF] z-10 relative">
        <div className="flex items-center gap-2">
          <span className="text-[#FF00FF] text-lg font-bold uppercase tracking-wider">LEVEL {currentLevel}</span>
          <span className="w-3 h-3 bg-[#FF00FF] rounded-full inline-block"></span>
        </div>
        <span className="text-[#FF00FF] font-bold text-lg ml-auto">{currentXP} XP</span>
        <div className="w-full md:w-1/2 h-3 bg-gray-800 rounded-full overflow-hidden mt-4 md:mt-0 md:ml-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(currentXP / xpToNextLevel) * 100}%` }}
            className="h-full bg-[#FF00FF] rounded-full"
          />
        </div>
      </div>
      <main className="min-h-screen bg-[#0F0F0F] text-white p-2 md:p-6">
        {/* First Row Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Score Card */}
          <div className="bg-[#181828] rounded-xl p-4 shadow-lg border-l-4 border-[#FFA500]">
            <h3 className="font-bold uppercase text-[#FFA500] mb-2">Score</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Posts</span><span className="text-[#00FFFF]">62 XP</span></div>
              <div className="flex justify-between"><span>Comments</span><span className="text-[#00FFFF]">450 XP</span></div>
              <div className="flex justify-between"><span>Events</span><span className="text-[#00FFFF]">920 XP</span></div>
              <div className="flex justify-between"><span>List</span><span className="text-[#00FFFF]">20 XP</span></div>
              <div className="flex justify-between"><span>Logins</span><span className="text-[#00FFFF]">12 XP</span></div>
              <div className="flex justify-between"><span>Quizzes</span><span className="text-[#00FFFF]">30 XP</span></div>
            </div>
          </div>
          {/* Stats Card */}
          <div className="bg-[#181828] rounded-xl p-4 shadow-lg border-l-4 border-[#00FFFF]">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold uppercase text-[#00FFFF]">Stats (Last 7 Days)</h3>
              <button className="text-gray-400 hover:text-white"><FiClock className="w-5 h-5" /></button>
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Post Views</span><span className="text-[#FFA500]">120</span></div>
              <div className="flex justify-between"><span>Likes</span><span className="text-[#FFA500]">300 XP</span></div>
              <div className="flex justify-between"><span>Comments</span><span className="text-[#FFA500]">122 XP</span></div>
              <div className="flex justify-between"><span>Replies</span><span className="text-[#FFA500]">62 XP</span></div>
            </div>
          </div>
          {/* Graph Card */}
          <div className="bg-[#181828] rounded-xl p-4 shadow-lg border-l-4 border-[#FF00FF]">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold uppercase text-[#FF00FF]">Graph</h3>
              <button className="px-2 py-1 bg-[#FF00FF] rounded text-xs">Weekly</button>
            </div>
            <div className="h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={graphData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="visits" stroke="#FF00FF" />
                  <Line type="monotone" dataKey="follows" stroke="#00FFFF" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Button Grid, Streak, Missions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Button Grid */}
          <div className="bg-[#181828] rounded-xl p-4 shadow-lg flex flex-wrap justify-center items-center gap-3 border-l-4 border-[#FF00FF]">
            {[
              { icon: <FiCalendar />, label: 'Event History' },
              { icon: <FiTrendingUp />, label: 'Leaderboards' },
              { icon: <FiAward />, label: 'Badges' },
              { icon: <FiStar />, label: 'Achievements' },
              { icon: <FiClock />, label: 'Calendar' },
              { icon: <FiGift />, label: 'Redeem Points' },
            ].map((item, index) => (
              <button
                key={index}
                className="w-20 h-20 bg-[#1A1A1A] rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-[#2A2A2A] transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,0,255,0.3)]"
              >
                <span className="text-2xl text-[#FF00FF]">{item.icon}</span>
                <span className="text-xs text-center">{item.label}</span>
              </button>
            ))}
          </div>
          {/* Streak Tracker */}
          <div className="bg-[#181828] rounded-xl p-4 shadow-lg flex flex-col items-center border-l-4 border-[#FFA500]">
            <div className="flex items-center justify-between w-full mb-2">
              <h3 className="font-bold uppercase text-[#FFA500]">Streak Tracker</h3>
              <span className="text-[#00FFFF] text-xs">XP Boost: Active!</span>
            </div>
            <div className="flex gap-2">
              {[...Array(7)].map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center"
                  title={i < streakDays ? 'Active' : 'Inactive'}
                >
                  {i < streakDays ? (
                    <FaFire className="text-[#FFA500] w-4 h-4" />
                  ) : (
                    <span className="text-gray-600">•</span>
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-400 mt-2">Maintain 7-day streak for bonus XP</span>
          </div>
          {/* Daily/Weekly Missions */}
          <div className="bg-[#181828] rounded-xl p-4 shadow-lg border-l-4 border-[#00FFFF]">
            <h3 className="font-bold uppercase text-[#00FFFF] mb-2">Daily/Weekly Missions</h3>
            <div className="space-y-2">
              {missions.map((mission) => (
                <div key={mission.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={mission.completed}
                    readOnly
                    className="w-4 h-4 rounded border-2 border-[#FF00FF] accent-[#FF00FF]"
                  />
                  <span className={mission.completed ? 'line-through text-gray-500 text-xs' : 'text-xs'}>
                    {mission.text}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-right text-[#00FFFF] text-xs">
              3/5 missions done – +25 XP 🎁
            </div>
          </div>
        </div>

        {/* Badge Carousel */}
        <div className="bg-[#181828] rounded-xl p-4 mb-4 shadow-lg border-l-4 border-[#FF00FF]">
          <h3 className="font-bold uppercase text-[#FF00FF] mb-2">Badge Carousel</h3>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {badgesData.map((badge) => (
              <div
                key={badge.id}
                className="min-w-[140px] bg-[#2A2A2A] rounded-xl p-3 flex flex-col items-center gap-1 border border-[#222]"
              >
                <Image src={badge.icon} alt={badge.title} width={40} height={40} className="mb-1" />
                <h4 className="font-bold text-[#FF00FF] text-xs">{badge.title}</h4>
                <p className="text-xs text-gray-400">{badge.description}</p>
                <div className="flex justify-between items-center w-full mt-1">
                  <span className="text-xs">{badge.status === 'unlocked' ? '🔓 Unlocked' : '🔒 Locked'}</span>
                  <span className="text-xs text-gray-500">Level {badge.level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-[#181828] rounded-xl p-4 mb-4 shadow-lg border-l-4 border-[#FFA500]">
          <h3 className="font-bold uppercase text-[#FFA500] mb-2">Activity Timeline</h3>
          <div className="space-y-2 text-xs">
            {[
              'Posted a comment – +10 XP',
              'Daily login – +5 XP',
              'Quiz completed – +20 XP',
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-2 text-gray-300">
                <span className="w-2 h-2 bg-[#00FFFF] rounded-full"></span>
                {activity}
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard Preview */}
        <div className="bg-[#181828] rounded-xl p-4 mb-4 shadow-lg border-l-4 border-[#00FFFF]">
          <h3 className="font-bold uppercase text-[#00FFFF] mb-2">Leaderboard Preview</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#FFA500] text-left">
                  <th>Avatar</th>
                  <th>Name</th>
                  <th>Level</th>
                  <th>XP</th>
                </tr>
              </thead>
              <tbody>
                {leaderboardData.slice(0, 5).map((user) => (
                  <tr key={user.id} className="border-b border-[#222]">
                    <td>
                      <Image src={user.avatar} alt={user.name} width={28} height={28} className="rounded-full" />
                    </td>
                    <td>{user.name}</td>
                    <td>{user.level}</td>
                    <td>{user.xp}</td>
                  </tr>
                ))}
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 pt-2">
                    Your Rank: #124
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Rewards Panel */}
        <div className="bg-[#181828] rounded-xl p-4 mb-4 shadow-lg border-l-4 border-[#FFA500]">
          <h3 className="font-bold uppercase text-[#FFA500] mb-2">Rewards Panel</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#00FFFF]">
              <span>🎯</span>
              <span>Reach Level 6 to unlock: Rising Star Badge</span>
            </div>
            <div className="flex items-center gap-2 text-[#FF00FF]">
              <span>🕒</span>
              <span>Next perk unlocks in 300 XP</span>
            </div>
          </div>
        </div>

        {/* Boosts & Limited-Time Events */}
        <div className="bg-[#181828] rounded-xl p-4 mb-4 shadow-lg border-l-4 border-[#FF00FF]">
          <h3 className="font-bold uppercase text-[#FF00FF] mb-2">Boosts & Limited-Time Events</h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#FF00FF]">
              <span>🔥</span>
              <span>XP x2 Active for new posts</span>
            </div>
            <div className="flex items-center gap-2 text-[#00FFFF]">
              <span>🎊</span>
              <span>Weekend Bonus: +25 XP on comments</span>
            </div>
          </div>
        </div>

        {/* Calendar Contribution Graph */}
        <div className="bg-[#181828] rounded-xl p-4 mb-4 shadow-lg border-l-4 border-[#FFA500]">
          <h3 className="font-bold uppercase text-[#FFA500] mb-2">Calendar Contribution Graph</h3>
          <div className="grid grid-cols-7 gap-1">
            {activityCalendar.map((day, i) => (
              <div
                key={i}
                className={`
                  aspect-square rounded-sm cursor-pointer
                  ${[
                    'bg-[#FFA500] opacity-20',
                    'bg-[#FFA500] opacity-40',
                    'bg-[#FFA500] opacity-60',
                    'bg-[#FFA500] opacity-80',
                    'bg-[#FFA500] opacity-100',
                  ][day.intensity]}
                  transition-opacity
                `}
                title={`Logged in – ${day.date} – ${day.xp} XP`}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}



