"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { DailyTasksPanel } from "./daily-tasks-panel";
import { CreateYourSagaButton } from "./create-your-saga-button";

export function FeaturePanel() {
  // Only the upload post button at the top
  const uploadFeature = {
    icon: "/icons/upload.svg",
    label: "Upload Post",
    color: "#9333ea",
    href: "/upload"
  };

  const handleCreateStory = () => {
    // This will be handled by the parent component
    alert("Navigate to Create Story Page");
  };

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

      {/* Daily Tasks Panel */}
      <DailyTasksPanel />

      {/* Create Your Story Button */}
      <CreateYourSagaButton onNavigateToCreateStory={handleCreateStory} />
    </div>
  );
} 