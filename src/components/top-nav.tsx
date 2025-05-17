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


const NAV_LINKS = [
  { href: "/homepage", label: "Home" },
  { href: "/anime", label: "Anime" },
  { href: "/community/a8a96442-c394-41dd-9632-8a968e53a7fe", label: "Community" },
  { href: "/tracker", label: "Tracker" },
]

type Anime = { id: number | string; title: string };
type Community = { id: number | string; title: string };
type User = { id: number | string; username: string };

type SearchResults = {
  anime: Anime[];
  community: Community[];
  users: User[];
} | null; // allow null when no results or cleared

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


  const performSearch = async (query: string) => {

  const { data, error } = await supabase
  .from('Anime')
  .select('id, title')
  .textSearch('title', query, { type: 'websearch' });

  const [animeRes, communityRes, userRes] = await Promise.all([
    supabase.from('Anime')
      .select('id, title')
      .ilike('title', `%${query}%`),

    supabase.from('community')
      .select('id, title')
      .ilike('title', `%${query}%`),

    supabase.from('Profiles')
      .select('id, username')
      .ilike('username', `%${query}%`)
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



  return (
    <div className={`overflow-hidden ${isDashboard ? "min-h-screen" : ""}`}> 
      {/* Fixed Navbar - full width, flush with top, no extra block below */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-[#181828] border-b border-zinc-800 shadow-sm m-0 p-0">
        <nav className="flex items-center px-8 py-4 m-0 p-0 w-full">
          <Link href="/" className="relative w-24 h-8 mr-8">
            <Image
              src={"https://res.cloudinary.com/difdc39kr/image/upload/v1740159528/Simplification_gho0s6.svg"}
              alt="YUKUMI"
              width={96}
              height={32}
              className="object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-white hover:text-gray-300 transition-colors text-sm relative group"
              >
                {link.label}
                <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-white transform scale-x-0 transition-transform duration-300 group-hover:scale-x-100"></span>
              </Link>
            ))}
          </div>
          <div className="flex justify-end w-full">
            <div className="relative flex-1 max-w-md mr-10">
  <select
  value={selectedCategory}
  onChange={(e) => setSelectedCategory(e.target.value as 'anime' | 'community' | 'users')}
  className="absolute inset-y-0 left-0 w-20 appearance-none bg-[#f8f8f8] text-black px-2 py-2 rounded-l border-r border-gray-300 focus:outline-none"
>
  <option value="anime">Anime</option>
  <option value="community">Community</option>
  <option value="users">Users</option>
</select>


   <input
      type="text"
      placeholder="Search anime, community, users..."
      value={searchTerm}
      onChange={handleChange}
      className="w-full pl-24 pr-10 py-2 bg-[#f8f8f8] text-black rounded focus:outline-none"
    />



 {searchResults && (
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
                <Link href="/notifications" className="text-white hover:text-gray-300 transition-colors">
                  <Bell className="w-5 h-5" />
                </Link>
                <Link href="/profile" className="text-white hover:text-gray-300 transition-colors">
                  <User className="w-5 h-5" />
                </Link>
                <LogoutButton />
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
