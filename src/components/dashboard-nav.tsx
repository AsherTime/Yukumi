import Link from "next/link"
import Image from "next/image"
import type React from "react"
import { Bell, User } from "lucide-react"
import { useCarousel } from "@/contexts/carousel-context"
import { useEffect, useState } from "react";
import { auth } from "@/app/auth/register-form/firebase";
import LogoutButton from "./logout"


const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/anime", label: "Anime" },
  { href: "/community", label: "Community" },
  { href: "/tracker", label: "Tracker" },
]
 

export function DashboardNav({ children }: { children?: React.ReactNode }) {
  const {logoImage} = useCarousel(); 

  const [user, setUser] = useState<null | object>(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

  return (
    <div className="min-h-screen bg-[#07081F] overflow-hidden">
      <nav className="flex items-center px-8 py-4 bg-transparent absolute top-0 left-0 right-0 z-50">
        <Link href="/" className="relative w-24 h-8 mr-8">
          <Image
            src={logoImage}
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
        <div className="flex items-center gap-6 ml-auto">
        {user ? (
            // Logged-in view
            <>
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
              <Link href="/auth/login-page">Login</Link>
              <Link href="/auth/register-form">Register</Link>
            </>
          )}
        </div>
      </nav>
      {children}
    </div>
  )
} 

