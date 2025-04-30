"use client";

import { Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
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

      // Debug session info
      console.log("Session info:", {
        userId: session.user.id,
        fileInfo: {
          name: file.name,
          size: file.size,
          type: file.type
        }
      });

      // Check if bucket exists and create if it doesn't
      console.log("Checking storage bucket...");
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .getBucket('avatars');

      if (bucketError?.message === 'Bucket not found') {
        console.log("Bucket not found, creating new bucket...");
        const { data: newBucket, error: createError } = await supabase
          .storage
          .createBucket('avatars', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'],
            fileSizeLimit: 5242880 // 5MB in bytes
          });

        if (createError) {
          console.error("Error creating bucket:", {
            message: createError.message,
            name: createError.name,
            error: createError
          });
          throw createError;
        }
        console.log("Bucket created successfully:", newBucket);
      } else if (bucketError) {
        console.error("Bucket error:", {
          message: bucketError.message,
          name: bucketError.name,
          error: bucketError
        });
        throw bucketError;
      }

      console.log("Storage bucket is ready");

      // Upload new avatar
      console.log("Uploading new file...");
      try {
        // Upload file
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type // Explicitly set content type
          });

        if (uploadError) {
          console.error("Upload error details:", {
            message: uploadError.message,
            name: uploadError.name,
            error: uploadError
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
          // Create new profile if it doesn't exist
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
            console.error("Insert error details:", {
              message: insertError.message,
              hint: insertError.hint,
              details: insertError.details,
              code: insertError.code
            });
          }
          profileError = insertError;
        } else {
          console.log("Updating existing profile...");
          // Update existing profile
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
            console.error("Update error details:", {
              message: updateError.message,
              hint: updateError.hint,
              details: updateError.details,
              code: updateError.code
            });
          }
          profileError = updateError;
        }

        if (profileError) {
          console.error("Profile operation error:", profileError);
          throw profileError;
        }

        // Update local state
        setProfileImage(publicUrl);
        setAvatarUrl(publicUrl);
        
        toast.success("Profile picture updated successfully!");
      } catch (error: any) {
        // Detailed error logging
        console.error("Upload process failed - Full error:", {
          error,
          message: error?.message,
          details: error?.details,
          hint: error?.hint,
          code: error?.code,
          statusCode: error?.statusCode,
          name: error?.name,
          stack: error?.stack
        });

        // Check if it's a Supabase error
        if (error?.error_description) {
          console.error("Supabase error:", error.error_description);
        }

        // More specific error message for the user
        let errorMessage = "Failed to upload image. ";
        if (error?.message) {
          errorMessage += error.message;
        } else if (error?.error_description) {
          errorMessage += error.error_description;
        } else {
          errorMessage += "Please try again.";
        }

        toast.error(errorMessage);
      }
    } catch (error: any) {
      // Detailed error logging
      console.error("Upload process failed - Full error:", {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        statusCode: error?.statusCode,
        name: error?.name,
        stack: error?.stack
      });

      // Check if it's a Supabase error
      if (error?.error_description) {
        console.error("Supabase error:", error.error_description);
      }

      // More specific error message for the user
      let errorMessage = "Failed to upload image. ";
      if (error?.message) {
        errorMessage += error.message;
      } else if (error?.error_description) {
        errorMessage += error.error_description;
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