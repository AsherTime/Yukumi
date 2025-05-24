"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";

interface FeatureCardProps {
  icon: string;
  label: string;
  color: string;
  href: string;
}

const FeatureGridCard = ({ icon, label, color, href }: FeatureCardProps) => (
  <Link href={href} className="group">
    <motion.div
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-zinc-900/80 border border-zinc-800/60 shadow-md transition-all hover:scale-105 hover:shadow-lg relative"
      whileHover={{ scale: 1.07 }}
      whileTap={{ scale: 0.97 }}
      style={{ minWidth: 0 }}
    >
      <div className="relative w-10 h-10 mb-1">
        <Image
          src={icon}
          alt={label}
          fill
          className="object-contain drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
          style={{ filter: `drop-shadow(0 0 8px ${color}55)` }}
        />
      </div>
      <span className="text-zinc-200 text-sm font-semibold text-center leading-tight">
        {label}
      </span>
      <div 
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${color}22 0%, transparent 70%)`,
          boxShadow: `0 0 20px ${color}33`
        }}
      />
    </motion.div>
  </Link>
);

export function FeaturePanel() {
  // Only the upload post button at the top
  const uploadFeature = {
    icon: "/icons/upload.svg",
    label: "Upload Post",
    color: "#9333ea",
    href: "/create-post"
  };

  // The rest in a grid
  const features = [
    {
      icon: "/icons/checkin.svg",
      label: "Daily Check-in",
      color: "#3b82f6",
      href: "/check-in"
    },
    {
      icon: "/icons/manga.svg",
      label: "Read Fan Manga",
      color: "#f1f5f9",
      href: "/manga"
    },
    {
      icon: "/icons/planner.svg",
      label: "My Lists",
      color: "#22c55e",
      href: "/planner"
    },
    {
      icon: "/icons/quiz.svg",
      label: "Fun Quiz",
      color: "#ec4899",
      href: "/quiz"
    }
  ];

  return (
    <div className="w-full max-w-[300px] flex flex-col gap-6">
      {/* Upload Post Button */}
      <Link href={uploadFeature.href} className="block">
        <motion.button
          className="w-full flex items-center gap-3 justify-center py-4 rounded-2xl bg-gradient-to-r from-purple-700 via-purple-900 to-fuchsia-800 text-white font-bold text-lg shadow-lg border-2 border-purple-800 hover:from-purple-600 hover:to-fuchsia-700 transition-all relative"
          whileHover={{ scale: 1.04, boxShadow: "0 0 24px #9333ea" }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="relative w-7 h-7 mr-2">
            <Image src={uploadFeature.icon} alt={uploadFeature.label} fill className="object-contain" />
          </span>
          {uploadFeature.label}
        </motion.button>
      </Link>

      {/* Feature Grid */}
      <div className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-4 shadow-lg flex flex-col">
        <div className="text-white font-bold text-base mb-3 ml-1">User Features</div>
        <div className="grid grid-cols-2 gap-3">
          {features.map((feature, idx) => (
            <FeatureGridCard key={idx} {...feature} />
          ))}
        </div>
      </div>
    </div>
  );
} 