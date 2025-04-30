import { Star } from "lucide-react"

export function Achievements() {
  return (
    <div className="bg-background/50 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">ACHIEVEMENTS</h2>
      <div className="text-center mb-4">
        <div className="text-lg font-bold">Total Achievements: 24</div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400 fill-current" />
            <span>Get 10K+ views</span>
          </div>
          <span className="text-white/60">x15</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400 fill-current" />
            <span>Get 10K+ upvotes</span>
          </div>
          <span className="text-white/60">x9</span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className="text-lg">20 POSTS</div>
        <div className="text-lg">50K VIEWS</div>
        <div className="text-lg">30K UPVOTES</div>
      </div>
    </div>
  )
}

