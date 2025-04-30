"use client"

import { useCarousel } from "../contexts/carousel-context"

export function ButtonCarousel() {
  const { carouselImages3, updateActiveIndex, activeIndex } = useCarousel() // Use activeIndex from context
  const totalImages = carouselImages3.length

  const handleNextImage = () => {
    updateActiveIndex((activeIndex + 1) % totalImages) // Correctly updating the index
  }

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Next Button */}
      <button
        onClick={handleNextImage}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-2xl"
      >
        &gt;
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {carouselImages3.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === activeIndex ? "bg-white w-3 h-3" : "bg-gray-600"
            }`}
          />
        ))}
      </div>
    </div>
  )
}
