"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Image, Palette, Link, Bold, Italic, Underline, Type, AlignLeft, AlignCenter, AlignRight, List, Quote, BookText, ListOrdered, MessageSquare, Lightbulb, ChevronDown, ChevronUp, Plus, Trash2, Pencil, XCircle } from 'lucide-react';
import { supabase } from "@/lib/supabase"; // At the top if not already
import { awardPoints } from '@/utils/awardPoints';

// Custom Tailwind colors for a cozy dark anime vibe
const customColors = {
  'cozy-bg-dark': '#1A1A2E',
  'cozy-text-light': '#E0E0E0',
  'cozy-card-bg': 'rgba(30, 30, 45, 0.7)', // Adjusted transparency
  'cozy-button-bg': '#5A6A80',
  'cozy-button-hover': '#6F8095',
  'cozy-gradient-start': '#8FB8DE',
  'cozy-gradient-end': '#6FA8DC',
};

// --- Floating Dust Particles Component ---
// This component is included as it provides visual context for the page.
function FloatingDustParticles() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prevParticles => {
        const newParticle = {
          id: Math.random(),
          left: Math.random() * 100, // 0-100% horizontally
          delay: Math.random() * 5, // Random delay for animation start
          duration: 10 + Math.random() * 10, // 10-20 seconds animation
          size: Math.random() * 2 + 1, // 1-3px size
        };
        // Keep a reasonable number of particles
        return [...prevParticles.slice(-50), newParticle]; // Keep last 50 particles
      });
    }, 500); // Add a new particle every 0.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    // Z-index changed to z-20 so particles appear above the background image and its overlay
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-indigo-200/50 blur-sm" // Soft blueish dust
          style={{
            left: `${p.left}vw`, // Use vw for horizontal positioning
            bottom: `-5%`, // Start slightly below the viewport
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `float-up-fade ${p.duration}s linear ${p.delay}s infinite alternate`, // infinite alternate for continuous movement
          }}
        />
      ))}
    </div>
  );
}


