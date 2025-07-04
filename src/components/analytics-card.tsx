import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react"


export default function AnalyticsCard({ userId }: { userId: string | undefined}) {

  const [stats, setStats] = useState({
    views: 0,
    likes: 0,
    comments: 0,
  })

  useEffect(() => {
    async function fetchStats() {

      if (!userId) {
        console.error("Failed to get user")
        return
      }

      const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const { data, error } = await supabase
        .from("posts")
        .select("views, likes_count, comments_count")
        .gte("created_at", oneMonthAgo)
        .eq("user_id", userId)

      if (error) {
        console.error("Failed to fetch post stats:", error)
        return
      }

      const totals = data.reduce(
        (acc, post) => {
          acc.views += post.views || 0
          acc.likes += post.likes_count || 0
          acc.comments += post.comments_count || 0
          return acc
        },
        { views: 0, likes: 0, comments: 0 }
      )

      setStats(totals)
    }

    fetchStats()
  }, [userId])


return (
  <div className="bg-zinc-900 rounded-2xl p-6 shadow-md text-white w-full">
    <h3 className="text-lg font-semibold mb-4">Monthly Post Analytics</h3>
    <div className="mb-4">
      <div className="text-zinc-400 text-sm">Total Views Last Month:</div>
      <div className="text-3xl font-bold text-pink-400">{stats.views}</div>
    </div>
    <div className="mb-2">
      <div className="text-zinc-400 text-sm">Total Likes Last Month:</div>
      <div className="text-xl font-bold">{stats.likes}</div>
    </div>
    <div className="mb-2">
      <div className="text-zinc-400 text-sm">Total Comments Last Month:</div>
      <div className="text-xl font-bold">{stats.comments}</div>
    </div>
  </div>
);
  }