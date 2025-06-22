"use client"

import { useState, useEffect } from "react"
import { Upload, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function ProfileSetup() {
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [country, setCountry] = useState("")
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        // First check user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error("Session error:", sessionError)
          toast.error("Failed to get user session")
          return
        }

        if (!session) {
          console.log("No session found, redirecting to login")
          router.push("/auth/login")
          return
        }

        // Simple table check
        console.log("Checking Profiles table...")
        const { error: simpleError } = await supabase
          .from('Profiles')
          .select('id')
          .limit(1)

        if (simpleError) {
          if (simpleError.code === '42P01') {
            console.error("Table does not exist")
            toast.error("Profiles table does not exist. Please create it in Supabase.")
          } else if (simpleError.code === '42501') {
            console.error("Permission denied")
            toast.error("Permission denied. Please check your RLS policies in Supabase.")
          } else {
            console.error("Database error:", simpleError)
            toast.error("Database error: " + simpleError.message)
          }
          return
        }

        console.log("Table check passed")
        setLoading(false)
      } catch (error: any) {
        console.error("Initialization error:", error)
        toast.error("Failed to initialize: " + error.message)
      }
    }

    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white">Loading...</h1>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !displayName) {
      toast.error("Please fill in all required fields")
      return
    }
    
    try {
      console.log("Starting profile update...")
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error("Session error:", sessionError)
        throw new Error("Failed to get user session")
      }
      
      if (!session?.user) {
        console.error("No user session found")
        throw new Error("No user session")
      }

      console.log("User session found, updating profile...")

      const { data, error } = await supabase
        .from('Profiles')
        .upsert({
          id: session.user.id,
          username: username,
          display_name: displayName,
          age: age,
          gender: gender,
          country: country,
          avatar_url: profileImage,
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log("Profile update successful:", data)
      toast.success("Profile updated successfully!")
      router.push("/quiz/join-communities")
    } catch (error: any) {
      console.error("Profile update error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
      toast.error(error.message || "Failed to update profile")
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
  
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("No user session");
  
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;
  
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);
  
      if (uploadError) throw uploadError;
  
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);
  
      setProfileImage(publicUrl);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload image");
    }
  };
  

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-white">Complete Your Profile</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profileImage || ""} />
              <AvatarFallback>
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="profile-image" className="cursor-pointer">
                <Upload className="mr-2 inline-block h-5 w-5" />
                Upload Profile Picture
              </Label>
              <Input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={displayName}
                
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
              />
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                autoComplete="on"
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>

            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your age"
              />
            </div>

            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select name="gender" value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                autoComplete="on"
                placeholder="Enter your country"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700"
          >
            Save Profile
          </button>
        </form>
      </div>
    </div>
  )
}
