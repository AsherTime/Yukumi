"use client"

import { useState, useEffect, useMemo } from "react"
import debounce from 'lodash/debounce';
import { flushSync } from 'react-dom';
import { Upload, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useNavigationContext } from '@/contexts/NavigationContext';

export default function ProfileSetup() {
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [age, setAge] = useState("")
  const [gender, setGender] = useState("")
  const [country, setCountry] = useState("")
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const { fromPage, setFromPage } = useNavigationContext();

  useEffect(() => {
    const fromPageReload = sessionStorage.getItem("fromPageReload");
    const fromNoProfile = sessionStorage.getItem("fromNoProfile");
    if (fromPage !== 'register' && fromPageReload !== 'register' && fromNoProfile !== 'register') {
      router.replace('/unauthorized'); // or '/'
    }
    sessionStorage.removeItem("fromPageReload");

  }, [fromPage, router]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem("fromPageReload", "register");
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);



  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim()) {
      setIsUsernameAvailable(null);
      return;
    }

    setChecking(true);
    const { data, error } = await supabase
      .from("Profiles")
      .select("id")
      .eq("username", username)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error checking username:", error);
      setIsUsernameAvailable(null);
    } else {
      setIsUsernameAvailable(!data);
    }

    setChecking(false);
  };

  const debouncedCheck = useMemo(
    () => debounce(checkUsernameAvailability, 500),
    []
  );

  useEffect(() => {
    debouncedCheck(username);
    return () => {
      debouncedCheck.cancel();
    };
  }, [username, debouncedCheck]);

  useEffect(() => {
    const checkIfNewUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Check in your own table (e.g., "Profiles") if the profile exists
      const { data: profile } = await supabase
        .from('Profiles')
        .select('*')
        .eq('id', user.id) // or 'firebase_uid' or whatever ID field you use
        .maybeSingle();

      if (profile) {
        // Existing user, go to homepage or dashboard
        router.push('/homepage'); // or wherever
      }
    };

    checkIfNewUser();
  }, [router]);


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
      } catch (error) {
        console.error("Initialization error:", error)
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

    if (!isUsernameAvailable) {
      toast.error("Username is not available. Please choose another one.");
      return;
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
          age: age || 18,
          gender: gender || 'prefer-not-to-say',
          country: country || 'prefer-not-to-say',
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
      flushSync(() => {
        setFromPage("profile-setup");
      });
      router.push("/quiz/join-communities")
    } catch (error) {
      console.error(error || "Failed to update profile")
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
    } catch (error) {
      console.error(error || "Failed to upload image");
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
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className={isUsernameAvailable === false ? 'border-red-500' : ''}
              />
              {checking && <p className="text-gray-400 text-sm mt-1">Checking availability...</p>}
              {isUsernameAvailable === true && (
                <p className="text-green-400 text-sm mt-1">Username is available ✅</p>
              )}
              {isUsernameAvailable === false && (
                <p className="text-red-400 text-sm mt-1">Username is already taken ❌</p>
              )}
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
                <SelectContent className="bg-gray-800 text-white">
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
