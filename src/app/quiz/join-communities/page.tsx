"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Check, ChevronsRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { useNavigationContext } from '@/contexts/NavigationContext';
import { flushSync } from "react-dom"

interface Community {
  id: string;
  title: string;
  banner_url: string;
}

export default function JoinCommunities() {
  const [open, setOpen] = useState(false)
  const [value] = useState<string>()
  const [communities, setCommunities] = useState<Community[]>([])
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const router = useRouter();

  const { fromPage, setFromPage } = useNavigationContext();

  useEffect(() => {
    const fromPageReload = sessionStorage.getItem("fromPageReload");
    if (fromPage !== 'profile-setup' && fromPageReload !== 'profile-setup') {
      router.replace('/unauthorized'); // or '/'
    }
    sessionStorage.removeItem("fromPageReload");
  }, [fromPage, router]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem("fromPageReload", "profile-setup");
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);


  async function fetchCommunities() {

    try {
      const { data: communities, error } = await supabase
        .from("community").
        select("id, title, banner_url");

      if (error)
        throw error;
      else
        setCommunities(communities);
    } catch (error) {
      console.log(error);
    }

  }

  const handleNext = async () => {
    const { error } = await supabase
      .from("members")
      .upsert(
        joinedCommunities.map((community) => ({
          community_id: community.id,
        })),
        { onConflict: 'user_id, community_id' }
      );

    if (error) {
      console.error("Failed to update joined communities:", error.message);
      // Optionally show toast or error UI
      return;
    }
    flushSync(() => {
      setFromPage("join-communities");
    });
    router.push("/quiz/anime-categories");
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  return (
    <div className="min-h-screen bg-black overflow-y-auto relative px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        <h1 className="text-4xl font-bold text-white text-center mb-8">Join Communities</h1>

        {/* Animated orbs */}
        <motion.div
          className="absolute top-20 left-20 w-64 h-64 rounded-full bg-purple-500/20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-green-500/20 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 5,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[300px] justify-between hover:scale-105 transition-transform duration-200"
            >
              {value
                ? communities.find((community) => community.title === value)?.title
                : "Select community..."}

              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0 bg-zinc-800">
            <Command>
              <CommandInput placeholder="Search communities..." />
              <CommandList>
                <CommandEmpty>No community found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {communities.map((community) => (
                    <CommandItem
                      key={community.id}
                      value={community.title}
                      onSelect={() => {
                        const alreadySelected = joinedCommunities.find((c) => c.id === community.id);
                        if (alreadySelected) {
                          setJoinedCommunities((prev) => prev.filter((c) => c.id !== community.id));
                        } else {
                          setJoinedCommunities((prev) => [...prev, community]);
                        }
                      }}


                      className="cursor-pointer hover:bg-accent"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          joinedCommunities.some((c) => c.id === community.id) ? "opacity-100" : "opacity-0"
                        )}
                      />


                      {community.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="text-sm text-white">
          {joinedCommunities.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {joinedCommunities.map((c) => (
                <li key={c.id}>
                  <button
                    className={`
              w-full px-6 py-4 text-white font-medium rounded-full
              bg-gradient-to-r from-pink-400 to-purple-600
              hover:opacity-90 transition-all duration-200
              ${c.banner_url ? 'bg-cover bg-center text-white' : ''}
            `}
                    style={c.banner_url ? { backgroundImage: `url(${c.banner_url})` } : {}}
                  >
                    <span className={`${c.banner_url ? 'bg-black/70' : ''} rounded-md`}>
                      {c.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            "No communities selected."
          )}
        </div>


        <div className="flex gap-4 mt-8">
          <Button
            onClick={handleNext}
            className="bg-[#B624FF] hover:bg-[#B624FF]/80 text-white"
          >
            Next
            <ChevronsRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