// --- StoryContentEditor Component (Enhanced for Rich Text and Image Upload) ---
function StoryContentEditor({ currentContent, setCurrentContent, title, setTitle, coverImage, setCoverImage, coverImageUrl, setCoverImageUrl }) {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null); // Ref for hidden file input

  // Synchronize contentEditable div with React state
  useEffect(() => {
    if (editorRef.current) {
      const placeholderHtml = '<p class="text-gray-500 italic">Start writing your amazing story here. You can insert text, images, and more! Manga panels go here.</p>';
      const contentToSet = currentContent || placeholderHtml;
      
      if (editorRef.current.innerHTML !== contentToSet) {
          editorRef.current.innerHTML = contentToSet;
      }
    }
  }, [currentContent]);

  // Handle content changes from the contentEditable div
  const handleEditorInput = useCallback(() => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const placeholderHtml = '<p class="text-gray-500 italic">Start writing your amazing story here. You can insert text, images, and more! Manga panels go here.</p>';
      
      if (currentHtml === placeholderHtml || currentHtml === '<p><br></p>' || currentHtml === '<div><br></div>' || currentHtml === '') {
          setCurrentContent('');
      } else {
          setCurrentContent(currentHtml);
      }
    }
  }, [setCurrentContent]);

  const handleImageUploadClick = () => {
    fileInputRef.current?.click(); // Trigger click on hidden file input
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target.result;
        // Insert image at current cursor position
        document.execCommand('insertHTML', false, `<img src="${imageUrl}" class="inline-block max-w-full h-auto rounded-md shadow-md my-4" alt="Manga Panel" style="max-height: 400px; display: block; margin: 16px auto;" />`);
        handleEditorInput(); // Update state after image insertion
      };
      reader.readAsDataURL(file); // Read file as data URL for immediate embedding
    }
  };

  // Basic rich text formatting commands
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus(); // Keep focus on editor after formatting
    handleEditorInput(); // Update state after formatting
  };

  // Handle cover image separately from inline images
  const handleCoverImageUpload = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setCoverImage(file);
      setCoverImageUrl(URL.createObjectURL(file));
      console.log("Cover image selected:", file.name);
    }
  };


  return (
    <div className="flex-1 space-y-8 p-6 bg-gray-800/60 rounded-xl border border-gray-700/50 shadow-lg flex flex-col">
      {/* Manga Cover */}
      <div className="flex flex-col items-center justify-center bg-gray-800 border border-gray-700 rounded-md p-6 relative overflow-hidden group">
        <label htmlFor="coverImage" className="block text-lg font-medium text-gray-300 mb-4">Manga Cover</label>
        <input
          type="file"
          id="coverImage"
          accept="image/*"
          onChange={handleCoverImageUpload}
          className="hidden"
        />
        {coverImageUrl ? (
          <img src={coverImageUrl} alt="Manga Cover Preview" className="w-full max-h-64 object-cover rounded-md mb-4" />
        ) : (
          <div className="w-full h-48 flex items-center justify-center border-2 border-dashed border-gray-600 rounded-md mb-4 text-gray-500 text-center">
            <p>Click below to choose your manga's cover image</p>
          </div>
        )}
        <label
          htmlFor="coverImage"
          className="cursor-pointer bg-cozy-button-bg text-cozy-text-light py-2 px-6 rounded-full flex items-center gap-2 hover:bg-cozy-button-hover transition-colors text-lg font-semibold"
        >
          Choose Cover
        </label>
        {coverImage && <span className="text-gray-400 text-sm mt-2">{coverImage.name}</span>}
      </div>

      {/* Manga Title */}
      <div>
        <label htmlFor="title" className="sr-only">Manga Title</label>
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

      {/* Story Content - Rich Text Editor */}
      <div className="bg-gray-800 rounded-md border border-gray-700 flex-1 overflow-hidden flex flex-col"> {/* flex-1 to make it fill available vertical space */}
        {/* Rich Text Editor Toolbar */}
        <div className="p-2 border-b border-gray-700 flex flex-wrap gap-2 text-sm text-gray-400">
          <button type="button" title="Bold" className="px-2 py-1 rounded hover:bg-gray-700" onClick={() => formatText('bold')}>Bold</button>
          <button type="button" title="Italic" className="px-2 py-1 rounded hover:bg-gray-700" onClick={() => formatText('italic')}>Italic</button>
          <button type="button" title="Underline" className="px-2 py-1 rounded hover:bg-gray-700" onClick={() => formatText('underline')}>Underline</button>
          <span className="border-l border-gray-600 mx-1"></span>
          <button type="button" title="Insert Image" className="px-2 py-1 rounded hover:bg-gray-700" onClick={handleImageUploadClick}>Image</button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" /> {/* Hidden file input */}
          <button type="button" title="Insert Link" className="px-2 py-1 rounded hover:bg-gray-700" onClick={() => formatText('createLink', prompt('Enter the URL'))}>Link</button>
          <span className="border-l border-gray-600 mx-1"></span>
          <button type="button" title="Align Left" className="px-2 py-1 rounded hover:bg-gray-700" onClick={() => formatText('justifyLeft')}>Left</button>
          <button type="button" title="Align Center" className="px-2 py-1 rounded hover:bg-gray-700" onClick={() => formatText('justifyCenter')}>Center</button>
          <button type="button" title="Align Right" className="px-2 py-1 rounded hover:bg-gray-700" onClick={() => formatText('justifyRight')}>Right</button>
          <span className="border-l border-gray-600 mx-1"></span>
          <button type="button" title="Numbered List" className="px-2 py-1 rounded hover:bg-gray-700" onClick={() => formatText('insertOrderedList')}>Numbered List</button>
          <button type="button" title="Blockquote" className="px-2 py-1 rounded hover:bg-gray-700" onClick={() => formatText('formatBlock', 'blockquote')}>Quote</button>
          {/* Add more formatting options as needed */}
        </div>
        {/* Content Editable Area */}
        <div
          ref={editorRef}
          contentEditable="true"
          onInput={handleEditorInput}
          className="w-full flex-1 p-4 bg-gray-800 text-cozy-text-light focus:outline-none resize-none overflow-y-auto leading-relaxed"
          style={{ minHeight: '300px' }} // Ensure a minimum height
        >
          {/* Content is set by useEffect */}
        </div>
      </div>
    </div>
  );
}

