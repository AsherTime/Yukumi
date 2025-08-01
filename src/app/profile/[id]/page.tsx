"use client";
export const runtime = "edge";
import { useState, useEffect, useMemo } from "react";
import { RecentPosts } from "@/components/recent-posts";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useDropzone } from 'react-dropzone';
import { useParams } from "next/navigation";
import useSWR from 'swr';
import PostCardContainer from "@/components/post-card-container";
import fetchPost from "@/utils/fetch-post";
import useSavedPosts from "@/utils/use-saved-posts";
import { AnimatePresence, motion } from "framer-motion";
import handleFollow from "@/utils/handleFollow";
import { awardPoints } from '@/utils/awardPoints';
import { TopNav } from "@/components/top-nav"
import Footer from "@/components/footer"
import AnalyticsCard from "@/components/analytics-card";
import Image from "next/image"
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useLoginGate } from '@/contexts/LoginGateContext';

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  liked_by_user: boolean;
  saved_by_user: boolean;
  image_url: string;
  animetitle_post: string | null;
  post_collections: string | null;
  original_work: boolean;
  reference_link: string | null;
  Profiles?: {
    avatar_url: string;
    username: string;
  };
  tags?: string[];
  views: number;
}

interface UserAnime {
  id: string;
  user_id: string;
  anime_id: string;
  status: string;
  progress: number;
  score: number;
  Anime?: {
    image_url: string;
    title: string;
    id: string;
  }
}

interface Anime {
  id: string
  title: string
  image_url: string
  score: number | null
  status: string
  tags?: string[]
  genres?: string[]
}



