"use client";
import React, { useState } from 'react';
import { ArrowLeftCircle, ArrowRightCircle, BookOpenText, ChevronDown } from 'lucide-react';
import { useRouter } from "next/navigation";

const customColors = {
  'cozy-text-light': '#E0E0E0',
  'cozy-button-bg': '#5A6A80',
  'cozy-button-hover': '#6F8095',
  'cozy-reader-bg': 'rgba(30, 30, 45, 0.85)',
};

export default function MangaReaderPage({ mangaData, onBack }: { mangaData: any, onBack: () => void }) {
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
    <div className="absolute inset-0 flex flex-col items-center justify-center py-8 px-4 z-30 overflow-y-auto">
      <div className="w-full max-w-screen-xl flex-1 rounded-xl p-8 shadow-2xl border border-gray-700/50 backdrop-blur-md flex flex-col"
        style={{
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(0, 0, 0, 0.2)',
          background: `
            radial-gradient(circle at center, rgba(157, 214, 255, 0.05) 0%, transparent 70%),
            ${customColors['cozy-reader-bg']}
          `,
        }}
      >
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/50">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-200 text-lg flex items-center gap-1">
            <ArrowLeftCircle size={20} /> Back to Library
          </button>
          <h1 className="text-3xl font-bold text-indigo-300 text-center flex-1">{mangaData.title}</h1>
          <div className="relative">
            <select
              name="chapter-select"
              value={activeChapterIndex}
              onChange={(e) => {
                setActiveChapterIndex(parseInt(e.target.value));
                setActivePageIndex(0);
              }}
              className="bg-gray-800 text-cozy-text-light p-2 rounded-md border border-gray-700 appearance-none pr-8"
              style={{ backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center' }}
            >
              {mangaData.chapters.map((chapter: any, index: number) => (
                <option key={chapter.id} value={index}>
                  {chapter.name}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>
        </div>
        <div
          className="flex-1 overflow-y-auto p-4 bg-gray-900/50 rounded-lg border border-gray-700 text-cozy-text-light leading-relaxed text-lg"
          dangerouslySetInnerHTML={{ __html: currentPageContent }}
        />
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-700/50">
          <button
            onClick={goToPreviousChapter}
            disabled={activeChapterIndex === 0}
            className="bg-cozy-button-bg text-cozy-text-light py-2 px-4 rounded-full hover:bg-cozy-button-hover transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            <BookOpenText size={18} /> Prev Chapter
          </button>
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPreviousPage}
              disabled={activePageIndex === 0 && activeChapterIndex === 0}
              className="bg-cozy-button-bg text-cozy-text-light py-2 px-4 rounded-full hover:bg-cozy-button-hover transition-colors disabled:opacity-50"
            >
              <ArrowLeftCircle size={20} /> Previous
            </button>
            <span className="text-xl font-bold">Page {activePageIndex + 1}</span>
            <button
              onClick={goToNextPage}
              disabled={activePageIndex === (currentChapter?.pages.length - 1) && activeChapterIndex === (mangaData.chapters.length - 1)}
              className="bg-cozy-button-bg text-cozy-text-light py-2 px-4 rounded-full hover:bg-cozy-button-hover transition-colors disabled:opacity-50"
            >
              Next <ArrowRightCircle size={20} />
            </button>
          </div>
          <button
            onClick={goToNextChapter}
            disabled={activeChapterIndex === mangaData.chapters.length - 1}
            className="bg-cozy-button-bg text-cozy-text-light py-2 px-4 rounded-full hover:bg-cozy-button-hover transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            Next Chapter <BookOpenText size={18} />
          </button>
        </div>
      </div>
    </div>
  );
} 