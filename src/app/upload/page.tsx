"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Bold, Italic, Underline } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import DOMPurify from 'dompurify';
import { IKContext, IKUpload } from 'imagekitio-react';
import { awardPoints } from "@/utils/awardPoints"


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
  const { user, loading: isLoading } = useAuth()
  const router = useRouter()
  const [animeLoading, setAnimeLoading] = useState(false);
  const [postTags, setPostTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tagError, setTagError] = useState<string | null>(null);
  const [showAnimeDropdown, setShowAnimeDropdown] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isLoading) return

    // 2. Once loading is false, if there’s no user, redirect
    if (!user) {
      router.push('/auth/login')
    }
    // Check for community_id in query params
    const communityId = searchParams.get('community_id');
    if (communityId) {
      // Fetch the community and its anime_id, then pre-select the anime
      (async () => {
        const { data: community, error: communityError } = await supabase
          .from('community')
          .select('anime_id')
          .eq('id', communityId)
          .maybeSingle();
        if (community && community.anime_id) {
          // Fetch the anime
          const { data: anime, error: animeError } = await supabase
            .from('Anime')
            .select('id, title')
            .eq('id', community.anime_id)
            .maybeSingle();
          if (anime) {
            setAnimeList((prev) => [{ id: anime.id, title: anime.title }, ...prev.filter(a => a.id !== anime.id)]);
            setSelectedAnime(anime.id);
          }
        }
        fetchAnimeList();
      })();
    } else {
      fetchAnimeList();
    }
  }, [user, router, searchParams, isLoading]);

  const fetchAnimeList = async (query: string = "") => {
    try {
      let supaQuery = supabase
        .from('Anime')
        .select('title')
        .not('title', 'is', null);
      if (query) {
        supaQuery = supaQuery.ilike('title', `${query}%`);
      }
      const { data, error } = await supaQuery.order('title');
      if (error) throw error;
      // Unique and sorted
      const uniqueAnime = Array.from(new Set(data?.map(post => post.title)))
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
    setShowAnimeDropdown(true);
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
    `p-1.5 rounded transition-colors ${activeStyles.includes(tag) ? "bg-[#3A3A3A]" : "hover:bg-[#3A3A3A]"
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


  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        alert('You must be logged in to post.');
        return;
      }
      const selectedAnimeTitle = selectedAnime ? animeList.find(a => a.id === selectedAnime)?.title : null
      const postData = {
        user_id: user.id,
        title,
        content,
        created_at: new Date().toISOString(),
        image_url: imageUrl,
        animetitle_post: selectedAnimeTitle,
        post_collections: selectedCollection || null,
        original_work: isOriginalWork,
        reference_link: referenceLink || null
      }

      const { data: newPost, error: postError } = await supabase
        .from("posts")
        .insert(postData)
        .select()
        .single();

      if (postError) {
        console.error("Post creation error:", postError)
        throw new Error(postError.message)
      } else {
        // Award points for creating a post
        try {
          await awardPoints(
            user.id,
            'post_created',
            25,
            newPost.id,
            'post'
          );
          toast.success('Post created successfully! +25 XP');
        } catch (pointsError) {
          console.error('Failed to award points for post creation:', pointsError);
          toast.success('Post created successfully!');
        }
        setTitle('');
        setContent('');
        setImageUrl('');
        setPreviewImage('');
      }
      let finalTags = [...postTags];
      if (tagInput.trim() !== "" && !postTags.includes(tagInput.trim().toLowerCase())) {
        finalTags.push(tagInput.trim().toLowerCase());
      }
      console.log("Final tags:", finalTags)
      for (const tag of finalTags) {
        // 1. Check if tag exists
        let tagId: string | null = null;
        const { data: tagRow, error: tagFetchError } = await supabase
          .from("tags")
          .select("id")
          .eq("name", tag)
          .maybeSingle();
        if (tagFetchError) {
          throw new Error("Error checking tag: " + tag);
        }
        if (tagRow && tagRow.id) {
          tagId = tagRow.id;
        } else {
          // 2. Insert tag if not exists
          const { data: newTag, error: tagInsertError } = await supabase
            .from("tags")
            .insert({ name: tag })
            .select()
            .single();
          if (tagInsertError) {
            throw new Error("Error inserting tag: " + tag);
          }
          tagId = newTag.id;
        }
        // 3. Insert into post_tags
        const { error: postTagError } = await supabase
          .from("post_tags")
          .insert({ post_id: newPost.id, tag_id: tagId });
        if (postTagError) {
          throw new Error("Error linking tag to post: " + tag);
        }
      }

      console.log("Post created successfully:", newPost)
      router.push('/homepage')
    } catch (error: any) {
      console.error("Error creating post:", error)
      setError(error.message || "Failed to create post")
    } finally {
      setLoading(false)
    }

  };


  // Tag input handlers
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length > 30) return;
    setTagInput(e.target.value);
    setTagError(null);
  };
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim() && postTags.length < 5) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (newTag.length > 30) {
        setTagError("Tag must be 30 characters or less.");
        return;
      }
      if (!postTags.includes(newTag)) {
        setPostTags([...postTags, newTag]);
        setTagInput("");
        setTagError(null);
      } else {
        setTagError("Duplicate tag.");
      }
    } else if (e.key === "Backspace" && !tagInput && postTags.length > 0) {
      setPostTags(postTags.slice(0, -1));
      setTagError(null);
    }
  };
  const handleRemoveTag = (tag: string) => {
    setPostTags(postTags.filter(t => t !== tag));
    setTagError(null);
  };

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#1E1E1E] text-white p-6">
      <div className="max-w-2xl mx-auto relative">
        {/* Cancel/Cross Button */}
        <button
          onClick={() => router.push('/homepage')}
          className="absolute top-0 right-0 mt-2 mr-2 text-gray-400 hover:text-white text-2xl z-20"
          aria-label="Cancel and go back"
        >
          &times;
        </button>
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

          <IKContext
            publicKey={process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!}
            urlEndpoint={process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!}
            authenticator={async () => {
              const res = await fetch("/api/imagekit-auth");
              return await res.json();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="image">Cover Image</Label>

              <IKUpload
                id="image"
                fileName="cover-image.jpg"
                folder="/posts" // ✅ Uploads image to the 'posts' folder
                onSuccess={(res: { url: string }) => {
                  console.log("Upload success:", res);
                  setPreviewImage(res.url);
                  setImageUrl(res.url);
                }}
                onError={(err: Error) => {
                  console.error("Upload error:", err);
                }}
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
          </IKContext>


          <div className="space-y-2">
            <Label>Content
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
              id="editor"
              ref={editorRef}
              contentEditable
              tabIndex={0} 
              role="textbox" 
              aria-multiline="true" 
              className="w-full h-64 p-4 bg-[#2A2A2A] text-white resize-none focus:outline-none border border-[#3A3A3A] rounded-lg mt-2 overflow-auto"
              onSelect={updateActiveStyles}
              onInput={(e) => {
                const safeContent = DOMPurify.sanitize(e.currentTarget.innerHTML);
                setContent(safeContent);
              }}
            />
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="select-collection">Select Collection</Label>
            <Select name="select-collection-container" onValueChange={setSelectedCollection}>
              <SelectTrigger id="select-collection" className="bg-[#2e2e2e] border-0">
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
            <Label htmlFor="search-anime">Select Anime</Label>
            <div className="relative">
              <Input
                type="text"
                id="search-anime"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={() => setShowAnimeDropdown(true)}
                placeholder="Search anime..."
                className="bg-[#2e2e2e] border-0"
              />
              {searchQuery && showAnimeDropdown && (
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
                            setShowAnimeDropdown(false);
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
            <Label htmlFor="reference-link">Original Work</Label>
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
                id="reference-link"
                onChange={(e) => setReferenceLink(e.target.value)}
                placeholder="Enter reference link"
                className="bg-[#2e2e2e] border-0 mt-2"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag-input">Add topic</Label>
            <div className="flex flex-wrap items-center gap-2 bg-[#2e2e2e] border border-[#3A3A3A] rounded-lg px-2 py-2">
              {postTags.map((tag) => (
                <span key={tag} className="flex items-center bg-[#232232] text-white rounded-full px-4 py-1 text-sm mr-1 mb-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-gray-300 hover:text-red-400 focus:outline-none"
                    aria-label={`Remove tag ${tag}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
              {postTags.length < 5 && (
                <input
                  type="text"
                  id="tag-input"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  className="bg-transparent outline-none text-white px-2 py-1 min-w-[80px]"
                  placeholder={postTags.length === 0 ? "Add a tag..." : ""}
                  maxLength={30}
                />
              )}
            </div>
            {tagError && <div className="text-xs text-red-400 mt-1">{tagError}</div>}
            <div className="text-xs text-gray-400 mt-1">Up to 5 tags. Press Enter or comma to add. Max 30 chars per tag.</div>
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
