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
        {['Posts', 'Saved', 'About'].map(tab => (
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
      {posts.map((post) => (
        <div
          key={post.id}
          className="relative bg-[#1f1f1f] rounded-none"
        >
          {/* Top Row: Avatar, Username, Date, More */}
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <div className="flex items-center gap-3 group">
              {post.Profiles?.avatar_url ? (
                <img
                  src={post.Profiles.avatar_url}
                  alt={post.Profiles.display_name || "User"}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-700 group-hover:ring-2 group-hover:ring-blue-500 transition"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-700" />
              )}
              <div>
                <div className="text-white font-semibold text-base leading-tight group-hover:underline group-hover:text-blue-400 transition">{post.Profiles?.display_name || "Anonymous"}</div>
                <div className="text-xs text-zinc-400">{new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
              </div>
            </div>
            {/* Only show Follow button if post is not by current user */}
            {post.Profiles?.id && post.Profiles.id !== user?.id && (
              <button
                className={`px-4 py-1 rounded font-semibold ${followedIds.includes(post.Profiles.id) ? 'bg-zinc-700 text-zinc-300 cursor-default' : 'bg-pink-500 hover:bg-pink-600 text-white'}`}
                disabled={followedIds.includes(post.Profiles.id)}
                onClick={async () => {
                  if (!user) return;
                  const { error } = await supabase.from('follows').insert({ follower_id: user.id, followed_id: post.Profiles.id });
                  if (!error) {
                    setFollowedIds([...followedIds, post.Profiles.id]);
                    toast.success('Now following!');
                  }
                }}
              >
                {followedIds.includes(post.Profiles.id) ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
          {/* Title */}
          <h3 className="text-2xl font-bold text-white px-6 pb-2">{post.title}</h3>
          {/* Image */}
          {post.image_url && (
            <div className="relative h-64 mb-4 px-6 overflow-hidden rounded-xl">
              <img
                src={post.image_url}
                alt={post.title}
                className="h-full w-full object-cover mx-auto rounded-xl"
                loading="lazy"
              />
            </div>
          )}
          {/* Content */}
          <p className="text-gray-300 px-6 pb-2" dangerouslySetInnerHTML={{ __html: post.content }}></p>
          {/* Tags */}
          <div className="flex flex-wrap gap-2 px-6 pb-2 mt-1">
            {post.post_collections && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold text-blue-400 bg-blue-500/10">
                {post.post_collections}
              </span>
            )}
            {post.animetitle_post && (
              <span className="px-2 py-1 rounded-full text-xs font-semibold text-purple-400 bg-purple-500/10">
                {post.animetitle_post}
              </span>
            )}
          </div>
          {/* User Tags (if any) */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 px-6 pb-2">
              {post.tags.map((tag: string) => (
                <span key={tag} className="px-2 py-1 rounded-full text-xs font-semibold text-gray-300 bg-[#232232]">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          {/* Bottom Row: Like, Comment, View */}
          <div className="flex items-center gap-6 px-6 pb-4 text-zinc-400">
            <button
              // ... like logic ...
              className={`flex items-center gap-1 text-zinc-400 hover:text-pink-500 transition-colors group ${post.liked_by_user ? 'font-bold text-pink-500' : ''}`}
            >
              {post.liked_by_user ? (
                <FaHeart className="w-5 h-5 mr-1 group-hover:scale-110 transition-transform text-pink-500" />
              ) : (
                <FiHeart className="w-5 h-5 mr-1 group-hover:scale-110 transition-transform" />
              )}
              <span>{post.likes_count || 0}</span>
            </button>
            <button
              // ... comment logic ...
              className="flex items-center gap-1 text-zinc-400 hover:text-purple-400 transition-colors"
            >
              <FiMessageCircle className="w-5 h-5 mr-1" />
              {post.comments_count}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

