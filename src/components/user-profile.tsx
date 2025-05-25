"use client";

import { Upload } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { FollowButton } from "@/components/ui/FollowButton";
import { useDropzone } from 'react-dropzone';
import { UserPosts } from "./user-posts";
import { ContentFeed } from "./content-feed";
import { FiMoreHorizontal, FiHeart, FiMessageCircle } from "react-icons/fi";
import { FaHeart } from "react-icons/fa";
import { set } from "react-hook-form";
import useSWR from 'swr';
import PostCardContainer from "@/components/post-card-container";
import fetchPost from "@/utils/fetch-post";
import handleLike from "@/utils/handleLike";
import useSavedPosts from "@/utils/use-saved-posts";
import { AnimatePresence, motion } from "framer-motion";


const DEFAULT_BANNER = "https://rhspkjpeyewjugifcvil.supabase.co/storage/v1/object/sign/animepagebg/Flux_Dev_a_stunning_illustration_of_Create_an_animethemed_webs_0.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2EwNWE5MzA2LTNiZGItNDliNC1hZGQ2LTFjMjEzNjhiYzcwMSJ9.eyJ1cmwiOiJhbmltZXBhZ2ViZy9GbHV4X0Rldl9hX3N0dW5uaW5nX2lsbHVzdHJhdGlvbl9vZl9DcmVhdGVfYW5fYW5pbWV0aGVtZWRfd2Vic18wLmpwZyIsImlhdCI6MTc0NzU2NDg0NiwiZXhwIjoxNzc5MTAwODQ2fQ.ow7wQ-1Dunza5HIya7Ky4wjGdYULgrged7V6J-Smag0";

function AnalyticsCard() {
  return (
    <div className="bg-zinc-900 rounded-2xl p-6 shadow-md text-white w-full">
      <h3 className="text-lg font-semibold mb-4">Weekly Analytics</h3>
      <div className="mb-4">
        <div className="text-zinc-400 text-sm">Total Views Last Week:</div>
        <div className="text-3xl font-bold text-pink-400">15,340</div>
      </div>
      <div className="mb-2">
        <div className="text-zinc-400 text-sm">Total Likes Last Week:</div>
        <div className="text-xl font-bold">3,210</div>
      </div>
      <div className="mb-2">
        <div className="text-zinc-400 text-sm">Total Comments Last Week:</div>
        <div className="text-xl font-bold">1,450</div>
      </div>
      <div className="mb-4">
        <div className="text-zinc-400 text-sm mb-1">Achievements:</div>
        <ul className="list-disc list-inside text-pink-400">
          <li>Top 10% Most Viewed</li>
          <li>50+ Comments Milestone</li>
        </ul>
      </div>
      <button className="w-full bg-pink-500 hover:bg-pink-600 text-white py-2 rounded font-semibold mt-2">View Analytics</button>
    </div>
  );
}