// --- StoryToolsPanel Component ---
function StoryToolsPanel({ chapters, setChapters, activeChapterIndex, setActiveChapterIndex, activePageIndex, setActivePageIndex, tags, setTags }) {
  const [activeSection, setActiveSection] = useState('chapters'); // 'chapters', 'notes', 'tags', 'tips'
  const [newChapterName, setNewChapterName] = useState('');
  const [editingChapterIndex, setEditingChapterIndex] = useState(null);
  const [editedChapterName, setEditedChapterName] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  const toggleSection = (section) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const addChapter = () => {
    if (newChapterName.trim()) {
      const newChapterId = `ch${chapters.length + 1}`;
      const newChapter = { id: newChapterId, name: newChapterName.trim(), pages: [{ id: `${newChapterId}_p1`, content: '' }] };
      setChapters([...chapters, newChapter]);
      setActiveChapterIndex(chapters.length); // Select the new chapter
      setActivePageIndex(0); // Go to first page of new chapter
      setNewChapterName('');
    }
  };

  const startEditChapter = (index) => {
    setEditingChapterIndex(index);
    setEditedChapterName(chapters[index].name);
  };

  const saveEditedChapter = (index) => {
    if (editedChapterName.trim()) {
      const updatedChapters = [...chapters];
      updatedChapters[index].name = editedChapterName.trim();
      setChapters(updatedChapters);
      setEditingChapterIndex(null);
    }
  };

  const deleteChapter = (indexToDelete) => {
    if (window.confirm(`Are you sure you want to delete chapter "${chapters[indexToDelete].name}" and all its pages?`)) {
      const updatedChapters = chapters.filter((_, i) => i !== indexToDelete);
      setChapters(updatedChapters);
      if (activeChapterIndex === indexToDelete) {
        // If current chapter is deleted, navigate to first chapter or null
        setActiveChapterIndex(updatedChapters.length > 0 ? 0 : null);
        setActivePageIndex(0);
      } else if (activeChapterIndex > indexToDelete) {
        setActiveChapterIndex(activeChapterIndex - 1);
      }
    }
  };

  const addPage = () => {
    if (activeChapterIndex !== null) {
      const updatedChapters = [...chapters];
      const currentChapter = updatedChapters[activeChapterIndex];
      const newPageId = `${currentChapter.id}_p${currentChapter.pages.length + 1}`;
      currentChapter.pages.push({ id: newPageId, content: '' });
      setChapters(updatedChapters);
      setActivePageIndex(currentChapter.pages.length - 1); // Navigate to new page
    }
  };

  const deletePage = (pageIndexToDelete) => {
    if (activeChapterIndex !== null && chapters[activeChapterIndex].pages.length > 1) {
      if (window.confirm(`Are you sure you want to delete this page?`)) {
        const updatedChapters = [...chapters];
        const currentChapter = updatedChapters[activeChapterIndex];
        currentChapter.pages = currentChapter.pages.filter((_, i) => i !== pageIndexToDelete);
        setChapters(updatedChapters);
        // Adjust active page index if necessary
        setActivePageIndex(Math.max(0, pageIndexToDelete - 1));
      }
    } else {
      alert("Cannot delete the last page of a chapter.");
    }
  };

  const addTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };


  return (
    <div className="w-1/3 p-6 space-y-6 bg-cozy-card-bg rounded-xl border border-gray-700/50 backdrop-blur-sm shadow-lg flex flex-col overflow-y-auto">
      <h2 className="text-2xl font-bold text-center text-indigo-300 mb-4">Writer's Toolkit</h2>

      {/* Chapters Section */}
      <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('chapters')}>
          <h3 className="text-xl font-semibold text-gray-300">Chapters ({chapters.length})</h3>
          {activeSection === 'chapters' ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
        {activeSection === 'chapters' && (
          <div className="mt-3 text-gray-400 text-sm space-y-2 pt-3 border-t border-gray-700/30">
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                placeholder="New Chapter Name"
                className="flex-1 p-2 rounded-md bg-gray-900 border border-gray-700 focus:ring-1 focus:ring-indigo-500 outline-none text-cozy-text-light"
                value={newChapterName}
                onChange={(e) => setNewChapterName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addChapter()}
              />
              <button onClick={addChapter} className="bg-cozy-button-bg text-cozy-text-light py-2 px-3 rounded-md hover:bg-cozy-button-hover transition-colors">
                Add
              </button>
            </div>
            <ul className="space-y-1">
              {chapters.map((chapter, index) => (
                <li
                  key={chapter.id}
                  className={`flex items-center justify-between p-2 rounded-md transition-colors ${activeChapterIndex === index ? 'bg-indigo-700/30 text-indigo-200 font-semibold' : 'hover:bg-gray-700/50 cursor-pointer'}`}
                  onClick={() => { setActiveChapterIndex(index); setActivePageIndex(0); }}
                >
                  {editingChapterIndex === index ? (
                    <input
                      type="text"
                      value={editedChapterName}
                      onChange={(e) => setEditedChapterName(e.target.value)}
                      onBlur={() => saveEditedChapter(index)}
                      onKeyPress={(e) => e.key === 'Enter' && saveEditedChapter(index)}
                      className="flex-1 p-1 rounded-sm bg-gray-900 border border-indigo-500 outline-none text-cozy-text-light"
                      autoFocus
                    />
                  ) : (
                    <span className="flex-1">{chapter.name} ({chapter.pages.length} pages)</span>
                  )}
                  <div className="flex items-center gap-1 ml-2">
                    {editingChapterIndex !== index && (
                      <button onClick={(e) => { e.stopPropagation(); startEditChapter(index); }} title="Edit Chapter" className="p-1 rounded-full hover:bg-indigo-600/50 text-gray-300 text-sm">Edit</button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); deleteChapter(index); }} title="Delete Chapter" className="p-1 rounded-full hover:bg-red-600/50 text-gray-300 text-sm">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Page Navigation */}
      {activeChapterIndex !== null && chapters[activeChapterIndex] && (
        <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
          <h3 className="text-xl font-semibold text-gray-300 mb-3">Pages (Current: {activePageIndex + 1}/{chapters[activeChapterIndex]?.pages.length || 0})</h3>
          <div className="flex justify-between items-center gap-2">
            <button
              onClick={() => setActivePageIndex(prev => Math.max(0, prev - 1))}
              disabled={activePageIndex === 0}
              className="bg-cozy-button-bg text-cozy-text-light py-2 px-3 rounded-md hover:bg-cozy-button-hover transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={addPage}
              className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white py-2 px-3 rounded-md hover:from-purple-600 hover:to-indigo-600 transition-colors"
            >
              Add Page
            </button>
            <button
              onClick={() => setActivePageIndex(prev => Math.min(chapters[activeChapterIndex].pages.length - 1, prev + 1))}
              disabled={activePageIndex === (chapters[activeChapterIndex].pages.length - 1)}
              className="bg-cozy-button-bg text-cozy-text-light py-2 px-3 rounded-md hover:bg-cozy-button-hover transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
          {chapters[activeChapterIndex].pages.length > 1 && (
            <button
              onClick={() => deletePage(activePageIndex)}
              className="w-full mt-3 bg-red-600 text-white py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Delete Current Page
            </button>
          )}
        </div>
      )}


      {/* Tags Section */}
      <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('tags')}>
          <h3 className="text-xl font-semibold text-gray-300">Tags</h3>
          {activeSection === 'tags' ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
        {activeSection === 'tags' && (
          <div className="mt-3 text-gray-400 text-sm space-y-2 pt-3 border-t border-gray-700/30">
            <p className="italic">Add relevant tags to your manga (e.g., Action, Romance, Fantasy).</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, index) => (
                <span key={index} className="bg-indigo-600/30 text-indigo-200 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 text-gray-300 hover:text-white text-sm">X</button>
                </span>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Add new tag"
                className="flex-1 p-2 rounded-md bg-gray-900 border border-gray-700 focus:ring-1 focus:ring-indigo-500 outline-none text-cozy-text-light"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <button onClick={addTag} className="bg-cozy-button-bg text-cozy-text-light py-2 px-3 rounded-md hover:bg-cozy-button-hover transition-colors">
                Add
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Story Notes Section */}
      <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('notes')}>
          <h3 className="text-xl font-semibold text-gray-300">Story Notes</h3>
          {activeSection === 'notes' ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
        {activeSection === 'notes' && (
          <div className="mt-3 text-gray-400 text-sm space-y-2 pt-3 border-t border-gray-700/30">
            <p className="italic">Jot down character details, plot ideas, or future plans.</p>
            <textarea
              rows={4}
              className="w-full p-2 rounded-md bg-gray-900 border border-gray-700 focus:ring-1 focus:ring-indigo-500 outline-none text-cozy-text-light"
              placeholder="Your private notes..."
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
          <h3 className="text-xl font-semibold text-gray-300">Helpful Tips</h3>
          {activeSection === 'tips' ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
        </div>
        {activeSection === 'tips' && (
          <div className="mt-3 text-gray-400 text-sm space-y-2 pt-3 border-t border-gray-700/30">
            <p className="italic">Tips for creating engaging manga:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Plan your panel layouts.</li>
              <li>Practice dynamic poses.</li>
              <li>Develop strong character expressions.</li>
              <li>Show, don't just tell.</li>
            </ul>
          </div>
        )}
      </div>

      {/* Progress / Status (Placeholder) */}
      <div className="bg-gray-800/70 p-4 rounded-lg border border-gray-700/50 text-gray-400 text-sm text-center">
        <h3 className="text-xl font-semibold text-gray-300 mb-2">Total Pages: <span className="font-bold text-cozy-text-light">{chapters.reduce((acc, ch) => acc + ch.pages.length, 0)}</span></h3>
        <h3 className="text-xl font-semibold text-gray-300">Last Saved: <span className="font-bold text-cozy-text-light">5 mins ago</span></h3>
      </div>
    </div>
  );
}


// --- Fan Story Creation Page Component (Main Layout for Manga Writing) ---
export default function FanStoryCreationPage({ onBack, userId, awardPoints }) {
  // State for the entire manga project
  const [mangaTitle, setMangaTitle] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverImageUrl, setCoverImageUrl] = useState(null);
  const [tags, setTags] = useState(['Action', 'Fantasy']); // Initial mock tags

  const [chapters, setChapters] = useState([
    { id: 'ch1', name: 'Prologue', pages: [{ id: 'ch1_p1', content: '' }] },
  ]);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [activePageIndex, setActivePageIndex] = useState(0);

  // Get the current page's content and its setter
  const currentChapter = chapters[activeChapterIndex];
  const currentPage = currentChapter ? currentChapter.pages[activePageIndex] : null;

  const setCurrentPageContent = useCallback((newContent) => {
    if (currentPage) {
      const updatedChapters = [...chapters];
      updatedChapters[activeChapterIndex].pages[activePageIndex].content = newContent;
      setChapters(updatedChapters);
    }
  }, [chapters, activeChapterIndex, activePageIndex, currentPage]);


  const handlePublish = async () => {
    if (!mangaTitle.trim() || chapters.length === 0 || chapters.every(ch => ch.pages.every(p => !p.content.trim()))) {
      alert('Manga Title, Chapters, and Content cannot be empty!');
      return;
    }

    // Prepare data
    const { data: { user } } = await supabase.auth.getUser();
    const newMangaId = crypto.randomUUID();
    const newManga = {
      id: newMangaId,
      user_id: user.id,
      title: mangaTitle,
      synopsis: chapters[0]?.pages[0]?.content?.slice(0, 200) || "",
      content: JSON.stringify(chapters),
      tags,
      cover_image_url: coverImageUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: "published",
      views: 0,
    };

    // Insert into fan_stories
    const { error } = await supabase.from("fan_stories").insert([newManga]);
    if (error) {
      alert("Failed to publish manga: " + error.message);
      return;
    }

    // Award points and XP, and log in user_activities_log
    try {
      await awardPoints(
        user.id,
        'manga_posted',
        80,
        newMangaId,
        'fan_story'
      );
      await awardPoints(
        user.id,
        'manga_posted_xp',
        90,
        newMangaId,
        'fan_story'
      );
      alert("Manga Published! 80 Points and 90 XP awarded!");
    } catch (pointsError) {
      alert("Manga published, but failed to award points/xp: " + pointsError.message);
    }

    // Reset state after publish
    setMangaTitle('');
    setCoverImage(null);
    setCoverImageUrl(null);
    setTags([]);
    setChapters([{ id: 'ch1', name: 'Prologue', pages: [{ id: 'ch1_p1', content: '' }] }]);
    setActiveChapterIndex(0);
    setActivePageIndex(0);
    onBack();
  };

  const handleSaveDraft = () => {
    alert('Manga Draft Saved! (Concept)');
    console.log({ title: mangaTitle, chapters, tags, status: 'draft', coverImageName: coverImage?.name });
  };

  // Inject Keyframes for background animation (if this component is the root for effects)
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
    // Outer container for the entire writing page.
    // This component assumes it's being rendered within a parent that handles the full screen
    // background image and overlay, as it focuses on the card itself.
    // If used standalone, ensure parent provides full screen div with background.
    <div className="absolute inset-0 flex flex-col items-center justify-center py-8 px-4 z-30 overflow-y-auto">
        {/* Background elements if rendered within this component directly.
            Ideally, FloatingDustParticles would be higher up in the component tree
            if they are meant to cover the entire page background. */}
        <FloatingDustParticles />

        {/* Main content card, max-width adjusted, height set to full available minus some padding */}
        <div className="w-full max-w-screen-2xl flex-1 rounded-xl p-8 shadow-2xl border border-gray-700/50 backdrop-blur-md flex flex-col overflow-y-auto"
            style={{
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(0, 0, 0, 0.2)',
                background: `
                    radial-gradient(circle at center, rgba(157, 214, 255, 0.05) 0%, transparent 70%),
                    ${customColors['cozy-card-bg']}
                `,
            }}
        >
            {/* Back button */}
            <button onClick={onBack} className="absolute top-4 left-4 text-gray-400 hover:text-gray-200 text-lg flex items-center gap-1 z-40">
                &larr; Back
            </button>
            
            {/* Page Title */}
            <h1 className="text-3xl font-bold text-center mt-4 mb-8 text-indigo-300">
                Craft Your Manga
            </h1>

            {/* Main content area with two panels: Editor on left, Tools on right */}
            <div className="flex flex-1 space-x-6 pb-6">
                {/* Left pane: Content Editor */}
                <StoryContentEditor
                    title={mangaTitle}
                    setTitle={setMangaTitle}
                    currentContent={currentPage ? currentPage.content : ''}
                    setCurrentContent={setCurrentPageContent}
                    coverImage={coverImage}
                    setCoverImage={setCoverImage}
                    coverImageUrl={coverImageUrl}
                    setCoverImageUrl={setCoverImageUrl}
                />

                {/* Right pane: Tools Panel */}
                <StoryToolsPanel
                    chapters={chapters}
                    setChapters={setChapters}
                    activeChapterIndex={activeChapterIndex}
                    setActiveChapterIndex={setActiveChapterIndex}
                    activePageIndex={activePageIndex}
                    setActivePageIndex={setActivePageIndex}
                    tags={tags}
                    setTags={setTags}
                />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700/50">
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
                onClick={handlePublish}
                className="px-6 py-3 rounded-full text-lg font-semibold transition-all duration-300 ease-in-out bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
                style={{
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                    textShadow: '0 0 5px rgba(0,0,0,0.3)',
                }}
                >
                Publish Manga
                </button>
            </div>
        </div>
    </div>
  );
}
