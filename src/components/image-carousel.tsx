"use client"

import Image from "next/image"
import { useRef, useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useCarousel } from "../contexts/carousel-context"
import type React from "react"

export function ImageCarousel() {
  const { carouselImages3, activeIndex } = useCarousel()
  const scrollRef = useRef<HTMLDivElement>(null)



  return (
    <div className="relative z-10 w-full overflow-hidden">
  
        <Image
          src={carouselImages3[activeIndex % carouselImages3.length] || "/placeholder.svg"}
          alt={`Anime ${activeIndex + 1}`}
          fill
          className="object-contain"
        />
      
    </div>
  )
}

