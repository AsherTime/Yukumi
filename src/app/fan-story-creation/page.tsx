"use client";
import React, { useState, useEffect } from 'react';
import { Upload, Image, Palette, Link, Bold, Italic, Underline, Type, AlignLeft, AlignCenter, AlignRight, List, Quote, BookText, ListOrdered, MessageSquare, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

// Custom Tailwind colors for a cozy dark anime vibe
const customColors = {
  'cozy-bg-dark': '#1A1A2E',
  'cozy-text-light': '#E0E0E0',
  'cozy-card-bg': 'rgba(30, 30, 45, 0.9)',
  'cozy-button-bg': '#5A6A80',
  'cozy-button-hover': '#6F8095',
  'cozy-gradient-start': '#8FB8DE',
  'cozy-gradient-end': '#6FA8DC',
};

type Particle = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
};

// --- Floating Dust Particles Component ---
const FloatingDustParticles: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prevParticles => {
        const newParticle: Particle = {
          id: Math.random(),
          left: Math.random() * 100,
          delay: Math.random() * 5,
          duration: 10 + Math.random() * 10,
          size: Math.random() * 2 + 1,
        };
        return [...prevParticles.slice(-50), newParticle];
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-indigo-200/50 blur-sm"
          style={{
            left: `${p.left}vw`,
            bottom: `-5%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `float-up-fade ${p.duration}s linear ${p.delay}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
};

// --- StoryContentEditor Component ---
type StoryContentEditorProps = {
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  storyContent: string;
  setStoryContent: React.Dispatch<React.SetStateAction<string>>;
  coverImage: File | null;
  setCoverImage: React.Dispatch<React.SetStateAction<File | null>>;
  coverImageUrl: string | null;
  setCoverImageUrl: React.Dispatch<React.SetStateAction<string | null>>;
};

const StoryContentEditor: React.FC<StoryContentEditorProps> = ({ title, setTitle, storyContent, setStoryContent, coverImage, setCoverImage, coverImageUrl, setCoverImageUrl }) => {
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setCoverImage(file);
      setCoverImageUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="flex-1 space-y-8 p-6 bg-gray-800/60 rounded-xl border border-gray-700/50 shadow-lg">
      {/* Story Cover */}
      <div className="flex flex-col items-center justify-center bg-gray-800 border border-gray-700 rounded-md p-6 relative overflow-hidden group">
        <label htmlFor="coverImage" className="block text-lg font-medium text-gray-300 mb-4">Story Cover</label>
        <input
          type="file"
          id="coverImage"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        {coverImageUrl ? (
          <img src={coverImageUrl} alt="Story Cover Preview" className="w-full max-h-64 object-cover rounded-md mb-4" />
        ) : (
          <div className="w-full h-48 flex items-center justify-center border-2 border-dashed border-gray-600 rounded-md mb-4 text-gray-500 text-center">
            <p>Click below to choose your story's cover image</p>
          </div>
        )}
        <label
          htmlFor="coverImage"
          className="cursor-pointer bg-cozy-button-bg text-cozy-text-light py-2 px-6 rounded-full flex items-center gap-2 hover:bg-cozy-button-hover transition-colors text-lg font-semibold"
        >
          <Upload size={20} /> Choose Cover
        </label>
        {coverImage && <span className="text-gray-400 text-sm mt-2">{coverImage.name}</span>}
      </div>

      {/* Story Title */}
      <div>
        <label htmlFor="title" className="sr-only">Story Title</label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-4 rounded-md bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-cozy-text-light text-3xl font-bold placeholder-gray-500 text-center"
          placeholder="Your Masterpiece Title Here"
          required
        />
      </div>

      {/* Story Content - Rich Text Editor Placeholder */}
      <div>
        <label htmlFor="storyContent" className="sr-only">Story Content</label>
        <div className="bg-gray-800 rounded-md border border-gray-700 min-h-[400px] overflow-hidden flex flex-col">
          {/* Simplified Rich Text Editor Toolbar */}
          <div className="p-2 border-b border-gray-700 flex flex-wrap gap-2 text-sm text-gray-400">
            <button type="button" title="Bold" className="px-2 py-1 rounded hover:bg-gray-700"><Bold size={16} /></button>
            <button type="button" title="Italic" className="px-2 py-1 rounded hover:bg-gray-700"><Italic size={16} /></button>
            <button type="button" title="Underline" className="px-2 py-1 rounded hover:bg-gray-700"><Underline size={16} /></button>
            <button type="button" title="Text Color" className="px-2 py-1 rounded hover:bg-gray-700"><Palette size={16} /></button>
            <button type="button" title="Insert Image" className="px-2 py-1 rounded hover:bg-gray-700"><Image size={16} /></button>
            <button type="button" title="Insert Link" className="px-2 py-1 rounded hover:bg-gray-700"><Link size={16} /></button>
            <span className="border-l border-gray-600 mx-1"></span>
            <button type="button" title="Align Left" className="px-2 py-1 rounded hover:bg-gray-700"><AlignLeft size={16} /></button>
            <button type="button" title="Align Center" className="px-2 py-1 rounded hover:bg-gray-700"><AlignCenter size={16} /></button>
            <button type="button" title="Align Right" className="px-2 py-1 rounded hover:bg-gray-700"><AlignRight size={16} /></button>
            <span className="border-l border-gray-600 mx-1"></span>
            <button type="button" title="Numbered List" className="px-2 py-1 rounded hover:bg-gray-700"><List size={16} /></button>
            <button type="button" title="Blockquote" className="px-2 py-1 rounded hover:bg-gray-700"><Quote size={16} /></button>
            <span className="border-l border-gray-600 mx-1"></span>
            <button type="button" title="Font Size" className="px-2 py-1 rounded hover:bg-gray-700"><Type size={16} /></button>
          </div>
          <textarea
            id="storyContent"
            value={storyContent}
            onChange={(e) => setStoryContent(e.target.value)}
            rows={20}
            className="w-full flex-1 p-4 bg-gray-800 text-cozy-text-light focus:outline-none resize-y placeholder-gray-500 leading-relaxed"
            placeholder="Once upon a time, in a world steeped in ancient magic and forgotten legends..."
            required
          ></textarea>
        </div>
      </div>
    </div>
  );
};

// --- StoryToolsPanel Component ---
const StoryToolsPanel: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string | null>('chapters');

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  return (
    <div className="w-1/3 p-6 space-y-6 bg-cozy-card-bg rounded-xl border border-gray-700/50 backdrop-blur-sm shadow-lg flex flex-col">
      <h2 className="text-2xl font-bold text-center text-indigo-300 mb-4">Writer's Toolkit</h2>
      {/* Chapters Section */}
      <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('chapters')}>
          <h3 className="text-xl font-semibold text-gray-300 flex items-center gap-2">
            <ListOrdered size={20} className="text-cyan-400" /> Chapters
          </h3>
          {activeSection === 'chapters' ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
        {activeSection === 'chapters' && (
          <div className="mt-3 text-gray-400 text-sm space-y-2 pt-3 border-t border-gray-700/30">
            <p className="italic">Chapter navigation and management will go here.</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Introduction - 0%</li>
              <li>The Awakening - 50%</li>
              <li>Trial by Fire - 10%</li>
            </ul>
            <button className="w-full mt-3 bg-cozy-button-bg text-cozy-text-light py-2 rounded-md hover:bg-cozy-button-hover transition-colors">
              Add New Chapter
            </button>
          </div>
        )}
      </div>
      {/* Writer's Notes Section */}
      <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('notes')}>
          <h3 className="text-xl font-semibold text-gray-300 flex items-center gap-2">
            <MessageSquare size={20} className="text-lime-400" /> Writer's Notes
          </h3>
          {activeSection === 'notes' ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
        {activeSection === 'notes' && (
          <div className="mt-3 text-gray-400 text-sm space-y-2 pt-3 border-t border-gray-700/30">
            <p className="italic">Keep track of your ideas, character arcs, and plot points.</p>
            <textarea
              rows={4}
              className="w-full p-2 rounded-md bg-gray-900 border border-gray-700 focus:ring-1 focus:ring-indigo-500 outline-none text-cozy-text-light"
              placeholder="Jot down your notes here..."
            ></textarea>
            <button className="w-full mt-2 bg-cozy-button-bg text-cozy-text-light py-2 rounded-md hover:bg-cozy-button-hover transition-colors">
              Save Notes
            </button>
          </div>
        )}
      </div>
      {/* Helpful Tips Section */}
      <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('tips')}>
          <h3 className="text-xl font-semibold text-gray-300 flex items-center gap-2">
            <Lightbulb size={20} className="text-yellow-400" /> Helpful Tips
          </h3>
          {activeSection === 'tips' ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
        {activeSection === 'tips' && (
          <div className="mt-3 text-gray-400 text-sm space-y-2 pt-3 border-t border-gray-700/30">
            <p className="italic">Tips for improving your story writing:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Show, don't just tell.</li>
              <li>Read widely in your genre.</li>
              <li>Outline your plot.</li>
            </ul>
          </div>
        )}
      </div>
      {/* Progress / Status (Placeholder) */}
      <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50 text-gray-400 text-sm text-center">
        <h3 className="text-xl font-semibold text-gray-300 mb-2">Word Count: <span className="font-bold text-cozy-text-light">5,200</span></h3>
        <h3 className="text-xl font-semibold text-gray-300">Last Saved: <span className="font-bold text-cozy-text-light">5 mins ago</span></h3>
      </div>
    </div>
  );
};

