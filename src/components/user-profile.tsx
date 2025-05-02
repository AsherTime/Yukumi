"use client";

import { Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function UserProfile() {
  const [avatarUrl, setAvatarUrl] = useState<string>("/placeholder.svg");
  const [displayName, setDisplayName] = useState<string>("Loading...");
  const [editMode, setEditMode] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error:", sessionError);
          router.push("/auth/login");
          return;
        }

        if (!session) {
          router.push("/auth/login");
          return;
        }

        // Debug log to check session
        console.log("Current session user ID:", session.user.id);

        const { data: profile, error: profileError } = await supabase
          .from('Profiles')  // Capital P
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          if (profileError.code === 'PGRST116') {
            console.log("Profile not found, will be created on first update");
          } else {
            throw profileError;
          }
        }

        if (profile) {
          console.log("Fetched profile:", profile);
          setDisplayName(profile.display_name || "Anonymous");
          setAvatarUrl(profile.avatar_url || "/placeholder.svg");
          setProfileImage(profile.avatar_url || null);
        }
      } catch (error) {
        console.error("Error in fetchUserProfile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        toast.error("No file selected");
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size should be less than 5MB");
        return;
      }

      // Check file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload an image (PNG, JPEG, JPG, WEBP, or GIF)");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("No active session");
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      console.log("Starting upload process...");
      console.log("File path:", filePath);

      // Upload new avatar
      console.log("Uploading new file...");
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')  // Check if 'avatars' bucket exists in Supabase
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type // Explicitly set content type
        });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw uploadError;
      }

      console.log("Upload successful:", uploadData);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!urlData.publicUrl) {
        throw new Error("Failed to generate public URL");
      }

      const publicUrl = urlData.publicUrl;
      console.log("Generated public URL:", publicUrl);

      // Check if profile exists and create/update accordingly
      const { data: existingProfile, error: fetchError } = await supabase
        .from('Profiles')  // Capital P
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error fetching profile:", fetchError);
        throw fetchError;
      }

      let profileError;
      if (!existingProfile) {
        console.log("Creating new profile...");
        const { error: insertError } = await supabase
          .from('Profiles')  // Capital P
          .insert([{
            id: session.user.id,
            avatar_url: publicUrl,
            display_name: displayName || 'Anonymous',
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (insertError) {
          console.error("Insert error details:", insertError);
          profileError = insertError;
        }
      } else {
        console.log("Updating existing profile...");
        const { error: updateError } = await supabase
          .from('Profiles')  // Capital P
          .update({
            avatar_url: publicUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id)
          .select()
          .single();

        if (updateError) {
          console.error("Update error details:", updateError);
          profileError = updateError;
        }
      }

      if (profileError) {
        throw profileError;
      }

      // Update local state
      setProfileImage(publicUrl);
      setAvatarUrl(publicUrl);

      toast.success("Profile picture updated successfully!");
    } catch (error: any) {
      console.error("Upload process failed - Full error:", error);

      let errorMessage = "Failed to upload image. ";
      if (error?.message) {
        errorMessage += error.message;
      } else {
        errorMessage += "Please try again.";
      }

      toast.error(errorMessage);
    }
  };

  const handleSaveDisplayName = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("No user session");

      const { error } = await supabase
        .from('Profiles')  // Capital P
        .update({
          display_name: displayName,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);

      if (error) throw error;

      setEditMode(false);
      toast.success("Display name updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update display name");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center gap-6 p-6 bg-background/50 rounded-lg">
      {/* Avatar */}
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage 
            src={profileImage || avatarUrl} 
            alt="Profile picture"
            className="object-cover"
          />
          <AvatarFallback className="bg-gray-800 text-white">
            {displayName?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
          <AvatarImage 
            src={profileImage || avatarUrl} 
            alt="Profile picture"
            className="object-cover"
          />
          <AvatarFallback className="bg-gray-800 text-white">
            {displayName?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <label
          htmlFor="profile-upload"
          className="absolute bottom-0 right-0 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-[#d600db] text-white"
        >
          <Upload className="h-3 w-3" />
          <input
            id="profile-upload"
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={handleImageUpload}
          />
        </label>
      </div>

      {/* Display Name */}
      <div className="flex items-center gap-2">
        {editMode ? (
          <>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-48 bg-white text-black rounded px-2 py-1"
            />
            <button
              className="text-sm text-white bg-[#d600db] px-3 py-1 rounded"
              onClick={handleSaveDisplayName}
            >
              Save
            </button>
          </>
        ) : (
          <>
            <span className="text-xl text-white font-semibold">{displayName}</span>
            <img
              src="https://res.cloudinary.com/difdc39kr/image/upload/v1745766476/qrl2jons2p0cnbpfypzv.svg"
              alt="Edit Pen"
              className="h-5 w-5 cursor-pointer"
              onClick={() => setEditMode(true)}
            />
          </>
        )}
      </div>
    </div>
  );
}

