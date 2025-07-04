import React from 'react';
import { Card } from './ui/card';
import Link from 'next/link';
import Image from "next/image";

interface MangaType {
  id: string;
  title: string;
  cover_image_url: string;
  synopsis: string;
  Profiles: {
    avatar_url: string;
    username: string;
  }
  tags: string[];
  views: number;
  created_at: string;
  likes_count: number;
  comments_count: number;
  status: string
}

interface FanMangaCardProps {
  manga: MangaType;
  idx: number;
  total: number;
  onLike: (manga: MangaType) => void;
  onComment: (manga: MangaType) => void;
  onShare: (manga: MangaType) => void;
}

export default function FanMangaCard({ manga, idx, total, onLike, onComment, onShare }: FanMangaCardProps) {
  return (
    <Card className={`bg-gradient-to-br from-[#232232] to-[#1a1a2e] border-0 p-4 relative ${idx !== total - 1 ? 'mb-4' : ''}`}>
      <div className="flex items-center gap-3 mb-2">
        <Image
          src={manga.Profiles?.avatar_url || "/placeholder.svg"}
          alt={manga.Profiles?.username || "User"}
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover border border-zinc-700"
        />
        <span className="text-white font-semibold text-base">{manga.Profiles?.username || "Anonymous"}</span>
        <span className="ml-auto px-2 py-1 rounded-full text-xs font-bold text-pink-400 bg-pink-500/10">FAN MANGA</span>
      </div>
      <h3 className="text-lg font-semibold text-white mb-1">{manga.title}</h3>
      {manga.cover_image_url && (
        <div className="relative w-full h-64 mb-4">
          <Image
            src={manga.cover_image_url}
            alt={manga.title}
            fill
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      )}
      <p className="text-gray-300 mb-2 line-clamp-3">{manga.synopsis}</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {Array.isArray(manga.tags) && manga.tags.map((tag: string) => (
          <span key={tag} className="px-2 py-1 rounded-full text-xs font-semibold text-gray-300 bg-[#232232]">
            #{tag}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-2 text-zinc-400 text-xs">
        <span>{manga.views} views</span>
        <span>{new Date(manga.created_at).toLocaleDateString()}</span>
        <span>Status: {manga.status}</span>
      </div>
      <div className="flex items-center gap-6 mt-4 text-gray-400">
        <button onClick={() => onLike(manga)} className="flex items-center gap-1 hover:text-pink-500">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21C12 21 4 13.5 4 8.5C4 5.5 6.5 3 9.5 3C11.04 3 12.5 3.99 13 5.36C13.5 3.99 14.96 3 16.5 3C19.5 3 22 5.5 22 8.5C22 13.5 12 21 12 21Z" /></svg>
          <span>{manga.likes_count || 0}</span>
        </button>
        <button onClick={() => onComment(manga)} className="flex items-center gap-1 hover:text-blue-400">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
          <span>{manga.comments_count || 0}</span>
        </button>
        <button onClick={() => onShare(manga)} className="flex items-center gap-1 hover:text-green-400">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
        </button>
        <Link href={`/fan-manga/${manga.id}`} className="ml-auto px-4 py-2 bg-pink-600 text-white rounded-full font-semibold hover:bg-pink-700 transition">Read Manga</Link>
      </div>
    </Card>
  );
} 