// --- Fan Story Creation Page Component (Layout Container) ---
const FanStoryCreationPage: React.FC = () => {
  // State for the main story content
  const [title, setTitle] = useState<string>('');
  const [storyContent, setStoryContent] = useState<string>('');
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  const handlePublish = async () => {
    if (!title.trim() || !storyContent.trim()) {
      alert('Title and Story Content cannot be empty!');
      return;
    }
    alert('Story Published! (Demo)');
    setTitle('');
    setStoryContent('');
    setCoverImage(null);
    setCoverImageUrl(null);
  };

  const handleSaveDraft = () => {
    alert('Story Draft Saved! (Demo)');
    console.log({ title, storyContent, status: 'draft', coverImageName: coverImage?.name });
  };

  // Keyframes for background animation
  useEffect(() => {
    const allKeyframes = `
      @keyframes fall-sky-pan {
        0% { background-position: 50% 0%; }
        100% { background-position: 50% 100%; }
      }
      @keyframes float-up-fade {
        0% {
          transform: translateY(0) translateX(0) scale(0.8);
          opacity: 0;
        }
        20% {
          opacity: 0.4;
        }
        100% {
          transform: translateY(-100vh) translateX(var(--tw-translate-x, 0)) scale(1.2);
          opacity: 0;
        }
      }
    `;
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = allKeyframes;
    document.head.appendChild(styleSheet);
    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-cozy-bg-dark text-cozy-text-light font-inter relative">
      {/* Background Image Container (Global) */}
      <img
        src="https://rhspkjpeyewjugifcvil.supabase.co/storage/v1/object/sign/animepagebg/Leonardo_Anime_XL_A_cozy_warmtoned_animestyle_bedroom_at_night_2.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hMDVhOTMwNi0zYmRiLTQ5YjQtYWRkNi0xYzIxMzY4YmM3MDEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhbmltZXBhZ2ViZy9MZW9uYXJkb19BbmltZV9YTF9BX2Nvenlfd2FybXRvbmVkX2FuaW1lc3R5bGVfYmVkcm9vbV9hdF9uaWdodF8yLmpwZyIsImlhdCI6MTc0OTEyODIzMSwiZXhwIjoxNzgwNjY0MjMxfQ.7pGljHpkstsQUZg2iad7fWtQQcBW164t2EAQpgiKyLU"
        alt="Cozy Anime Bedroom Background"
        className="absolute inset-0 object-cover w-full h-full filter blur-[0.5px] brightness-80 grayscale-[0.05] animate-fall-sky-pan z-0"
        onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = "https://placehold.co/1920x1080/1a1a2e/e0e0e0?text=Background%20Image%20Failed"; }}
      />
      {/* Overlay for extra darkness and readability (Global) */}
      <div className="absolute inset-0 bg-black/10 z-10" />
      {/* Floating Dust Particles (Global) */}
      <FloatingDustParticles />
      {/* Main content area with two panels: Editor on left, Tools on right */}
      <div className="absolute inset-0 flex flex-col items-center justify-center py-8 px-4 z-30 overflow-y-auto">
        <div className="w-full max-w-screen-2xl flex-1 rounded-xl p-8 shadow-2xl border border-gray-700/50 backdrop-blur-md flex flex-row gap-6 overflow-y-auto"
          style={{
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(0, 0, 0, 0.2)',
            background: `
              radial-gradient(circle at center, rgba(157, 214, 255, 0.05) 0%, transparent 70%),
              ${customColors['cozy-card-bg']}
            `,
          }}
        >
          {/* Left pane: Content Editor */}
          <form onSubmit={(e) => { e.preventDefault(); handlePublish(); }} className="flex-1 flex flex-col">
            <h1 className="text-3xl font-bold text-center mb-2 text-indigo-300 flex items-center justify-center gap-3">
              <BookText size={32} className="text-indigo-400" /> Craft Your Saga <BookText size={32} className="text-indigo-400" />
            </h1>
            <p className="text-center text-gray-400 mb-8 italic text-lg leading-relaxed">
              "Unfold your narrative. Every word weaves a new thread in the tapestry of imagination."
            </p>
            <StoryContentEditor
              title={title}
              setTitle={setTitle}
              storyContent={storyContent}
              setStoryContent={setStoryContent}
              coverImage={coverImage}
              setCoverImage={setCoverImage}
              coverImageUrl={coverImageUrl}
              setCoverImageUrl={setCoverImageUrl}
            />
            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700/50 mt-8">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-6 py-3 rounded-full text-lg font-semibold transition-all duration-300 ease-in-out"
                style={{
                  backgroundColor: customColors['cozy-button-bg'],
                  color: customColors['cozy-text-light'],
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
                  textShadow: '0 0 5px rgba(0,0,0,0.3)',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = customColors['cozy-button-hover'])}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = customColors['cozy-button-bg'])}
              >
                Save Draft
              </button>
              <button
                type="submit"
                className="px-6 py-3 rounded-full text-lg font-semibold transition-all duration-300 ease-in-out bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                style={{
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                  textShadow: '0 0 5px rgba(0,0,0,0.3)',
                }}
              >
                Publish Saga
              </button>
            </div>
          </form>
          {/* Right pane: Tools Panel */}
          <StoryToolsPanel />
        </div>
      </div>
    </div>
  );
};

export default FanStoryCreationPage;