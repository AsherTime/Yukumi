import Image from "next/image"
import { Eye, MessageCircle, ArrowUp, Star } from "lucide-react"
import Link from "next/link"

interface ContentCardProps {
  title: string
  image: string
  views: string
  comments: string
  upvotes: string
}

function ContentCard({ title, image, views, comments, upvotes }: ContentCardProps) {
  return (
    <div className="bg-white/5 rounded-lg overflow-hidden mb-4">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400 fill-current" />
            <div className="h-2 w-2 rounded-full bg-yellow-400" />
          </div>
        </div>

        <Link href={`/content/${title}`}>
          <Image
            src={image || "/placeholder.svg"}
            alt={title}
            width={800}
            height={400}
            className="rounded-lg w-full hover:opacity-90 transition-opacity"
          />
        </Link>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-8">
            <Link href={`/content/${title}/views`} className="flex items-center gap-2 hover:text-primary transition">
              <Eye className="h-5 w-5" />
              <span>{views}</span>
            </Link>
            <Link href={`/content/${title}/comments`} className="flex items-center gap-2 hover:text-primary transition">
              <MessageCircle className="h-5 w-5" />
              <span>{comments}</span>
            </Link>
          </div>
          <Link href={`/content/${title}/upvotes`} className="flex items-center gap-2 hover:text-primary transition">
            <ArrowUp className="h-5 w-5" />
            <span>{upvotes}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export function ContentSections() {
  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-1">
        <h2 className="text-xl font-bold mb-4">Recent Posts</h2>
        <div className="content-scroll pr-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <ContentCard
              key={`recent-${i}`}
              title={`Recent Post ${i + 1}`}
              image="/placeholder.svg?height=400&width=800"
              views="20k"
              comments="5k"
              upvotes="15k"
            />
          ))}
        </div>
      </div>

      <div className="col-span-1">
        <h2 className="text-xl font-bold mb-4">Popular Posts</h2>
        <div className="content-scroll pr-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <ContentCard
              key={`popular-${i}`}
              title={`Popular Post ${i + 1}`}
              image="/placeholder.svg?height=400&width=800"
              views="50k"
              comments="10k"
              upvotes="30k"
            />
          ))}
        </div>
      </div>

      <div className="col-span-1">
        <h2 className="text-xl font-bold mb-4">Featured Posts</h2>
        <div className="content-scroll pr-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <ContentCard
              key={`featured-${i}`}
              title={`Featured Post ${i + 1}`}
              image="/placeholder.svg?height=400&width=800"
              views="100k"
              comments="20k"
              upvotes="60k"
            />
          ))}
        </div>
      </div>
    </div>
  )
}

