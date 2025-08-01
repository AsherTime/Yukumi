import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserCircle, Heart, MessageCircle, Eye } from 'lucide-react';
import { FiMoreHorizontal, FiBookmark } from 'react-icons/fi';
import { FaBookmark } from 'react-icons/fa';
import { FollowButton } from "@/components/FollowButton";
import PostShareMenu from '@/components/post-share-menu';
import useViewCountOnVisible from '@/hooks/use-view-count';
import { useLoginGate } from '@/contexts/LoginGateContext';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
  user_id: string;
  likes_count: number;
  comments_count: number;
  liked_by_user: boolean;
  saved_by_user: boolean; // Added to track if the post is saved by the user
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

export default function PostCard({ post, idx, total, formatDate, navigatetoCommunity, setMenuOpenId, menuOpenId, setShowConfirmId, showConfirmId, reportConfirmId, setReportConfirmId, handleDelete, handleLikeClick, handleCommentClick, handleReport, saved, handleSave, isFollowing, handleFollowClick, onPostOpen }: {
  post: Post,
  idx: number,
  total: number,
  formatDate: (dateString: string) => string,
  navigatetoCommunity: (communityId: string | null) => void,
  setMenuOpenId: React.Dispatch<React.SetStateAction<string | null>>,
  menuOpenId: string | null,
  setShowConfirmId: React.Dispatch<React.SetStateAction<string | null>>,
  showConfirmId: string | null,
  reportConfirmId: string | null,
  setReportConfirmId: React.Dispatch<React.SetStateAction<string | null>>,
  handleDelete: (postId: string) => void,
  handleLikeClick: (e: React.MouseEvent, postId: string, liked: boolean) => void,
  handleCommentClick: (postId: string) => void,
  handleReport: (postId: string) => void,
  saved: string[],
  handleSave: (postId: string) => void,
  isFollowing: boolean,
  handleFollowClick: (followedUserId: string) => Promise<void>
  onPostOpen?: (post: Post) => void
}) {
  const viewRef = useViewCountOnVisible(post.id);
  const isSaved = saved.includes(post.id);
  const { requireLogin } = useLoginGate();
  const { user } = useAuth();
  return (
    <div
      onClick={() => {
        if (onPostOpen) onPostOpen(post);
        handleCommentClick(post.id);
      }}
      className="cursor-pointer"
    >
      <motion.section
        ref={viewRef}
        key={post.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, delay: idx * 0.04 }}
        className={
          idx !== total - 1
            ? "border-b border-zinc-800"
            : ""
        }
      >
        {/* Top Row: Avatar, Username, Timestamp, Follow, More */}
        <div className="relative">
          <div className="flex items-center justify-between px-6 pt-5 pb-2">
            <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-3">
              <Link href={`/profile/${post.user_id}`} className="flex items-center gap-3 group" prefetch={false}>
                {post.Profiles?.avatar_url ? (
                  <Image
                    src={post.Profiles.avatar_url}
                    alt={post.Profiles.username || "User"}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full object-cover border border-zinc-700 group-hover:ring-2 group-hover:ring-blue-500 transition"
                  />
                ) : (
                  <UserCircle className="w-10 h-10 text-zinc-500 group-hover:text-blue-400 transition" />
                )}
                <div>
                  <div className="text-white font-semibold text-base leading-tight group-hover:underline group-hover:text-blue-400 transition">{post.Profiles?.username || "Anonymous"}</div>
                  <div className="text-xs text-zinc-400">{formatDate(post.created_at)}</div>
                </div>
              </Link>
            </div>
            <div onClick={(e) => e.stopPropagation()} className="absolute top-3 right-3 flex items-center gap-2">
              <FollowButton
                followedId={post.user_id}
                isFollowing={isFollowing}
                onToggle={() => handleFollowClick(post.user_id)}
                className="hidden md:block rounded-full px-4 py-1 bg-blue-900 text-blue-400 font-semibold shadow hover:bg-blue-800 transition text-xs"
              />
              <button
                onClick={() => {
                  const allowed = requireLogin();
                  if (!allowed) return;
                  handleSave(post.id)
                }}
                aria-label={isSaved ? 'Unsave' : 'Save'}
                className="text-blue-400 hover:text-blue-300"
              >
                {isSaved ? <FaBookmark size={20} /> : <FiBookmark size={20} />}
              </button>
              <div className="relative inline-block text-left">
                <button
                  className="bg-black/30 p-2 rounded-full text-white hover:text-gray-300"
                  onClick={() =>
                    setMenuOpenId((prev) => (prev === post.id ? null : post.id))
                  }
                >
                  <FiMoreHorizontal size={20} />
                </button>
                {menuOpenId === post.id && (
                  <div className="absolute right-0 mt-2 w-28 bg-white rounded shadow z-10">
                    {user?.id === post.user_id ? (
                      <button
                        className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"
                        onClick={() => {
                          setShowConfirmId(post.id); // this will trigger the popup
                          setMenuOpenId(null);
                        }}
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        className="block w-full px-4 py-2 text-left text-yellow-600 hover:bg-gray-100"
                        onClick={() => {
                          const allowed = requireLogin();
                          if (!allowed) return;
                          setReportConfirmId(post.id);
                          setMenuOpenId(null);
                        }}
                      >
                        Report
                      </button>
                    )}
                  </div>
                )}
                {showConfirmId === post.id && (
                  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-20">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                      <p className="mb-4 text-black text-lg font-semibold">
                        Are you sure you want to delete this post? This action cannot be undone.
                      </p>
                      <div className="flex justify-center gap-4">
                        <button
                          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                          onClick={() => {
                            handleDelete(post.id);
                            setShowConfirmId(null);
                          }}
                        >
                          Yes
                        </button>
                        <button
                          className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                          onClick={() => setShowConfirmId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Title */}
        <h3 className="text-2xl font-bold text-white px-6 pb-2">{post.title}</h3>
        {post.animetitle_post && (
          <span onClick={(e) => {
            e.stopPropagation();
            navigatetoCommunity(post.animetitle_post);
          }} className="px-2 py-1 ml-5 mb-2 inline-block rounded-full text-xs font-semibold text-purple-400 bg-purple-500/10">
            {post.animetitle_post}
          </span>
        )}
        {/* Image */}
        {post.image_url && (
          <div onClick={(e) => e.stopPropagation()} className="relative mb-4 px-6 overflow-hidden rounded-xl">
            {/* Blurred background */}
            <div
              className="absolute inset-0 blur-2xl scale-110 opacity-30"
              style={{
                backgroundImage: `url(${post.image_url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(20px)',
                zIndex: 0,
              }}
            />

            {/* Foreground image */}
            <a
              href={post.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-5 block"
            >
              <Image
                src={post.image_url}
                alt={post.title}
                width={1200}
                height={800}
                className="max-w-full max-h-[32rem] mx-auto rounded object-contain"
                loading="lazy"
              />
            </a>
          </div>
        )}

        {/* Reference Link 
        { /* Content */}
        {!post.image_url && <p className="text-gray-300 px-6 pb-2" dangerouslySetInnerHTML={{ __html: post.content }}></p>}
        {/* Tags }
        <div className="flex flex-wrap gap-2 px-6 pb-2 mt-1">
          {post.post_collections && (
            <span className="px-2 py-1 rounded-full text-xs font-semibold text-blue-400 bg-blue-500/10">
              {post.post_collections}
            </span>
          )}
          
        </div>
        {/* User Tags }
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 px-6 pb-2">
            {post.tags.map((tag: string) => (
              <span key={tag} className="px-2 py-1 rounded-full text-xs font-semibold text-gray-300 bg-[#232232]">
                #{tag}
              </span>
            ))}
          </div>
        )}

        */}


        {/* Bottom Row: Like, Comment, View */}
        <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-start gap-6 px-6 py-3">
          <button
            onClick={(e) => {
              const allowed = requireLogin();
              if (!allowed) return;
              handleLikeClick(e, post.id, post.liked_by_user)
            }}
            className={`flex items-center gap-1 text-white hover:text-pink-500 transition-colors group ${post.liked_by_user ? 'font-bold text-pink-500' : ''}`}
          >
            <Heart className="w-5 h-5 mr-1 group-hover:scale-110 transition-transform" fill={post.liked_by_user ? '#ec4899' : 'none'} />
            <span>{post.likes_count || 0}</span>
          </button>
          <button
            onClick={() => handleCommentClick(post.id)}
            className="flex items-center gap-1 text-white hover:text-purple-400 transition-colors group"
          >
            <MessageCircle className="w-5 h-5 mr-1 group-hover:scale-110 transition-transform" />
            {post.comments_count}
          </button>
          <span className="flex items-center gap-1 text-white cursor-default">
            <Eye className="w-5 h-5 mr-1" />
            {post.views}
          </span>
          <PostShareMenu path={`/post/${post.id}`} title={post.title} />
        </div>
      </motion.section>
      {reportConfirmId && (
        <div onClick={(e) => e.stopPropagation()} className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-20">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="mb-4 text-black text-lg font-semibold">
              Are you sure you want to report this post?
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                onClick={() => {
                  handleReport(reportConfirmId);
                  setReportConfirmId(null);
                }}
              >
                Yes
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                onClick={() => setReportConfirmId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
