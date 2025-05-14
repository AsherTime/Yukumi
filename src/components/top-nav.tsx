"use client"

import { useEffect, useState } from "react";
import { auth } from "@/app/auth/register-form/firebase";
import Image from "next/image"
import Link from "next/link"
import { Search, Bell, User, Upload } from "lucide-react"
import LogoutButton from "./logout";
import { getAuth, onAuthStateChanged, User as FirebaseUser, setPersistence, browserLocalPersistence } from "firebase/auth";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";


const NAV_LINKS = [
  { href: "/homepage", label: "Home" },
  { href: "/anime", label: "Anime" },
  { href: "/community", label: "Community" },
  { href: "/tracker", label: "Tracker" },
]


export function TopNav({ children }: { children?: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isDashboard = pathname === "/dashboard"; // Change the path if needed

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
              <select className="absolute inset-y-0 left-0 w-20 appearance-none bg-[#f8f8f8] text-black px-2 py-2 rounded-l border-r border-gray-300 focus:outline-none">
                <option>All</option>
                <option>Anime</option>
                <option>Community</option>  
                <option>Users</option>
              </select>
              <input
                type="text"
                placeholder="Search Anime, Communities, and more..."
                className="w-full pl-24 pr-10 py-2 bg-[#f8f8f8] text-black rounded focus:outline-none"
              />
              <button className="absolute inset-y-0 right-0 px-3 flex items-center">
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
