"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

interface CarouselContextType {
  activeImage: string
  activeLogo: string
  activeIndex: number
  updateActiveIndex: (index: number) => void;
  carouselImages: string[]
  carouselImages2: string[]
  carouselImages3: string[]
  logoImage: string
}

export const CarouselContext = createContext<CarouselContextType | undefined>(undefined)

export function CarouselProvider({ children }: { children: React.ReactNode }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [carouselImages] = useState<string[]>([
    "https://res.cloudinary.com/difdc39kr/image/upload/v1740161050/Solo_1_kans2q.svg?height=200&width=150",
    "https://res.cloudinary.com/difdc39kr/image/upload/v1740161097/CSM_1_gfphmo.svg?height=200&width=150",
    "https://res.cloudinary.com/difdc39kr/image/upload/v1740161180/JJK_1_ext0yt.svg?height=200&width=150",
  ])
  const [carouselImages2] = useState<string[]>([
    "https://res.cloudinary.com/difdc39kr/image/upload/v1740164001/SOLO_xbsgr1.svg",
    "https://res.cloudinary.com/difdc39kr/image/upload/v1740164301/CSM_npla3e.svg",
    "https://res.cloudinary.com/difdc39kr/image/upload/v1740164649/JJK_mbig68.svg",
  ])
  const [carouselImages3] = useState<string[]>([
    "https://res.cloudinary.com/difdc39kr/image/upload/v1740168717/Solo_Leveling_pgh7r5.svg",
    "https://res.cloudinary.com/difdc39kr/image/upload/v1740168735/Chainsaw_Man_ah8apv.svg",
    "https://res.cloudinary.com/difdc39kr/image/upload/v1740168748/Jujutsu_Kaisen_bwdujg.svg",
  ])
  const [logoImage] = useState("https://res.cloudinary.com/difdc39kr/image/upload/v1740159528/Simplification_gho0s6.svg?height=32&width=96")

  const updateActiveIndex = (index: number) => {
    setActiveIndex(index)
  }

  return ( 
    <CarouselContext.Provider
      value={{
        activeImage: carouselImages2[activeIndex],
        activeLogo: carouselImages3[activeIndex],
        activeIndex,
        updateActiveIndex,
        carouselImages,
        carouselImages2,
        carouselImages3,
        logoImage,
      }}
    >
      {children}
    </CarouselContext.Provider>
  )
}

export function useCarousel() {
  const context = useContext(CarouselContext)
  if (context === undefined) {
    throw new Error("useCarousel must be used within a CarouselProvider")
  }
  return context
} 

