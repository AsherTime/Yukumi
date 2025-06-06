"use client"; // ✅ Mark as a client component

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { handleDailyCheckIn } from "@/utils/dailyTasks";
import { toast } from "sonner";
import { awardPoints } from "@/utils/awardPoints";

interface AuthContextType {
    user: User | null;
    loading: boolean; // ✅ Add loading property
    signOut: () => Promise<void>;
}  

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, signOut: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // ✅ Initialize loading

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

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Award points for daily login
      try {
        await awardPoints(
          data.user.id,
          'daily_login',
          10,
          data.user.id,
          'user'
        );
        toast.success('Welcome back! +10 XP');
      } catch (pointsError) {
        console.error('Failed to award points for daily login:', pointsError);
      }

      return data;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
