"use client";

import { TopNav } from "@/components/top-nav";
import { UserProfile } from "@/components/user-profile";
import { UserPosts } from "@/components/user-posts";
import { useParams } from "next/navigation";
import Footer from "@/components/footer"

export default function ProfileIdPage() {
  const params = useParams();
  const userId = Array.isArray(params.id) ? params.id[0] : params.id;
  return (
    <div className="container mx-auto px-4 py-8 space-y-12">
      <TopNav />
      <main className="container mx-auto px-4 py-8">
        <UserProfile userId={userId} readOnly={true} />
      </main>
      <Footer />
    </div>
  );
} 