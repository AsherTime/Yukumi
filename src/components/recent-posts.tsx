import { Eye, TrendingUp } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export function RecentPosts() {
  const posts = Array(10)
    .fill(null)
    .map((_, i) => ({
      id: i,
      title: i % 2 === 0 ? "Chainsaw Man Fanart" : "Solo Leveling Fanart",
      views: "20k",
      trending: "15k",
      image: "/placeholder.svg?height=80&width=80",
    }))

  return (
    <div className="w-[300px] border-l border-zinc-800 flex flex-col">
      <div className="h-[calc(100vh-104px)] mt-[104px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800">
        <div className="px-4 pb-4">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Posts</h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/post/${post.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-800/50"
              >
                <div className="relative h-16 w-16 overflow-hidden rounded-md">
                  <Image src={post.image || "/placeholder.svg"} alt={post.title} fill className="object-cover" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">{post.title}</h3>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {post.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {post.trending}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

