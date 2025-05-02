"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/AuthContext"

export default function CoverUpload() {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [isOriginalWork, setIsOriginalWork] = useState(false)
  const [referenceLink, setReferenceLink] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
      return
    }
  }, [user, router])

  useEffect(() => {
    // Log auth state when component mounts
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      console.log("Current session:", session)
      console.log("Auth error:", error)
      console.log("Current user:", user)
    }
    checkAuth()
  }, [user])

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

      // Log current auth state
      const { data: { session } } = await supabase.auth.getSession()
      console.log("Session during upload:", session)
      console.log("User during upload:", user)

      // Upload image
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      console.log("Attempting to upload file:", fileName)

      const { data: uploadedImage, error: uploadError } = await supabase.storage
        .from("posts-image")
        .upload(`posts/${fileName}`, selectedFile, {
          upsert: false
        })

      if (uploadError) {
        console.error("Upload Error:", {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          name: uploadError.name,
          stack: uploadError.stack
        })
        throw uploadError
      }

      console.log("Upload successful:", uploadedImage)

      const { data: { publicUrl } } = supabase.storage
        .from("posts-image")
        .getPublicUrl(uploadedImage.path)

      console.log("Public URL:", publicUrl)

      // Test post table access
      const { data: testSelect, error: testError } = await supabase
        .from("posts")
        .select()
        .limit(1)

      console.log("Test select result:", testSelect)
      console.log("Test select error:", testError)

      // Create post with debug
      const timestamp = new Date().toISOString()
      console.log("Attempting to insert post with data:", {
        user_id: user?.id,
        title,
        content,
        created_at: timestamp,
        image_url: publicUrl
      })

      const { data: postData, error: postError } = await supabase
        .from("posts")
        .insert({
          user_id: user?.id,
          title,
          content,
          created_at: timestamp,
          image_url: publicUrl
        })
        .select()

      if (postError) {
        console.error("Post Error Details:", {
          message: postError.message,
          details: postError.details,
          hint: postError.hint,
          code: postError.code,
          status: postError.status,
          statusText: postError.statusText
        })
        throw postError
      }

      console.log("Post created successfully:", postData)
      router.push('/homepage')
    } catch (error: any) {
      console.error("Full error details:", {
        name: error?.name,
        message: error?.message,
        status: error?.status,
        statusCode: error?.statusCode,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        stack: error?.stack
      })
      setError(error?.message || "Failed to create post. Please try again.")
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
            <Label htmlFor="content">Content</Label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter post content"
              className="w-full h-32 p-2 rounded bg-[#2e2e2e] border-0"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="original"
              checked={isOriginalWork}
              onCheckedChange={setIsOriginalWork}
            />
            <Label htmlFor="original">Original Work</Label>
          </div>

          {!isOriginalWork && (
            <div className="space-y-2">
              <Label htmlFor="reference">Reference Link</Label>
              <Input
                id="reference"
                value={referenceLink}
                onChange={(e) => setReferenceLink(e.target.value)}
                placeholder="Enter reference link"
                className="bg-[#2e2e2e] border-0"
              />
            </div>
          )}

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
