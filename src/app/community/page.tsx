"use client";
import { ContentFeed } from "@/components/content-feed"
import { CommunitiesSidebar } from "@/components/communities-sidebar"
import { RecentPosts } from "@/components/recent-posts"
import { TopNav } from "@/components/top-nav"
import Footer from "@/components/footer"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Upload, TrendingUp } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  liked_by_user: boolean;
  image_url: string;
  animetitle_post: string | null;
  post_collections: string | null;
  original_work: boolean;
  reference_link: string | null;
  Profiles?: {
    avatar_url: string;
    display_name: string;
  };
}

interface Community {
  id: number;
  title: string;
  members: number;
  banner_url: string;
  avatar_url: string;
}

interface Tag {
  name: string;
  post_count: number;
}

export default function CommunityPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState("Recommended")
  const [searchQuery, setSearchQuery] = useState("")
  const [communities, setCommunities] = useState<Community[]>([])
  const [trendingTags, setTrendingTags] = useState<Tag[]>([])
  const [recentCommunities, setRecentCommunities] = useState<Community[]>([])
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([])
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetchCommunities()
    fetchTrendingTags()
    if (user) {
      fetchRecentCommunities()
      fetchJoinedCommunities()
    }
  }, [user])

  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('community')
        .select('*')
        .order('members', { ascending: false })
        .limit(10)

      if (error) throw error
      setCommunities(data || [])
    } catch (error) {
      console.error('Error fetching communities:', error)
      toast.error('Failed to load communities')
    }
  }

  const fetchTrendingTags = async () => {
    try {
      const { data, error } = await supabase
        .from('community')
        .select('trending_tags')

      if (error) throw error
      const tagCounts: Record<string, number> = {}
      const tagData = Array.isArray(data) ? data : []
      tagData.forEach((row: any) => {
        (row.trending_tags || []).forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1
        })
      })
      const tags = Object.entries(tagCounts)
        .map(([name, count]) => ({ name, post_count: count }))
        .sort((a, b) => b.post_count - a.post_count)
        .slice(0, 10)
      setTrendingTags(tags)
    } catch (error) {
      console.error('Error fetching trending tags:', error)
      toast.error('Failed to load trending tags')
    }
  }

  const fetchRecentCommunities = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('recent_communities')
        .select('community_id, community:community_id (id, title, members, banner_url, avatar_url)')
        .eq('user_id', user.id)
        .order('last_visited_at', { ascending: false })
        .limit(5)
      if (error) throw error
      setRecentCommunities((data || []).map((row: any) => row.community))
    } catch (error) {
      console.error('Error fetching recent communities:', error)
    }
  }

  const fetchJoinedCommunities = async () => {
    if (!user) return;
    try {
      // Step 1: Get the list of community_ids the user follows
      const { data: follows, error: followsError } = await supabase
        .from('follows')
        .select('community_id')
        .eq('user_id', user.id)
        .limit(10);
      if (followsError) throw followsError;

      const communityIds = (follows || []).map((row: any) => row.community_id);
      if (communityIds.length === 0) {
        setJoinedCommunities([]);
        return;
      }

      // Step 2: Fetch the community details
      const { data: communities, error: communitiesError } = await supabase
        .from('community')
        .select('id, title, members, banner_url, avatar_url')
        .in('id', communityIds);

      if (communitiesError) throw communitiesError;
      setJoinedCommunities(communities || []);
    } catch (error) {
      console.error('Error fetching joined communities:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Top Navigation */}
        <TopNav />

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 mt-20">
          <div className="flex justify-center w-full gap-8">
            {/* Left Sidebar */}
            <div className="col-span-3 lg:block hidden">
              <div className="space-y-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search communities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-black/40 border-white/10 focus:border-purple-500"
                  />
                </div>
                
                {/* Recent Communities */}
                {recentCommunities.length > 0 && (
                  <div>
                    <h4 className="text-xs text-zinc-400 mb-2">Recent</h4>
                    <ScrollArea className="max-h-40 mb-4">
                      <div className="space-y-2">
                        {recentCommunities.map((community) => (
                          <div key={community.id} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 cursor-pointer">
                            <img src={community.avatar_url || "/avatar-placeholder.png"} alt={community.title} className="w-8 h-8 rounded-full object-cover" />
                            <span className="text-sm text-white">{community.title}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                {/* Joined Communities */}
                {joinedCommunities.length > 0 && (
                  <div>
                    <h4 className="text-xs text-zinc-400 mb-2">Communities</h4>
                    <ScrollArea className="max-h-40">
                      <div className="space-y-2">
                        {joinedCommunities.map((community) => (
                          <div key={community.id} className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/60 hover:bg-zinc-800 cursor-pointer">
                            <img src={community.avatar_url || "/avatar-placeholder.png"} alt={community.title} className="w-8 h-8 rounded-full object-cover" />
                            <span className="text-sm text-white">{community.title}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
                {/* All Communities (search results) */}
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-2">
                    {communities
                      .filter((community) =>
                        community.title.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((community) => (
                        <div
                          key={community.id}
                          className="p-3 rounded-lg bg-black/40 border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                              {community.avatar_url ? (
                                <img
                                  src={community.avatar_url}
                                  alt={community.title}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-lg font-bold text-purple-400">
                                  {community.title[0]}
                                </span>
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium">{community.title}</h3>
                              <p className="text-sm text-gray-400">{community.members} members</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Main Feed */}
            <div className="w-full max-w-2xl flex flex-col gap-y-6">
              <div className="relative rounded-2xl bg-[#1f1f1f] border border-zinc-800 shadow-md max-h-[90vh] overflow-y-auto">
                {/* Sticky Filter Bar - unified with card, no gap, same bg */}
                <div className="sticky top-0 z-10 w-full bg-[#1f1f1f] border-b border-zinc-800">
                  <div className="flex gap-3 min-w-max py-2 px-4">
                    {['Recommended', 'Recents'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-full font-semibold transition-all duration-200 whitespace-nowrap focus:outline-none
                          ${activeTab === tab
                            ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow scale-105'
                            : 'bg-[#232232] text-zinc-300 hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white'}
                        `}
                        style={{ boxShadow: activeTab === tab ? '0 2px 16px 0 rgba(236,72,153,0.2)' : undefined }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Post Feed - no margin above, no extra padding, unified bg */}
                <div>
                  <ContentFeed 
                    recentPosts={recentPosts}
                    setRecentPosts={setRecentPosts}
                    selectedAnime={[]}
                    homepageStyle={true}
                  />
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="w-64 flex-shrink-0 lg:block hidden">
              <div className="space-y-6">
                <Button className="w-full bg-black border border-white/10 hover:bg-white/5">
                  <Upload className="mr-2 h-4 w-4" />
                  POST NOW
                </Button>

                <Card className="bg-black/40 border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2 mb-4">
                      <TrendingUp className="h-5 w-5 text-purple-400" />
                      <h3 className="font-medium">Trending Tags</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trendingTags.map((tag) => (
                        <Badge
                          key={tag.name}
                          variant="secondary"
                          className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 cursor-pointer"
                        >
                          {tag.name}
                          <span className="ml-1 text-xs text-purple-200/70">
                            {tag.post_count}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
 
