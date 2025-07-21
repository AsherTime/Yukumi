"use client"; // ✅ Mark as a client component

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { handleDailyCheckIn } from "@/utils/dailyTasks";
import { toast } from "sonner";
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean; // ✅ Add loading property
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, signOut: async () => { } });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // ✅ Initialize loading
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user) return; // only for logged-in users

      const { data } = await supabase
        .from("Profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      sessionStorage.setItem("fromNoProfile", "register");
      if (!data && pathname !== '/profile-setup') {
        router.push("/profile-setup");
      }
    };

    checkProfileCompletion();
  }, [user, pathname, router]);


  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      setLoading(false); // ✅ Set loading to false when Firebase checks authentication

      // Handle daily check-in when user logs in
      if (newUser) {
        try {
          const wasAwarded = await handleDailyCheckIn(newUser.id);
          if (wasAwarded) {
            toast.success("Daily check-in completed! +5 XP");
          }
        } catch (error) {
          console.error("Error handling daily check-in:", error);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