const AnimeCard = ({ anime }: { anime: Anime }) => {
  const router = useRouter();
  return (
    <Card onClick={() => { router.push(`/anime/${anime.id}`) }} className="bg-[#181828] border-zinc-800 shadow-lg hover:scale-[1.025] hover:shadow-xl transition-transform duration-200 relative flex flex-col overflow-hidden cursor-pointer">

      {/* Image with overlayed title */}
      <div className="relative w-full h-48 rounded-t-lg overflow-hidden">
        <Image
          src={anime.image_url || "/placeholder.svg"}
          alt={anime.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
        />

        {/* Title overlay at bottom */}
        <div className="absolute bottom-0 w-full bg-blue-950/50 text-white text-center py-3 px-4">
          <p className="text-base md:text-lg font-bold truncate">{anime.title}</p>
        </div>

      </div>

    </Card>

  );
};

export default function ProfilePage() {
  const params = useParams();
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [avatarUrl, setAvatarUrl] = useState<string>("/placeholder.svg");
  const [displayName, setDisplayName] = useState<string>("Loading...");
  const [about, setAbout] = useState<string>("");
  const [favourites, setFavourites] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const { user } = useAuth();
  const [recentPosts, setRecentPosts] = useState<Post[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("recentPosts");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const DEFAULT_BANNER = "https://rhspkjpeyewjugifcvil.supabase.co/storage/v1/object/sign/animepagebg/Flux_Dev_a_stunning_illustration_of_Create_an_animethemed_webs_0.jpg?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2EwNWE5MzA2LTNiZGItNDliNC1hZGQ2LTFjMjEzNjhiYzcwMSJ9.eyJ1cmwiOiJhbmltZXBhZ2ViZy9GbHV4X0Rldl9hX3N0dW5uaW5nX2lsbHVzdHJhdGlvbl9vZl9DcmVhdGVfYW5fYW5pbWV0aGVtZWRfd2Vic18wLmpwZyIsImlhdCI6MTc0NzU2NDg0NiwiZXhwIjoxNzc5MTAwODQ2fQ.ow7wQ-1Dunza5HIya7Ky4wjGdYULgrged7V6J-Smag0";
  const [bannerUrl, setBannerUrl] = useState<string>(DEFAULT_BANNER);
  const [editBanner, setEditBanner] = useState<string | null>(null);
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('Posts');
  const [profilePic, setProfilePic] = useState<string | null>(null)
  const [editProfilePic, setEditProfilePic] = useState<string | null>(null);
  const [editProfilePicFile, setEditProfilePicFile] = useState<File | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userAnime, setUserAnime] = useState<UserAnime[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const profileId = userId || user?.id;
  const { requireLogin } = useLoginGate();
  const { setPostsData, fetchPosts } = fetchPost();
  const { saved, savedLoading, toggleSave } = useSavedPosts(user, setPostsData, fetchPosts); // pass fetchPosts here
  const { following, handleFollowToggle } = handleFollow(user);
  const { data: savedPosts } = useSWR(
    () => (saved.length ? ['savedPosts', saved] : null),
    async () => {
      const { data, error } = await supabase
        .from('posts')
        .select("*, Profiles:Profiles(avatar_url, username, id)")
        .in('id', saved);

      if (error) throw error;
      return data;
    }
  );

  const statusButtonColors: Record<
    string,
    { base: string; hover: string }
  > = {
    Watching: { base: "bg-green-500", hover: "hover:bg-green-600" },
    Completed: { base: "bg-purple-500", hover: "hover:bg-purple-600" },
    "On-Hold": { base: "bg-yellow-500", hover: "hover:bg-yellow-600" },
    Dropped: { base: "bg-red-500", hover: "hover:bg-red-600" },
    Planning: { base: "bg-blue-500", hover: "hover:bg-blue-600" },
  };

  const statusBgColors: Record<string, string> = {
    Watching: "bg-green-500",
    Completed: "bg-purple-500",
    "On-Hold": "bg-yellow-500",
    Dropped: "bg-red-500",
    Planning: "bg-blue-500",
  };



  const filteredUserAnime = selectedStatus
    ? userAnime.filter((anime) => anime.status === selectedStatus)
    : userAnime;

  const uniqueSavedPosts = useMemo(() => {
    return Array.isArray(savedPosts)
      ? savedPosts.filter(
        (post, index, self) =>
          post.id && self.findIndex(p => p.id === post.id) === index
      )
      : [];
  }, [savedPosts]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!profileId) return;
        const { data: profile, error: profileError } = await supabase
          .from('Profiles')
          .select('*')
          .eq('id', profileId)
          .maybeSingle();
        if (profileError) {
          setDisplayName("Anonymous");
          setAvatarUrl("/placeholder.svg");
        } else if (profile) {
          setDisplayName(profile.display_name || "Anonymous");
          setUsername(profile.username || null);
          setAvatarUrl(profile.avatar_url || "/placeholder.svg");
          setBannerUrl(profile.banner || DEFAULT_BANNER);
          setAbout(profile.about || "");
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setDisplayName("Anonymous");
        setAvatarUrl("/placeholder.svg");
      } finally {
        setLoading(false);
      }
    };
    fetchUserProfile();
  }, [userId, user, profileId]);

  useEffect(() => {

    const statusOrder: Record<string, number> = {
      Watching: 0,
      Completed: 1,
      'On-Hold': 2,
      Dropped: 3,
      Planning: 4,
    };

    const fetchUserPosts = async () => {

      const id = userId || user?.id;
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("posts")
        .select("*, Profiles(username, avatar_url, id)")
        .eq("user_id", id)
        .order("created_at", { ascending: false });
      if (error) {
        setPosts([]);
      } else {
        setPosts(data || []);
      }
      setLoading(false);

    };

    const fetchUserAnime = async () => {

      const id = userId || user?.id;
      if (!id) return;

      setLoading(true);
      const { data, error } = await supabase
        .from("UserAnime")
        .select("*, Anime(image_url, title, id)")
        .eq("user_id", id);

      if (error) {
        setUserAnime([]);
      } else {
        setUserAnime(data.sort(
          (a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5)) || []);
      }
      setLoading(false);

    }

    fetchUserPosts();
    fetchUserAnime();
  }, [userId, user]);

  useEffect(() => {
    const fetchFollowedIds = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from("follows")
        .select("followed_id")
        .eq("follower_id", user.id);
      if (!error && data) {
        setFollowedIds(data.map((row) => row.followed_id));
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
      setFollowersCount(followersCount || 0);
      setFollowingCount(followingCount || 0);
    };
    const profileId = userId || user?.id;
    if (profileId) fetchFollowCounts(profileId);
  }, [userId, user?.id]);

  useEffect(() => {
    const fetchFavourites = async () => {
      if (!userId) return;

      // Step 1: Get the favourites array
      const { data, error } = await supabase
        .from('Profiles')
        .select('favourites')
        .eq('id', userId)
        .maybeSingle(); // Assuming one row per user

      if (error) {
        console.error("Error fetching favourites:", error);
        return;
      }

      const favouriteIds = data?.favourites as string[]; // array of anime IDs

      if (!favouriteIds || favouriteIds.length === 0) return;

      // Step 2: Fetch all matching animes in one query
      const { data: animeData, error: animeError } = await supabase
        .from('Anime')
        .select('*')
        .in('id', favouriteIds);

      if (animeError) {
        console.error("Error fetching anime data:", animeError);
      } else {
        setFavourites(animeData ?? []);
      }
    };

    fetchFavourites();
  }, [userId]);

  const toggleLike = async (postId: string, liked: boolean, userId: string) => {
    try {
      if (liked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', userId);

        if (error) throw error;

        // Update post likes count
        await supabase.rpc('decrement_likes', { post_id: postId });
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: userId }]);

        if (error) throw error;

        // Update post likes count
        await supabase.rpc('increment_likes', { post_id: postId });
      }

      // Update the UI immediately
      setPostsData(prevPosts =>
        prevPosts.map(post =>
          post.id === postId
            ? {
              ...post,
              liked_by_user: !liked,
              likes_count: liked ? post.likes_count - 1 : post.likes_count + 1
            }
            : post
        )
      );

      // Award points for liking
      try {
        await awardPoints(
          userId,
          'post_liked',
          5,
          postId,
          'post'
        );
      } catch (pointsError) {
        console.error('Failed to award points for like:', pointsError);
      }


    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  };

  const handleLikeClick = async (e: React.MouseEvent, postId: string, liked: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (user) {
      await toggleLike(postId, liked, user.id);
    } else {
      console.log("No user found, cannot like");
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


  const onDropProfilePic = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
      setEditProfilePicFile(acceptedFiles[0]);
      setEditProfilePic(URL.createObjectURL(acceptedFiles[0]));
    }
  };

  const {
    getRootProps: getProfilePicRootProps,
    getInputProps: getProfilePicInputProps,
    isDragActive: isProfilePicDragActive
  } = useDropzone({
    onDrop: onDropProfilePic,
    accept: { 'image/*': [] }
  });

  const handleBannerUpload = async () => {
    if (!editBannerFile) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const file = editBannerFile;
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.user.id}-banner-${Date.now()}.${fileExt}`;
    const filePath = `${session.user.id}/${fileName}`;
    const { error: uploadError } = await supabase.storage
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

  const handleImageUpload = async () => {
    if (!editProfilePicFile) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return;

    const file = editProfilePicFile;
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

    setProfilePic(publicUrl);
    return publicUrl;
  }

  const handleSaveProfile = async () => {
    let newBannerUrl = bannerUrl;
    if (editBannerFile) {
      const uploaded = await handleBannerUpload();
      if (uploaded) newBannerUrl = uploaded;
    }
    let newProfilePic = profilePic;
    if (editProfilePicFile) {
      const uploaded = await handleImageUpload();
      if (uploaded) newProfilePic = uploaded;
    }
    // Save display name, banner, and about
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { error } = await supabase
      .from('Profiles')
      .update({
        display_name: displayName,
        avatar_url: newProfilePic,
        banner: newBannerUrl,
        about: about,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);
    if (!error) {
      setShowEditModal(false);
      setProfilePic(newProfilePic);
      setEditProfilePicFile(null);
      setEditProfilePic(null);
      setBannerUrl(newBannerUrl);
      setEditBannerFile(null);
      setEditBanner(null);
      toast.success("Profile updated!");
    } else {
      toast.error("Failed to update profile");
    }
  };

  const [enrichedPosts, setEnrichedPosts] = useState<Post[]>([]);
  const [enrichedSavedPosts, setEnrichedSavedPosts] = useState<Post[]>([]);

  useEffect(() => {
    const fetchEnriched = async () => {

      const postIds = posts.map(p => p.id);
      const savedPostIds = uniqueSavedPosts.map(p => p.id);
      const allPostIds = [...new Set([...postIds, ...savedPostIds])];

      let likedPostIds = new Set();
      let likedSavedPostIds = new Set();

      if (user) {
        const { data: userLikesPosts, error: error1 } = await supabase
          .from("likes")
          .select("post_id")
          .in("post_id", postIds)
          .eq("user_id", user.id);

        const { data: userLikesSaved, error: error2 } = await supabase
          .from("likes")
          .select("post_id")
          .in("post_id", savedPostIds)
          .eq("user_id", user.id);

        if (error1 || error2) {
          console.error("Error fetching likes", error1 || error2);
          return;
        }
        likedPostIds = new Set(userLikesPosts?.map(like => like.post_id) ?? []);
        likedSavedPostIds = new Set(userLikesSaved?.map(like => like.post_id) ?? []);
      }

      const { data: latestPosts } = await supabase
        .from("posts")
        .select("id, likes_count")
        .in("id", allPostIds);


      const postLikesMap = new Map(latestPosts?.map(p => [p.id, p.likes_count]));


      const enrichedP = posts.map(post => ({
        ...post,
        liked_by_user: likedPostIds.has(post.id),
        likes_count: postLikesMap.get(post.id) ?? post.likes_count ?? 0
      }));

      const enrichedSavedP = uniqueSavedPosts.map(post => ({
        ...post,
        liked_by_user: likedSavedPostIds.has(post.id),
        likes_count: postLikesMap.get(post.id) ?? post.likes_count ?? 0
      }));

      setEnrichedPosts(enrichedP);
      setEnrichedSavedPosts(enrichedSavedP);
    };

    fetchEnriched();
  }, [posts, uniqueSavedPosts, user]);

  useEffect(() => {
    console.log("Enriched Posts: ", enrichedPosts);
  }, [enrichedPosts]);



  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <>
      <div className="relative z-10 max-w-7xl mx-auto px-8 pt-20">
        <TopNav />
        <div className="w-full">
          {/* Banner */}
          <div
            className="w-full h-60 sm:h-72 bg-cover bg-center relative"
            style={{ backgroundImage: `url('${bannerUrl}')` }}
          >
            {/* Avatar */}
            <div className="absolute left-4 sm:left-16 -bottom-16 sm:-bottom-20">
              <Image
                src={avatarUrl}
                width={160}
                height={192}
                className="w-28 h-36 sm:w-40 sm:h-48 object-cover rounded-2xl border-4 border-black shadow-lg"
                alt="Profile"
              />
            </div>
          </div>


          {/* Profile Info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-8 pt-8 sm:pl-64 px-4">
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <h1 className="text-2xl sm:text-4xl mt-8 sm:mt-0 font-bold text-white">{displayName}</h1>

                {/* Follow button for other users */}
                {userId && userId !== user?.id && (
                  <button
                    className={`px-4 sm:px-6 py-2 rounded font-semibold text-sm sm:text-base ${followedIds.includes(userId)
                      ? 'bg-zinc-700 text-zinc-300 cursor-default'
                      : 'bg-pink-500 hover:bg-pink-600 text-white'
                      }`}
                    disabled={followedIds.includes(userId)}
                    onClick={async () => {
                      const allowed = requireLogin();
                      if (!allowed) return;
                      const { error } = await supabase
                        .from('follows')
                        .insert({ follower_id: user?.id, followed_id: userId });
                      if (!error) {
                        setFollowedIds([...followedIds, userId]);
                        toast.success('Now following!');
                      }
                    }}
                  >
                    {followedIds.includes(userId) ? 'Following' : 'Follow'}
                  </button>
                )}

                {/* Edit button for self */}
                {userId === user?.id && (
                  <button
                    className="bg-zinc-800 text-white px-4 py-2 rounded text-sm sm:text-base"
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
                  <span className="text-base sm:text-lg font-bold">{followingCount}</span>
                  <span className="text-xs text-gray-400">Following</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-base sm:text-lg font-bold">{followersCount}</span>
                  <span className="text-xs text-gray-400">Followers</span>
                </div>
              </div>
            </div>
          </div>


          {/* Tabs */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2 mt-8 px-4 sm:pl-48 overflow-x-auto">
            {['Posts', 'Anime List', 'Favourites', ...(userId === user?.id ? ['Saved Posts'] : []), ...(userId === user?.id ? ['Recent Posts'] : []), 'About'].map(tab => (
              <button
                key={tab}
                className={`px-6 py-2 font-medium rounded-t-lg whitespace-nowrap ${tab === activeTab ? 'bg-pink-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>


          {/* Below Tabs: Analytics left, Content right */}
          <div className="flex flex-col md:flex-row gap-4 mt-8 items-start">
            <div className="w-full md:w-[340px] flex-shrink-0">
              <AnalyticsCard userId={userId} />
            </div>
            <div className="flex-1 w-full">
              {activeTab === 'Posts' && (
                <div className="w-full relative rounded-2xl bg-[#1f1f1f] border border-zinc-800 shadow-md max-h-[110vh] overflow-y-auto">
                  <AnimatePresence>
                    {enrichedPosts.length === 0 ? (
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
                      enrichedPosts.map((post, idx) => (
                        <PostCardContainer
                          key={post.id || idx}  // Use post.id if available, fallback to index
                          post={post}
                          idx={idx}
                          total={enrichedPosts.length}
                          onLikeToggle={(e) => handleLikeClick(e, post.id, post.liked_by_user)}
                          following={following}
                          handleFollowToggle={handleFollowToggle}
                          saved={saved}
                          onToggleSave={() => toggleSave(post.id)}
                          onPostOpen={(post: Post) => {
                            setRecentPosts(prev => {
                              const filtered = prev.filter(p => p.id !== post.id);
                              const updated = [post, ...filtered].slice(0, 10);
                              localStorage.setItem("recentPosts", JSON.stringify(updated));
                              return updated;
                            });
                          }}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              )}
              {/* Anime List */}
              {activeTab === 'Anime List' && (
                <div className="bg-white/5 rounded-lg overflow-hidden">
                  {/* Filter Buttons */}
                  <div className="flex gap-2 p-4">
                    <button
                      onClick={() => setSelectedStatus('')}
                      className={`px-4 py-2 rounded-lg border font-medium ${selectedStatus === '' ? 'text-white border-white bg-white/10' : 'text-gray-300 border-transparent hover:text-white'} `}
                    >
                      All
                    </button>
                    <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-4 overflow-x-auto pb-2">
                      {['Watching', 'Completed', 'On-Hold', 'Dropped', 'Planning'].map((status) => {
                        const isActive = selectedStatus === status;
                        const color = statusButtonColors[status];

                        return (
                          <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`
          px-4 py-2 rounded-lg text-sm sm:text-base text-white font-medium transition-colors duration-200
          whitespace-nowrap
          ${isActive ? color.base : `bg-white/5 ${color.hover}`}
        `}
                          >
                            {status}
                          </button>
                        );
                      })}
                    </div>


                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-white/10">
                        <tr>
                          <th></th>
                          <th className=" py-3 px-4 text-left">#</th>
                          <th className="py-3 px-4 text-left">Anime Title</th>
                          <th className="py-3 px-4 text-right">Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredUserAnime.map((anime, index) => (
                          <tr key={anime.Anime?.id} className="hover:bg-white/5">
                            {/* Status Color Band */}
                            <td className="w-1 p-0">
                              <div
                                className={`w-1 h-full min-h-[64px] ${statusBgColors[anime.status] || 'bg-gray-500'}`}
                              />
                            </td>

                            {/* Index */}
                            <td className="py-3 px-4">{index + 1}</td>

                            {/* Title & Image */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <Image
                                  src={anime.Anime?.image_url.trimEnd() || "/placeholder.svg"}
                                  alt={anime.Anime?.title || `Anime ${anime.Anime?.id}`}
                                  width={40}
                                  height={60}
                                  className="rounded"
                                />
                                <span>{anime.Anime?.title}</span>
                              </div>
                            </td>

                            {/* Score */}
                            <td className="py-3 px-4 text-right">{anime.score || "-"}</td>
                          </tr>

                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'Favourites' && (
                <>
                  {favourites.length === 0 ? (
                    <motion.div
                      key="no-posts"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="text-center text-zinc-400 py-12"
                    >
                      This user has no favourites.
                    </motion.div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {favourites.map((fav) => (
                        <AnimeCard anime={fav} key={fav.id} />
                      ))}
                    </div>
                  )}

                </>
              )}
              {/* Saved Posts */}
              {activeTab === 'Saved Posts' && (
                <div className="w-full relative rounded-2xl bg-[#1f1f1f] border border-zinc-800 shadow-md max-h-[110vh] overflow-y-auto">
                  <AnimatePresence>
                    {savedLoading ? (
                      <motion.div
                        key="loading-saved"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center text-zinc-400 py-12"
                      >
                        Loading saved posts...
                      </motion.div>
                    ) : enrichedSavedPosts.length === 0 ? (
                      <motion.div
                        key="no-saved"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center text-zinc-400 py-12"
                      >
                        No saved posts yet.
                      </motion.div>
                    ) : (
                      enrichedSavedPosts.map((post, idx) => (

                        <PostCardContainer
                          key={post.id || idx}
                          post={post}
                          idx={idx}
                          total={enrichedSavedPosts.length}
                          onLikeToggle={(e) => handleLikeClick(e, post.id, post.liked_by_user)}
                          following={following}
                          handleFollowToggle={handleFollowToggle}
                          saved={saved}
                          onToggleSave={() => toggleSave(post.id)}
                          onPostOpen={(post: Post) => {
                            setRecentPosts(prev => {
                              const filtered = prev.filter(p => p.id !== post.id);
                              const updated = [post, ...filtered].slice(0, 10);
                              localStorage.setItem("recentPosts", JSON.stringify(updated));
                              return updated;
                            });
                          }}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </div>
              )}
              {activeTab === 'Recent Posts' && (
                <RecentPosts recentPosts={recentPosts} />
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
                <label className="block text-zinc-300 mb-2">Profile Picture</label>

                <div
                  {...getProfilePicRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 mb-4 text-center cursor-pointer ${isProfilePicDragActive ? 'border-pink-500 bg-pink-50' : 'border-zinc-700 bg-zinc-800'
                    }`}
                >
                  <input {...getProfilePicInputProps()} />
                  {editProfilePic ? (
                    <Image
                      src={editProfilePic}
                      alt="Profile preview"
                      className="w-24 h-24 object-cover rounded-full mx-auto mb-2"
                      width={96}
                      height={96}
                    />
                  ) : (
                    <span className="text-zinc-400">Drag & drop a profile picture, or click to select</span>
                  )}
                </div>




                <label className="block text-zinc-300 mb-2">Banner Image</label>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-4 mb-4 text-center cursor-pointer ${isDragActive ? 'border-pink-500 bg-pink-50' : 'border-zinc-700 bg-zinc-800'}`}>
                  <input {...getInputProps()} />
                  {editBanner ? (
                    <Image src={editBanner} alt="Banner preview" className="w-full h-32 object-cover rounded mb-2" width={800} height={128} />
                  ) : (
                    <span className="text-zinc-400">Drag & drop a banner image here, or click to select</span>
                  )}
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-zinc-400 text-xs">Max 5MB. PNG, JPG, WEBP, GIF.</span>
                </div>
                <button className="w-full bg-pink-500 hover:bg-pink-600 text-white py-2 rounded font-semibold" onClick={handleSaveProfile}>Save</button>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

