"use client"

import { useEffect, useState, useCallback } from "react";
import Image from "next/image"
import Link from "next/link"
import { Search, Bell, User, Upload } from "lucide-react"
import LogoutButton from "./logout";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCheck } from 'lucide-react'; // or any other icon



type Anime = { id: number | string; title: string };
type Community = { id: number | string; title: string };
type User = { id: number | string; username: string };

type SearchResults = {
  anime: Anime[];
  community: Community[];
  users: User[];
} | null; // allow null when no results or cleared

type Notification = {
  id: string
  user_id: string
  type: 'follow' | 'comment_reply' | 'like_milestone'
  from_user_id: string
  post_id?: string
  message: string
  is_read: boolean
  created_at: string
}


export function TopNav({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard"; // Change the path if needed
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResults>({
    anime: [],
    community: [],
    users: [],
  });
  const [selectedCategory, setSelectedCategory] = useState<'anime' | 'community' | 'users'>('anime');
  const [navLinks, setNavLinks] = useState([
    { href: "/homepage", label: "Home" },
    { href: "/anime", label: "Anime" },
    { href: "/community/a8a96442-c394-41dd-9632-8a968e53a7fe", label: "Community" },
    { href: "/tracker", label: "Tracker" },
  ]);
  const [userProfile, setUserProfile] = useState<any>(null);


  useEffect(() => {
    const fetchFirstCommunity = async () => {
      const user = supabase.auth.getUser(); // or however you get the user ID
      const userId = (await user).data.user?.id;

      if (!userId) return;

      const { data, error } = await supabase
        .from("members")
        .select("community_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }) // assuming joined_at column exists
        .limit(1)
        .maybeSingle();

      if (data?.community_id) {
        setNavLinks((prev) =>
          prev.map((link) =>
            link.label === "Community"
              ? { ...link, href: `/community/${data.community_id}` }
              : link
          )
        );
      }
    };

    fetchFirstCommunity();
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      try {
        const { data: profile, error } = await supabase
          .from('Profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!error && profile) {
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  const performSearch = async (query: string) => {


    let profilesQuery = supabase
      .from('Profiles')
      .select('id, username')
      .ilike('username', `%${query}%`);

    if (user?.id) {
      // exclude the logged-in user
      profilesQuery = profilesQuery.neq('id', user.id);
    }


    const [animeRes, communityRes, userRes] = await Promise.all([
      supabase.from('Anime')
        .select('id, title')
        .ilike('title', `%${query}%`),

      supabase.from('community')
        .select('id, title')
        .ilike('title', `%${query}%`),

      profilesQuery,
    ]);

    return {
      anime: animeRes.data || [],
      community: communityRes.data || [],
      users: userRes.data || [],
    };
  };

  function debounce<T extends (...args: any[]) => void>(
    fn: T,
    delay = 300
  ): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  }


  const debouncedSearch = useCallback(
    debounce(async (query) => {
      if (query.trim()) {
        const results = await performSearch(query);
        setSearchResults(results);
      } else {
        setSearchResults(null);
      }
    }, 300),
    []
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const [notifications, setNotifications] = useState<Notification[]>([])


  useEffect(() => {
    let isMounted = true;

    if (!user?.id) return;

    const fetchNotifications = async () => {
      // Step 1: Fetch user preferences
      const { data: profilePrefs, error: prefsError } = await supabase
        .from('Profiles')
        .select('notif_all, notif_likes, notif_replies, notif_follows')
        .eq('id', user.id)
        .maybeSingle();

      if (prefsError) {
        console.error('Error fetching preferences:', prefsError.message);
        return;
      }

      if(profilePrefs){

      const { notif_all, notif_likes, notif_replies, notif_follows } = profilePrefs;

      // Step 2: Build filter types based on preferences
      let typesToInclude: string[] = [];

      if (notif_all) {
        typesToInclude = ['like_milestone', 'comment_reply', 'follow'];
      } else {
        if (notif_likes) typesToInclude.push('like_milestone');
        if (notif_replies) typesToInclude.push('comment_reply');
        if (notif_follows) typesToInclude.push('follow');
      }

      // If no types are included, don't bother querying
      if (typesToInclude.length === 0) {
        return;
      }

      // Step 3: Fetch notifications matching selected types
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .in('type', typesToInclude)
        .order('created_at', { ascending: false });

      if (!error && data && isMounted) {
        setNotifications(data as Notification[]);
      } else if (error) {
        console.error('Error fetching notifications:', error.message);
      }
    }
    };

    fetchNotifications();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);


  const handleNotificationClick = async (notification: Notification) => {
    // Mark it as read
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notification.id);

    // Redirect
    if (notification.type === 'follow') {
      router.push(`/profile/${notification.from_user_id}`);
    } else if (notification.type === 'comment_reply' || notification.type === 'like_milestone') {
      router.push(`/post/${notification.post_id}`);
    }
  };

  const markAllNotificationsAsRead = async (userId: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false); // optional, updates only unread ones

    if (error) {
      console.error("Failed to mark notifications as read:", error.message);
    }
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true }))
    );
  };



  const [open, setOpen] = useState(false)


  return (
    <div className={`overflow-hidden ${isDashboard ? "min-h-screen" : ""}`}>
      {/* Fixed Navbar - full width, flush with top, no extra block below */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-black border-b border-zinc-800 shadow-sm m-0 p-0">
        <nav className="flex items-center px-8 py-4 m-0 p-0 w-full">
          <div className="relative mr-8">
            <Image
              src={"https://res.cloudinary.com/difdc39kr/image/upload/v1740159528/Simplification_gho0s6.svg"}
              alt="YUKUMI"
              width={192}
              height={64}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-white text-sm relative px-2 py-1 transition-colors duration-200 rounded group hover:bg-white hover:text-black"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex justify-end w-full">
            <div className="relative flex-1 max-w-md mr-10">
              <select
                value={selectedCategory}
                id="category"
                onChange={(e) => setSelectedCategory(e.target.value as 'anime' | 'community' | 'users')}
                className="absolute inset-y-0 left-0 w-30 appearance-none bg-[#f8f8f8] text-black px-2 py-2 rounded-l border-r border-gray-300 focus:outline-none"
              >
                <option value="anime">Anime</option>
                <option value="community">Community</option>
                <option value="users">Users</option>
              </select>


              <input
                type="text"
                id="search"
                placeholder="Search anime, community, users..."
                value={searchTerm}
                onChange={handleChange}
                className="w-full pl-32 pr-10 py-2 bg-[#f8f8f8] text-black rounded focus:outline-none"
              />



              {searchTerm.trim() !== '' && searchResults && (
                <div className="absolute bg-white shadow-lg z-10 w-full max-w-md border border-gray-300 rounded mt-1">

                  {selectedCategory === 'anime' && searchResults.anime.length > 0 && (
                    <div>
                      {searchResults.anime.map((anime) => (
                        <button
                          key={anime.id}
                          onClick={() => router.push(`/anime/${anime.id}`)}
                          className="cursor-pointer text-black hover:bg-gray-100 p-2 w-full text-left"
                        >
                          {anime.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedCategory === 'community' && searchResults.community.length > 0 && (
                    <div>
                      {searchResults.community.map((community) => (
                        <button
                          key={community.id}
                          onClick={() => router.push(`/community/${community.id}`)}
                          className="cursor-pointer text-black hover:bg-gray-100 p-2 w-full text-left"
                        >
                          {community.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedCategory === 'users' && searchResults.users.length > 0 && (
                    <div>
                      {searchResults.users.map((user) => (
                        <button
                          key={user.id}
                          onClick={() => router.push(`/profile/${user.id}`)}
                          className="cursor-pointer text-black hover:bg-gray-100 p-2 w-full text-left"
                        >
                          {user.username}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Optional: Show a message if no results in the selected category */}
                  {selectedCategory === 'anime' && searchTerm.trim() !== '' && searchResults.anime.length === 0 && (
                    <div className="text-gray-500 p-2">No anime found.</div>
                  )}
                  {selectedCategory === 'community' && searchTerm.trim() !== '' && searchResults.community.length === 0 && (
                    <div className="text-gray-500 p-2">No communities found.</div>
                  )}
                  {selectedCategory === 'users' && searchTerm.trim() !== '' && searchResults.users.length === 0 && (
                    <div className="text-gray-500 p-2">No users found.</div>
                  )}

                </div>
              )}


              <button
                type="button"
                className="absolute inset-y-0 right-0 px-3 flex items-center"
              >
                <Search className="h-5 w-5 text-gray-500" />
              </button>
            </div>

          </div>
          <div className="flex items-center gap-6 ml-auto">
            {user ? (
              // Logged-in view
              <>
                <Link href="/upload" className="text-white hover:text-gray-300 transition-colors">
                  <Upload className="w-5 h-5" />
                </Link>
                <div className="relative">
                  <button onClick={() => setOpen(!open)} className="relative">
                    <Bell />
                    {notifications.some(n => !n.is_read) && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                        {notifications.filter(n => !n.is_read).length}
                      </span>
                    )}
                  </button>
                  {open && (
                    <Card className="absolute right-0 mt-2 w-80 max-h-96 bg-black overflow-y-auto z-50 shadow-lg">
                      <CardContent className="p-2 space-y-2">
                        {/* Mark All as Read Button */}
                        {notifications.length > 0 && (
                          <button
                            onClick={() => markAllNotificationsAsRead(user.id)}
                            className="flex items-center gap-2 text-xs text-blue-400 hover:underline px-2 mb-1"
                          >
                            <CheckCheck className="w-4 h-4" />
                            Mark all as read
                          </button>
                        )}

                        {notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`cursor-pointer text-sm border-b last:border-none pb-2 hover:bg-zinc-800 px-2 py-1 rounded ${n.is_read ? 'opacity-60' : 'opacity-100'
                              }`}
                          >
                            <p>{n.message}</p>
                            <span className="text-xs text-gray-400">
                              {new Date(n.created_at).toLocaleString()}
                            </span>
                          </div>
                        ))}

                      </CardContent>
                    </Card>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <div className="relative h-8 w-8 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-pink-500 transition-all">
                      {userProfile?.avatar_url ? (
                        <img
                          src={userProfile.avatar_url}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full bg-zinc-700 flex items-center justify-center">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[#181828] border border-zinc-800">
                    <DropdownMenuItem className="text-white hover:bg-zinc-800 cursor-pointer">
                      <Link href={`/profile/${user.id}`} className="flex items-center w-full">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-white hover:bg-zinc-800 cursor-pointer">
                      <Link href="/settings" className="flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-500 hover:bg-zinc-800 cursor-pointer"
                      onClick={() => {
                        const logoutButton = document.querySelector('[data-logout-button]');
                        if (logoutButton) {
                          (logoutButton as HTMLButtonElement).click();
                        }
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="hidden">
                  <LogoutButton />
                </div>
              </>
            ) : (
              // Logged-out view  
              <>
                <Link href="/auth/login">Login</Link>
                <Link href="/auth/register">Register</Link>
              </>
            )}
          </div>
        </nav>
      </header>
      {/* Children for dashboard pages */}
      {isDashboard && children}
    </div>
  )
}
