# 🌸 Yukumi - Anime Tracker & Community

Yukumi is a full-stack anime website where users can track their watched anime, score them, and engage in community discussions. Inspired by platforms like MyAnimeList and Reddit, Yukumi brings together tracking, scoring, and social interaction — all in one place.

## 🚀 Features

### 📝 Anime Tracking
- Search and browse anime.
- Add anime to your personal list with status: `Watching`, `Completed`, `On-Hold`, `Dropped`, or `Planning`.
- Score each anime out of 10 and view community average scores.

### 👥 Community
- Create posts and engage with others in a Reddit-style community system.
- Like, comment, and share content around specific anime.
- Filter content feed based on anime.

### 📊 Profile & Stats
- Edit your profile with custom display name, profile and banner pics.
- Track progress on your anime list.
- View your content's reach

### 🔐 Authentication
- Sign up or log in with email or Google or Discord.
- Personalized experience once logged in.

### 📷 Media & Hosting
- Anime posters and assets are served through [Supabase](https://supabase.com/) and [ImageKit](https://imagekit.io/).
- Images are optimized for fast delivery and caching.

## ⚙️ Tech Stack

- **Frontend:** React (with TypeScript), Tailwind CSS, Next.js (App Router)
- **Backend:** Supabase (Database, Auth, RLS Policies, Edge Functions)
- **Auth:** Supabase Authentication
- **Storage/CDN:** Supabase + ImageKit