export function UserProfile({ userId, readOnly = false }: { userId?: string, readOnly?: boolean }) {
  const [avatarUrl, setAvatarUrl] = useState<string>("/placeholder.svg");
  const [displayName, setDisplayName] = useState<string>("Loading...");
  const [about, setAbout] = useState<string>("");
  const [editMode, setEditMode] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const { user } = useAuth();
  const [bannerUrl, setBannerUrl] = useState<string>(DEFAULT_BANNER);
  const [editBanner, setEditBanner] = useState<string | null>(null);
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState('Posts');
  const [username, setUsername] = useState<string | null>(null);

  const router = useRouter();
  let profileId = userId || user?.id;
  const { postsData, setPostsData, fetchPosts } = fetchPost();
  const { saved, savedLoading, toggleSave } = useSavedPosts(user, setPostsData, fetchPosts); // pass fetchPosts here
  const { handleLikeClick } = handleLike(user, setPostsData, fetchPosts);
  const { data: savedPosts, error } = useSWR(
  () => (saved.length ? ['savedPosts', saved] : null),
  async () => {
    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        Profiles (
          avatar_url,
          display_name
        )
      `)
      .in('id', saved);

    if (error) throw error; // Optional: handle error as you want

    return data;
  }
);



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
          setUsername(profile.username || null);
          setAvatarUrl(profile.avatar_url || "/placeholder.svg");
          setProfileImage(profile.avatar_url || null);
          setBannerUrl(profile.banner || DEFAULT_BANNER);
          setAbout(profile.about || "");
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

  // Dropzone for banner
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      setEditBannerFile(acceptedFiles[0]);
      setEditBanner(URL.createObjectURL(acceptedFiles[0]));
    }
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] } });

  const handleBannerUpload = async () => {
    if (!editBannerFile) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const file = editBannerFile;
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}-banner-${Date.now()}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { cacheControl: '3600', upsert: true, contentType: file.type });
    if (uploadError) {
      toast.error("Failed to upload banner");
      return;
    }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    if (!urlData.publicUrl) {
      toast.error("Failed to get banner URL");
      return;
    }
    setBannerUrl(urlData.publicUrl);
    return urlData.publicUrl;
  };

  const handleSaveProfile = async () => {
    let newBannerUrl = bannerUrl;
    if (editBannerFile) {
      const uploaded = await handleBannerUpload();
      if (uploaded) newBannerUrl = uploaded;
    }
    // Save display name, banner, and about
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { error } = await supabase
      .from('Profiles')
      .update({
        display_name: displayName,
        banner: newBannerUrl,
        about: about,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);
    if (!error) {
      setShowEditModal(false);
      setBannerUrl(newBannerUrl);
      setEditBannerFile(null);
      setEditBanner(null);
      toast.success("Profile updated!");
    } else {
      toast.error("Failed to update profile");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full">
      {/* Banner */}
      <div className="w-full h-72 bg-cover bg-center relative" style={{ backgroundImage: `url('${bannerUrl}')` }}>
        {/* Avatar */}
        <div className="absolute left-16 -bottom-20">
          <img
            src={profileImage || avatarUrl}
            className="w-40 h-48 object-cover rounded-2xl border-4 border-black shadow-lg"
            alt="Profile"
          />
        </div>
      </div>

      {/* Profile Info */}
      <div className="flex items-end gap-8 pl-64 pt-8">
        <div>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-bold text-white">{displayName}</h1>
            {/* Only show Follow button if viewing another user's profile */}
            {userId && userId !== user?.id && (
              <button
                className={`px-6 py-2 rounded font-semibold ${followedIds.includes(userId) ? 'bg-zinc-700 text-zinc-300 cursor-default' : 'bg-pink-500 hover:bg-pink-600 text-white'}`}
                disabled={followedIds.includes(userId)}
                onClick={async () => {
                  if (!user) return;
                  const { error } = await supabase.from('follows').insert({ follower_id: user.id, followed_id: userId });
                  if (!error) {
                    setFollowedIds([...followedIds, userId]);
                    toast.success('Now following!');
                  }
                }}
              >
                {followedIds.includes(userId) ? 'Following' : 'Follow'}
              </button>
            )}
            {!userId && (
              <button
                className="ml-4 bg-zinc-800 text-white px-4 py-2 rounded"
                onClick={() => setShowEditModal(true)}
              >
                Edit details
              </button>
            )}

          </div>
          {username && (
            <p className="text-gray-400 text-sm mt-1">@{username}</p>
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
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mt-8 pl-48">
        {['Posts', ...(!userId ? ['Saved'] : []), 'About'].map(tab => (
          <button
            key={tab}
            className={`px-6 py-2 font-medium rounded-t-lg ${tab === activeTab ? 'bg-pink-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Below Tabs: Analytics left, Content right */}
      <div className="flex md:flex-row gap-4 mt-8 items-start">
        <div className="w-[340px] flex-shrink-0">
          <AnalyticsCard />
        </div>
        <div className="flex-1">
          {activeTab === 'Posts' && (
            <ProfilePosts userId={userId} />
          )}
          {activeTab === 'Saved' && !userId && (
            <div>
              <h2 className="text-xl font-bold mb-4">Saved Posts</h2>
              {savedLoading ? (
                <p>Loading saved posts...</p>
              ) : saved.length === 0 ? (
                <p className="text-gray-400">No saved posts yet.</p>
              ) : (
                savedPosts?.map((post, idx) => (
                  <PostCardContainer
                    key={post.id || idx}
                    post={post}
                    idx={idx}
                    total={savedPosts.length}
                    onLikeToggle={handleLikeClick}
                    saved={saved}
                    onToggleSave={() => toggleSave(post.id)}
                  />
                ))
              )}
            </div>
          )}
          {activeTab === 'About' && (
            <div className="relative rounded-2xl bg-[#1f1f1f] border border-zinc-800 shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">About</h2>
              <p className="text-zinc-300 whitespace-pre-wrap">{about || "No about information provided."}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-zinc-900 rounded-2xl p-8 w-full max-w-md shadow-lg relative">
            <button className="absolute top-2 right-2 text-zinc-400 hover:text-white" onClick={() => setShowEditModal(false)}>&times;</button>
            <h2 className="text-xl font-bold text-white mb-4">Edit Profile</h2>
            <label className="block text-zinc-300 mb-2">Display Name</label>
            <Input value={displayName} onChange={e => setDisplayName(e.target.value)} className="mb-4" />
            <label className="block text-zinc-300 mb-2">About</label>
            <textarea
              value={about}
              onChange={e => setAbout(e.target.value)}
              className="w-full bg-zinc-800 text-white rounded-lg p-3 mb-4 min-h-[100px] resize-y"
              placeholder="Tell us about yourself..."
            />
            <label className="block text-zinc-300 mb-2">Banner Image</label>
            <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-4 mb-4 text-center cursor-pointer ${isDragActive ? 'border-pink-500 bg-pink-50' : 'border-zinc-700 bg-zinc-800'}`}>
              <input {...getInputProps()} />
              {editBanner ? (
                <img src={editBanner} alt="Banner preview" className="w-full h-32 object-cover rounded mb-2" />
              ) : (
                <span className="text-zinc-400">Drag & drop a banner image here, or click to select</span>
              )}
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-zinc-400 text-xs">Max 5MB. PNG, JPG, WEBP, GIF.</span>
              <button className="text-pink-500 underline text-xs" onClick={() => bannerInputRef.current?.click()}>Choose file</button>
              <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  setEditBannerFile(e.target.files[0]);
                  setEditBanner(URL.createObjectURL(e.target.files[0]));
                }
              }} />
            </div>
            <button className="w-full bg-pink-500 hover:bg-pink-600 text-white py-2 rounded font-semibold" onClick={handleSaveProfile}>Save</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfilePosts({ userId }: { userId?: string }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const { postsData, setPostsData, fetchPosts } = fetchPost();
  const { saved, savedLoading, toggleSave } = useSavedPosts(user, setPostsData, fetchPosts); // pass fetchPosts here
  const { handleLikeClick } = handleLike(user, setPostsData, fetchPosts);
  const { data: savedPosts, error } = useSWR(
    () => (saved.length ? ['savedPosts', saved] : null),
    async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .in('id', saved);

      if (error) throw error; // Optional: handle error as you want

      return data;
    }
  );

  useEffect(() => {
    const fetchUserPosts = async () => {
      const id = userId || user?.id;
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("*, Profiles(display_name, avatar_url, id)")
        .eq("user_id", id)
        .order("created_at", { ascending: false });
      if (error) {
        setPosts([]);
      } else {
        setPosts(data || []);
      }
      setLoading(false);
    };
    fetchUserPosts();
  }, [userId, user]);

  useEffect(() => {
    // Fetch followed ids for the current user
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

  if (loading) {
    return <div className="w-full text-center text-white py-8">Loading...</div>;
  }
  return (
    <div className="w-full max-w-2xl relative rounded-2xl bg-[#1f1f1f] border border-zinc-800 shadow-md max-h-[90vh] overflow-y-auto">
      <AnimatePresence mode="wait">
        {posts.length === 0 ? (
          <motion.div
            key="no-posts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center text-zinc-400 py-12"
          >
            This user has no posts.
          </motion.div>
        ) : (
          posts.map((post, idx) => (
            <PostCardContainer
              key={post.id || idx}  // Use post.id if available, fallback to index
              post={post}
              idx={idx}
              total={posts.length}
              onLikeToggle={handleLikeClick}
              saved={saved}
              onToggleSave={() => toggleSave(post.id)}
            />
          ))
        )}
      </AnimatePresence>
    </div>
  );
}

