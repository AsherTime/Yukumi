import { TopNav } from "@/components/top-nav"
import { UserProfile } from "@/components/user-profile"
import Footer from "@/components/footer"

export default function ProfilePage() {
  return (
    <div className="relative z-10 max-w-7xl mx-auto px-8 pt-20">
      <TopNav />
      <UserProfile />
      <Footer />
    </div>
  )
}

