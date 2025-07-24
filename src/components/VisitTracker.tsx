// components/VisitTracker.tsx
'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function VisitTracker() {
  useEffect(() => {
    const logVisit = async () => {
      const path = window.location.pathname;
      const sessionKey = `visited_${path}`;
      if (sessionStorage.getItem(sessionKey)) return;
      sessionStorage.setItem(sessionKey, 'true');

      const { data: userData } = await supabase.auth.getUser();

      let ip = 'unknown';
      try {
        const res = await fetch("https://api.ipify.org?format=json");
        const json = await res.json();
        ip = json.ip;
      } catch (err) {
        console.error("Failed to fetch IP:", err);
      }

      await supabase.from("visits").insert({
        user_id: userData?.user?.id || null,
        ip_address: ip,
        path,
      });
    };

    logVisit();
  }, []);

  return null;
}
