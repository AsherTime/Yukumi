// src/app/page.tsx
"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { ImageCarousel } from "@/components/image-carousel"
import { CarouselProvider, useCarousel } from "@/contexts/carousel-context"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { ButtonCarousel } from "@/components/button-carousel"
import Footer from "@/components/footer"
import { TopNav } from "@/components/top-nav"

function MainContent() { 
  const carousel = useCarousel(); 
  const activeImage = carousel?.activeImage || "/placeholder.svg";
  const mainRef = useRef<HTMLDivElement>(null) 
  const [user, setUser] = useState<null | object>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)
      } catch (error) {
        console.error("Error checking user session:", error)
        setUser(null)
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Don't render auth-dependent content until after hydration
  if (!mounted) {
    return (
      <main
        ref={mainRef}
        className="relative min-h-screen overflow-hidden"
      >
        <div
          className="absolute inset-0 bg-cover bg-top z-0 transition-opacity duration-500"
          style={{
            backgroundImage: `url(${encodeURI(activeImage)})`,
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-8 pt-20 flex flex-row h-[calc(100vh-80px)] justify-between items-center">
          <div className="flex flex-col items-center gap-0 relative">
            <div className="relative w-full flex justify-center mt-2 max-w-md h-[300px]">
              <ImageCarousel />
            </div>
            <div className="w-full max-w-lg">
              <ButtonCarousel />
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      ref={mainRef}
      className="relative min-h-screen overflow-hidden"
    >
      {/* Dynamic Background */}
      <div
        className="absolute inset-0 bg-cover bg-top z-0 transition-opacity duration-500"
        style={{
          backgroundImage: `url(${encodeURI(activeImage)})`,
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 pt-20 flex flex-row h-[calc(100vh-80px)] justify-between items-center">
        {/* Left Side: Join Now Button */}
        <div className="flex flex-col items-center gap-0 relative">
          <div className="relative w-full flex justify-center mt-2 max-w-md h-[300px]">
            <ImageCarousel />
          </div>
          {user ? (
            <Link
              href="/community"
              className="inline-block px-8 py-3 mt-[-10px] mb-6 bg-[#FF00FF] bg-opacity-50 backdrop-blur-md text-white rounded-full text-xl font-bold 
                       transition-all hover:bg-opacity-75 hover:scale-105 animate-pulse"
            >
              EXPLORE
            </Link>
          ) : (
            <Link
              href="/auth/register-form"
              className="inline-block px-8 py-3 mt-[-10px] mb-6 bg-[#FF00FF] bg-opacity-50 backdrop-blur-md text-white rounded-full text-xl font-bold 
                       transition-all hover:bg-opacity-75 hover:scale-105 animate-pulse"
            >
              JOIN NOW
            </Link>
          )}
        </div>
        <div className="w-full max-w-lg">
          <ButtonCarousel />
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <>
      <CarouselProvider>
        <TopNav>
          <MainContent />
        </TopNav>
      </CarouselProvider>
      <Footer />
    </>
  )
}
