"use client";
import React, { useState } from 'react';
import { ArrowLeftCircle, ArrowRightCircle, BookOpenText, ChevronDown } from 'lucide-react';
import { useRouter } from "next/navigation";

interface FanStoryFromDB {
  id: string;
  user_id: string;
  title: string;
  synopsis: string | null;
  content: string;
  tags: string[] | null;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  views: number;
}

type Pages = {
  id: string;
  content: string;
}

type Chapter = {
  id: number;
  pages: Pages[];
  title: string;
  name: string;
  length: number;
};

interface FanStory extends FanStoryFromDB {
  chapters: Chapter[];
}

const customColors = {
  'cozy-text-light': '#E0E0E0',
  'cozy-button-bg': '#5A6A80',
  'cozy-button-hover': '#6F8095',
  'cozy-reader-bg': 'rgba(30, 30, 45, 0.85)',
};

export default function MangaReaderPage({ mangaData, onBack }: { mangaData: FanStory, onBack: () => void }) {
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const router = useRouter();

  if (!mangaData || !mangaData.chapters || mangaData.chapters.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center py-8 px-4 z-30 text-cozy-text-light">
        <div className="w-full max-w-2xl bg-cozy-reader-bg rounded-xl p-8 shadow-2xl text-center">
          <p className="text-xl mb-4">No fanfic selected.</p>
          <button onClick={() => router.back()} className="bg-cozy-button-bg text-cozy-text-light py-2 px-4 rounded-full hover:bg-cozy-button-hover transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentChapter = mangaData.chapters[activeChapterIndex];
  const currentPageContent = currentChapter?.pages[activePageIndex]?.content || '<p class="text-gray-500 italic text-center">This page is empty. Enjoy the silence.</p>';

  const goToNextPage = () => {
    if (activePageIndex < currentChapter.pages.length - 1) {
      setActivePageIndex(activePageIndex + 1);
    } else if (activeChapterIndex < mangaData.chapters.length - 1) {
      setActiveChapterIndex(activeChapterIndex + 1);
      setActivePageIndex(0);
    }
  };

  const goToPreviousPage = () => {
    if (activePageIndex > 0) {
      setActivePageIndex(activePageIndex - 1);
    } else if (activeChapterIndex > 0) {
      setActiveChapterIndex(activeChapterIndex - 1);
      setActivePageIndex(mangaData.chapters[activeChapterIndex - 1].pages.length - 1);
    }
  };

  const goToNextChapter = () => {
    if (activeChapterIndex < mangaData.chapters.length - 1) {
      setActiveChapterIndex(activeChapterIndex + 1);
      setActivePageIndex(0);
    }
  };

  const goToPreviousChapter = () => {
    if (activeChapterIndex > 0) {
      setActiveChapterIndex(activeChapterIndex - 1);
      setActivePageIndex(0);
    }
  };


  return (
    <div className="absolute inset-0 flex flex-col items-center py-6 px-2 sm:py-8 sm:px-4 z-30 overflow-y-auto">
      <div
        className="w-full max-w-screen-xl flex-1 rounded-xl p-4 sm:p-8 shadow-2xl border border-gray-700/50 backdrop-blur-md flex flex-col"
        style={{
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(0, 0, 0, 0.2)',
          background: `
        radial-gradient(circle at center, rgba(157, 214, 255, 0.05) 0%, transparent 70%),
        ${customColors['cozy-reader-bg']}
      `,
        }}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6 pb-4 border-b border-gray-700/50">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-gray-200 text-base sm:text-lg flex items-center gap-1 shrink-0"
          >
            <ArrowLeftCircle size={20} /> Back to Library
          </button>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-300 text-center flex-1 truncate">
            {mangaData.title}
          </h1>


          {/* Chapter Dropdown */}
          <div className="relative w-full sm:w-40 shrink-0">
            <select
              name="chapter-select"
              value={activeChapterIndex}
              onChange={(e) => {
                setActiveChapterIndex(parseInt(e.target.value));
                setActivePageIndex(0);
              }}
              className="w-full bg-gray-800 text-cozy-text-light p-2 rounded-md border border-gray-700 appearance-none pr-8"
              style={{ backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center' }}
            >
              {mangaData.chapters.map((chapter: Chapter, index: number) => (
                <option key={chapter.id} value={index}>
                  {chapter.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
            />
          </div>
        </div>


        {/* Content */}
        <div
          className="flex-1 overflow-y-auto p-3 sm:p-4 bg-gray-900/50 rounded-lg border border-gray-700 text-cozy-text-light leading-relaxed text-base sm:text-lg"
          dangerouslySetInnerHTML={{ __html: currentPageContent }}
        />

        {/* Footer Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-700/50 gap-4 sm:gap-0">
          <button
            onClick={goToPreviousChapter}
            disabled={activeChapterIndex === 0}
            className="w-full sm:w-auto bg-cozy-button-bg text-cozy-text-light py-2 px-4 rounded-full hover:bg-cozy-button-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <BookOpenText size={18} /> Prev Chapter
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <button
              onClick={goToPreviousPage}
              disabled={activePageIndex === 0 && activeChapterIndex === 0}
              className="bg-cozy-button-bg text-cozy-text-light py-2 px-4 rounded-full hover:bg-cozy-button-hover transition-colors disabled:opacity-50"
            >
              <ArrowLeftCircle size={20} /> Previous
            </button>
            <span className="text-lg font-bold">Page {activePageIndex + 1}</span>
            <button
              onClick={goToNextPage}
              disabled={
                activePageIndex === currentChapter?.pages.length - 1 &&
                activeChapterIndex === mangaData.chapters.length - 1
              }
              className="bg-cozy-button-bg text-cozy-text-light py-2 px-4 rounded-full hover:bg-cozy-button-hover transition-colors disabled:opacity-50"
            >
              Next <ArrowRightCircle size={20} />
            </button>
          </div>

          <button
            onClick={goToNextChapter}
            disabled={activeChapterIndex === mangaData.chapters.length - 1}
            className="w-full sm:w-auto bg-cozy-button-bg text-cozy-text-light py-2 px-4 rounded-full hover:bg-cozy-button-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            Next Chapter <BookOpenText size={18} />
          </button>
        </div>
      </div>
    </div>
  );
} 