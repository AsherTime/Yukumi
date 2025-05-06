import { TopNav } from "@/components/top-nav"
import { UserProfile } from "@/components/user-profile"
import { UserPosts } from "@/components/user-posts"

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <TopNav />

      <main className="container mx-auto px-4 py-8">
        <UserProfile />
        <UserPosts />
      </main>
    </div>
  )
}

