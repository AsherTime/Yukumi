"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { Loader2, Bold, Italic, Underline, ImageIcon } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface Anime {
  id: string;
  title: string;
}

let debounceTimeout: NodeJS.Timeout | null = null;

export default function CoverUpload() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isOriginalWork, setIsOriginalWork] = useState(false)
  const [referenceLink, setReferenceLink] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeStyles, setActiveStyles] = useState<string[]>([])
  const [animeList, setAnimeList] = useState<Anime[]>([])
  const [filteredAnime, setFilteredAnime] = useState<Anime[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAnime, setSelectedAnime] = useState<string | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<string | undefined>(undefined)
  const editorRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const router = useRouter()
  const [animeLoading, setAnimeLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    fetchAnimeList()
  }, [user, router])

  const fetchAnimeList = async (query: string = "") => {
    try {
      let supaQuery = supabase
        .from('posts')
        .select('animetitle_post')
        .not('animetitle_post', 'is', null);
      if (query) {
        supaQuery = supaQuery.ilike('animetitle_post', `${query}%`);
      }
      const { data, error } = await supaQuery.order('animetitle_post');
      if (error) throw error;
      // Unique and sorted
      const uniqueAnime = Array.from(new Set(data?.map(post => post.animetitle_post)))
        .filter(title => title)
        .sort((a, b) => a.localeCompare(b))
        .map((title, index) => ({ id: `anime-${index}`, title }));
      setAnimeList(uniqueAnime);
      setFilteredAnime(uniqueAnime.slice(0, 2));
    } catch (error: any) {
      setAnimeList([]);
      setFilteredAnime([]);
    } finally {
      setAnimeLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    setAnimeLoading(true);
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      fetchAnimeList(query);
    }, 300);
  };

  const saveCursorPosition = () => {
    const selection = window.getSelection()
    if (!selection || !editorRef.current || selection.rangeCount === 0) return null

    const range = selection.getRangeAt(0)
    const preCaretRange = range.cloneRange()
    preCaretRange.selectNodeContents(editorRef.current)
    preCaretRange.setEnd(range.startContainer, range.startOffset)
    return preCaretRange.toString().length
  }

  const restoreCursorPosition = (position: number) => {
    const selection = window.getSelection()
    if (!selection || !editorRef.current) return

    const range = document.createRange()
    let charCount = 0
    const nodes = editorRef.current.childNodes

    for (const node of nodes) {
      const textLength = node.textContent?.length ?? 0

      if (charCount + textLength >= position) {
        try {
          range.setStart(node, Math.min(position - charCount, textLength))
          range.setEnd(node, Math.min(position - charCount, textLength))
          selection.removeAllRanges()
          selection.addRange(range)
        } catch (error) {
          console.error("Failed to restore cursor:", error)
        }
        break
      }

      charCount += textLength
    }
  }

  const applyStyle = (style: string) => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const selectedText = range.toString()

    if (!selectedText) return

    document.execCommand('styleWithCSS', false, 'true')
    
    switch (style) {
      case 'bold':
        document.execCommand('bold', false)
        break
      case 'italic':
        document.execCommand('italic', false)
        break
      case 'underline':
        document.execCommand('underline', false)
        break
    }

    updateActiveStyles()
  }

  const updateActiveStyles = () => {
    const newActiveStyles = []
    if (document.queryCommandState('bold')) newActiveStyles.push('bold')
    if (document.queryCommandState('italic')) newActiveStyles.push('italic')
    if (document.queryCommandState('underline')) newActiveStyles.push('underline')
    setActiveStyles(newActiveStyles)
  }

  const buttonClass = (tag: string) =>
    `p-1.5 rounded transition-colors ${
      activeStyles.includes(tag) ? "bg-[#3A3A3A]" : "hover:bg-[#3A3A3A]"
    }`

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError("Please select an image file")
      return
    }

    setSelectedFile(file)
    setError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setError("Please select an image first")
      return
    }

    if (!title.trim()) {
      setError("Please enter a title")
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Upload image
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`

      const { data: uploadedImage, error: uploadError } = await supabase.storage
        .from("posts-image")
        .upload(`posts/${fileName}`, selectedFile, {
          upsert: false
        })

      if (uploadError) {
        console.error("Upload error:", uploadError)
        throw new Error("Failed to upload image")
      }

      const { data: { publicUrl } } = supabase.storage
        .from("posts-image")
        .getPublicUrl(uploadedImage.path)

      // Get the selected anime title if any
      const selectedAnimeTitle = selectedAnime ? animeList.find(a => a.id === selectedAnime)?.title : null

      // Create post with updated field names
      const postData = {
        user_id: user?.id,
        title,
        content,
        created_at: new Date().toISOString(),
        image_url: publicUrl,
        animetitle_post: selectedAnimeTitle,
        post_collections: selectedCollection || null,
        original_work: isOriginalWork,
        reference_link: referenceLink || null
      }

      console.log("Attempting to create post with data:", postData)

      const { data: newPost, error: postError } = await supabase
        .from("posts")
        .insert(postData)
        .select()

      if (postError) {
        console.error("Post creation error:", postError)
        throw new Error(postError.message)
      }

      console.log("Post created successfully:", newPost)
      toast.success("Post created successfully!")
      router.push('/homepage')
    } catch (error: any) {
      console.error("Error creating post:", error)
      setError(error.message || "Failed to create post")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Upload New Post</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title"
              className="bg-[#2e2e2e] border-0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Cover Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="bg-[#2e2e2e] border-0"
            />
            {previewImage && (
              <div className="mt-2">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="max-h-48 rounded"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Content</Label>
            <div className="bg-[#2A2A2A] p-2 flex gap-2 border-b border-[#3A3A3A]">
              <button
                type="button"
                className={buttonClass("bold")}
                onClick={() => applyStyle("bold")}
              >
                <Bold className="w-4 h-4 text-white" />
              </button>
              <button
                type="button"
                className={buttonClass("italic")}
                onClick={() => applyStyle("italic")}
              >
                <Italic className="w-4 h-4 text-white" />
              </button>
              <button
                type="button"
                className={buttonClass("underline")}
                onClick={() => applyStyle("underline")}
              >
                <Underline className="w-4 h-4 text-white" />
              </button>
            </div>
            <div
              ref={editorRef}
              contentEditable
              className="w-full h-64 p-4 bg-[#2A2A2A] text-white resize-none focus:outline-none border border-[#3A3A3A] rounded-lg mt-2 overflow-auto"
              onSelect={updateActiveStyles}
              onInput={(e) => {
                setContent(e.currentTarget.innerHTML)
              }}
            />
          </div>

          <div className="space-y-2">
            <Label>Select Collection</Label>
            <Select onValueChange={setSelectedCollection}>
              <SelectTrigger className="bg-[#2e2e2e] border-0">
                <SelectValue placeholder="Select Collection" />
              </SelectTrigger>
              <SelectContent className="bg-[#2e2e2e] border-[#3A3A3A]">
                <SelectItem value="Fanart">Fanart</SelectItem>
                <SelectItem value="Memes">Memes</SelectItem>
                <SelectItem value="Discussion">Discussion</SelectItem>
                <SelectItem value="Theory">Theory</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Select Anime</Label>
            <div className="relative">
              <Input
                type="text"
                value={searchQuery}
                onChange={handleSearch}
                placeholder="Search anime..."
                className="bg-[#2e2e2e] border-0"
              />
              {searchQuery && (
                <div className="absolute w-full mt-1 bg-[#232323] border border-[#3A3A3A] rounded-lg z-50 shadow-lg">
                  {animeLoading ? (
                    <div className="p-2 text-gray-400">Loading...</div>
                  ) : filteredAnime.length > 0 ? (
                    <div className="max-h-60 overflow-y-auto">
                      {filteredAnime.map((anime) => (
                        <div
                          key={anime.id}
                          className="px-3 py-2 hover:bg-[#3A3A3A] cursor-pointer transition-colors"
                          onClick={() => {
                            setSelectedAnime(anime.id);
                            setSearchQuery(anime.title);
                          }}
                        >
                          {anime.title}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 text-gray-400">No results found</div>
                  )}
                </div>
              )}
            </div>
            {selectedAnime && (
              <div className="mt-2 text-sm text-gray-400">
                Selected: {animeList.find(a => a.id === selectedAnime)?.title}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Original Work</Label>
            <div className="flex items-center gap-4 p-4 bg-[#2e2e2e] rounded-lg">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="original-yes"
                  name="original-work"
                  checked={isOriginalWork}
                  onChange={() => setIsOriginalWork(true)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                />
                <Label htmlFor="original-yes" className="cursor-pointer">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="original-no"
                  name="original-work"
                  checked={!isOriginalWork}
                  onChange={() => setIsOriginalWork(false)}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 focus:ring-blue-500"
                />
                <Label htmlFor="original-no" className="cursor-pointer">No</Label>
              </div>
            </div>
            {!isOriginalWork && (
              <Input
                value={referenceLink}
                onChange={(e) => setReferenceLink(e.target.value)}
                placeholder="Enter reference link"
                className="bg-[#2e2e2e] border-0 mt-2"
              />
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Post"
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}
