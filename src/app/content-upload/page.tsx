"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bold, Italic, Underline } from "lucide-react"; // Icons
import {
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  ImageIcon,
  Link,
} from "lucide-react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"

export default function CoverUpload() {
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isOriginalWork, setIsOriginalWork] = useState(false)
  const [referenceLink, setReferenceLink] = useState("")
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [activeStyles, setActiveStyles] = useState<string[]>([]); // Tracks active styles
  const [animeList, setAnimeList] = useState<{ id: string; title: string }[]>([]);
  const [filteredAnime, setFilteredAnime] = useState<{ id: string; title: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAnime, setSelectedAnime] = useState<string | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null); 
  const [supabaseUserId, setSupabaseUserId] = useState<string | null>(null); 

  const supabase = useSupabaseClient();

  // Fetch user data from Supabase
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          setSupabaseUserId(user.id);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };

    fetchUser();
  }, [supabase]);

  const editorRef = useRef<HTMLDivElement>(null);

  const saveCursorPosition = () => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(editorRef.current);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    return preCaretRange.toString().length; // Cursor index
  };

  const restoreCursorPosition = (position: number) => {
    const selection = window.getSelection();
    if (!selection || !editorRef.current) return;

    const range = document.createRange();
    let charCount = 0;
    const nodes = editorRef.current.childNodes;

    for (const node of nodes) {
      const textLength = node.textContent?.length ?? 0;

      if (charCount + textLength >= position) {
        try {
          range.setStart(node, Math.min(position - charCount, textLength));
          range.setEnd(node, Math.min(position - charCount, textLength));
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (error) {
          console.error("Failed to restore cursor:", error);
        }
        break;
      }

      charCount += textLength;
    }
  };

  const applyStyle = (style: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (!selectedText) return;

    document.execCommand('styleWithCSS', false, 'true');
    
    switch (style) {
      case 'bold':
        document.execCommand('bold', false);
        break;
      case 'italic':
        document.execCommand('italic', false);
        break;
      case 'underline':
        document.execCommand('underline', false);
        break;
    }

    updateActiveStyles();
  };

  const updateActiveStyles = () => {
    const newActiveStyles = [];
    if (document.queryCommandState('bold')) newActiveStyles.push('bold');
    if (document.queryCommandState('italic')) newActiveStyles.push('italic');
    if (document.queryCommandState('underline')) newActiveStyles.push('underline');
    setActiveStyles(newActiveStyles);
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const buttonClass = (tag: string) =>
    `p-1.5 rounded transition-colors ${activeStyles.includes(tag) ? "bg-[#3A3A3A]" : "hover:bg-[#3A3A3A]"}`;
  
  useEffect(() => {
    const fetchAnime = async () => {
      try {
        const { data, error } = await supabase
          .from('animes') // Replace with your Supabase table name
          .select('id, title');

        if (error) throw error;

        setAnimeList(data);
        setFilteredAnime(data);
      } catch (error) {
        console.error("Failed to fetch anime:", error);
      }
    };

    fetchAnime();
  }, [supabase]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    setFilteredAnime(
      animeList.filter((anime) => anime.title.toLowerCase().includes(query))
    );
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      alert("Please select an image first.");
      return;
    }

    try {
      setLoading(true); // Set loading state
      const { data: uploadedImage, error: uploadError } = await supabase.storage
        .from("posts-image") // Replace with your Supabase storage bucket
        .upload(`posts/${selectedFile.name}`, selectedFile);


      if (uploadError) throw uploadError;

      const imageUrl = supabase.storage.from("posts-image").getPublicUrl(uploadedImage.path).publicURL;

      await createPost(imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to upload the image.");
    } finally {
      setLoading(false); // Set loading state to false
    }
  };

  const createPost = async (imageUrl: string) => {
    try {
      const { data: animeData, error: animeError } = await supabase
        .from("animes") // Replace with your Supabase anime table
        .select("id")
        .eq("title", selectedAnime)
        .single();

      if (animeError) throw animeError;

      const { error: postError } = await supabase
        .from("posts") // Replace with your Supabase posts table
        .insert([{
          user_id: supabaseUserId,
          anime_id: animeData.id,
          title,
          content,
          image_url: imageUrl,
          collection: selectedCollection,
          OG_Work: isOriginalWork,
          ref_link: referenceLink,
        }]);

      if (postError) throw postError;

      alert("Post created successfully!");
    } catch (error) {
      console.error("Failed to create post:", error);
      setError("Failed to create the post.");
    }
  };
  return (
    <div className="min-h-screen bg-black p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Upload Content</h1>
      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div>
          <label className="block text-white mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-white mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            required
          />
        </div>
        <div>
          <label className="block text-white mb-2">File</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  )
}
