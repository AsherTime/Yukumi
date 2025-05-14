"use client";

import { Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { FollowButton } from "@/components/ui/FollowButton";


export function UserProfile({ userId, readOnly = false }: { userId?: string, readOnly?: boolean }) {
  const [avatarUrl, setAvatarUrl] = useState<string>("/placeholder.svg");
  const [displayName, setDisplayName] = useState<string>("Loading...");
  const [editMode, setEditMode] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const { user } = useAuth();

  const router = useRouter();
  let profileId = userId || user?.id;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        profileId = userId || user?.id;
        if (!profileId) return;
        const { data: profile, error: profileError } = await supabase
          .from('Profiles')
          .select('*')
          .eq('id', profileId)
          .single();
        if (profileError) {
          setDisplayName("Anonymous");
          setAvatarUrl("/placeholder.svg");
        } else if (profile) {
          setDisplayName(profile.display_name || "Anonymous");
          setAvatarUrl(profile.avatar_url || "/placeholder.svg");
          setProfileImage(profile.avatar_url || null);
        }
      } catch (error) {
        setDisplayName("Anonymous");
        setAvatarUrl("/placeholder.svg");
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [userId, user?.id]);

   useEffect(() => {
      const fetchFollowedIds = async () => {
        if (!user?.id) return;
        const { data, error } = await supabase
          .from("follows")
          .select("followed_id")
          .eq("follower_id", user.id);
        if (!error && data) {
          setFollowedIds(data.map((row: any) => row.followed_id));
        }
      };
      if (user) fetchFollowedIds();
    }, [user]);
 
  useEffect(() => {
    // Fetch follower/following counts
    const fetchFollowCounts = async (profileId: string) => {
      const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("followed_id", profileId),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", profileId),
      ]);
      setFollowers(followersCount || 0);
      setFollowing(followingCount || 0);
    };
    const profileId = userId || user?.id;
    if (profileId) fetchFollowCounts(profileId);
  }, [userId, user?.id]);

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

      console.log("User session:", {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      });

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      console.log("Starting upload process...");
      console.log("File path:", filePath);
      console.log("File type:", file.type);
      console.log("File size:", file.size);

      // Upload new avatar
      console.log("Uploading new file...");
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (uploadError) {
        console.error("Upload error details:", {
          message: uploadError.message,
          name: uploadError.name,
          stack: uploadError.stack
        });
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
    <div className="flex flex-col items-center gap-4">
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
        </Avatar>

        <label
          htmlFor="profile-upload"
          className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#d600db] text-white hover:bg-[#b300b3] transition-colors"
        >
          <Upload className="h-4 w-4" />
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
        {profileId !== user?.id && (
  <FollowButton 
    followedId={profileId||""} 
    className="rounded-full px-4 py-1 bg-blue-900 text-blue-400 font-semibold shadow hover:bg-blue-800 transition text-xs" 
  />
)}
      <div className="flex gap-8 mt-2">
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold">{following}</span>
          <span className="text-xs text-gray-400">Following</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold">{followers}</span>
          <span className="text-xs text-gray-400">Followers</span>
        </div>
      </div>
    </div>
  );
}

