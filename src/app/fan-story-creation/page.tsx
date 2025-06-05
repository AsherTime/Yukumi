"use client";
import React, { useState, useEffect } from 'react';
import { Sparkles, Upload, Image, Palette, Link, Bold, Italic, Underline, Type, AlignLeft, AlignCenter, AlignRight, List, Quote } from 'lucide-react';
import { useRouter } from 'next/navigation';

const customColors = {
  'cozy-bg-dark': '#1A1A2E',
  'cozy-text-light': '#E0E0E0',
  'cozy-card-bg': 'rgba(30, 30, 45, 0.9)',
  'cozy-star-glow-light': 'rgba(157, 214, 255, 0.15)',
  'cozy-star-glow-dark': 'rgba(111, 168, 220, 0.1)',
  'cozy-button-bg': '#5A6A80',
  'cozy-button-hover': '#6F8095',
};

type Particle = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
};

function FloatingDustParticles() {
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
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
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
}

export default function FanStoryCreationPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [synopsis, setSynopsis] = useState('');
  const [storyContent, setStoryContent] = useState('');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const handleContentChange = (newContent: string) => {
    setStoryContent(newContent);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setCoverImage(event.target.files[0]);
      alert("Image selected! (In a real app, this would upload to storage and display preview)");
    }
  };

  const handlePublish = async () => {
    if (!title.trim() || !storyContent.trim()) {
      alert('Title and Story Content cannot be empty!');
      return;
    }
    // TODO: Integrate with Supabase to save the story
    alert('Story Published! (Supabase integration coming soon)');
    setTitle('');
    setSynopsis('');
    setStoryContent('');
    setTags('');
    setCoverImage(null);
    router.back();
  };

  const handleSaveDraft = () => {
    alert('Story Draft Saved! (Concept)');
    console.log({ title, synopsis, storyContent, tags, status: 'draft', coverImageName: coverImage?.name });
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-[#E0E0E0] p-8 relative overflow-hidden flex items-center justify-center">
      <img
        src="https://rhspkjpeyewjugifcvil.supabase.co/storage/v1/object/sign/animepagebg/Leonardo_Anime_XL_Generate_a_wide_horizontal_image_for_a_websi_1.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9hMDVhOTMwNi0zYmRiLTQ5YjQtYWRkNi0xYzIxMzY4YmM3MDEiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJhbmltZXBhZ2ViZy9MZW9uYXJkb19BbmltZV9YTF9HZW5lcmF0ZV9hX3dpZGVfaG9yaXpvbnRhbF9pbWFnZV9mb3JfYV93ZWJsaV8xLmpwZyIsImlhdCI6MTc0ODk1Mjc3MSwiZXhwIjoxNzgwNDg4NzcxfQ.IO6-n-02I5PJ846RBHG3l3X0VRmOR_Ri2SPsAHP33lc"
        alt="Anime Background"
        className="absolute inset-0 object-cover w-full h-full filter blur-[0.5px] brightness-80 grayscale-[0.05] animate-fall-sky-pan z-0"
      />
      <div className="absolute inset-0 bg-black/70 z-0" />
      <FloatingDustParticles />
      <div className="relative z-10 max-w-5xl w-full mx-auto bg-[rgba(30,30,45,0.9)] rounded-xl p-8 shadow-2xl border border-gray-700/50 backdrop-blur-md"
        style={{
          boxShadow: `0 0 30px ${customColors['cozy-star-glow-light']}, inset 0 0 15px ${customColors['cozy-star-glow-dark']}`,
        }}
      >
        <button onClick={() => router.back()} className="absolute top-4 left-4 text-gray-400 hover:text-gray-200 text-lg flex items-center gap-1">
          &larr; Back to Fan Stories
        </button>
        <h1 className="text-3xl font-bold text-center mb-4 text-indigo-300 flex items-center justify-center gap-3">
          <Sparkles size={32} className="text-yellow-300" /> Craft Your Masterpiece <Sparkles size={32} className="text-yellow-300" />
        </h1>
        <p className="text-center text-gray-400 mb-8 italic text-lg">
          "Every great journey begins with a single step... or a single word. Let your imagination soar!"
        </p>
        <form onSubmit={e => { e.preventDefault(); handlePublish(); }} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-lg font-medium text-gray-300 mb-2">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full p-3 rounded-md bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-[#E0E0E0] text-xl placeholder-gray-500"
              placeholder="The Epic of the Wandering Hero"
              required
            />
          </div>
          <div>
            <label htmlFor="synopsis" className="block text-lg font-medium text-gray-300 mb-2">Synopsis</label>
            <textarea
              id="synopsis"
              value={synopsis}
              onChange={e => setSynopsis(e.target.value)}
              rows={4}
              className="w-full p-3 rounded-md bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-[#E0E0E0] placeholder-gray-500 resize-y"
              placeholder="A brief overview of your amazing story (e.g., A young protagonist discovers a hidden power and embarks on a perilous journey to save a forgotten world)."
            ></textarea>
          </div>
          <div>
            <label htmlFor="coverImage" className="block text-lg font-medium text-gray-300 mb-2">Cover Image</label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                id="coverImage"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label
                htmlFor="coverImage"
                className="cursor-pointer bg-[#5A6A80] text-[#E0E0E0] py-2 px-4 rounded-md flex items-center gap-2 hover:bg-[#6F8095] transition-colors"
              >
                <Upload size={20} /> Choose Image
              </label>
              {coverImage && <span className="text-gray-400 text-sm">{coverImage.name}</span>}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              (Optional) Add a captivating image to represent your saga.
            </p>
          </div>
          <div>
            <label htmlFor="storyContent" className="block text-lg font-medium text-gray-300 mb-2">Story Content <span className="text-red-500">*</span></label>
            <div className="bg-gray-800 rounded-md border border-gray-700 min-h-[300px] overflow-hidden flex flex-col">
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
                onChange={e => handleContentChange(e.target.value)}
                rows={15}
                className="w-full flex-1 p-3 bg-gray-800 text-[#E0E0E0] focus:outline-none resize-y placeholder-gray-500"
                placeholder="Once upon a time, in a land far, far away..."
                required
              ></textarea>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              **Note:** For a fully functional rich text editor (with working buttons for formatting, image embeds, etc.), you would integrate a dedicated library like React-Quill, TinyMCE, or CKEditor here.
            </p>
          </div>
          <div>
            <label htmlFor="tags" className="block text-lg font-medium text-gray-300 mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={e => setTags(e.target.value)}
              className="w-full p-3 rounded-md bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-[#E0E0E0] placeholder-gray-500"
              placeholder="e.g., fantasy, action, slice of life, romance, shonen"
            />
            <p className="text-sm text-gray-500 mt-1">
              Help others find your story by adding relevant tags.
            </p>
          </div>
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-700/50">
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
              onMouseEnter={e => e.currentTarget.style.backgroundColor = customColors['cozy-button-hover']}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = customColors['cozy-button-bg']}
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
      </div>
    </div>
  );
} 