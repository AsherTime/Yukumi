"use client"

import { cn } from "@/lib/utils"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function LeftSidebar() {
  const pathname = usePathname()

  const links = [
    { name: "Following", href: "/following" },
    { name: "Recommended", href: "/recommended" },
    { name: "Events", href: "/events" },
  ]

  return (
    <div className="w-64 min-h-screen bg-[#2e2e2e] p-4">
      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "block px-4 py-2 rounded-lg transition-colors",
              pathname === link.href ? "bg-red-500 text-white" : "hover:bg-gray-700",
            )}
          >
            {link.name}
          </Link>
        ))}
      </nav>  
    </div>
  )
}

