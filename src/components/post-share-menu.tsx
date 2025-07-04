import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Share2, Twitter, MessageSquare, Copy } from "lucide-react";
import { SlSocialReddit } from "react-icons/sl";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";

interface PostShareMenuProps {
  path: string; // e.g., /posts/123
  title: string;
}

export default function PostShareMenu({ path, title }: PostShareMenuProps) {
  const [copied, setCopied] = useState(false);
  if (typeof window === "undefined") return null;

  const origin = window.location.origin;
  const fullUrl = `${origin}${path}`;

  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  const links = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    whatsapp: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    reddit: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
  };

  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="icon" variant="ghost" className="text-muted-foreground">
          <Share2 className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2 space-y-1 bg-black border border-zinc-800 text-white rounded-lg shadow-lg">
        <a href={links.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-blue-500">
          <Twitter className="w-4 h-4" />
          X
        </a>
        <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-green-500">
          <MessageSquare className="w-4 h-4" />
          WhatsApp
        </a>
        <a href={links.reddit} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-orange-500">
          <SlSocialReddit className="w-4 h-4" />
          Reddit
        </a>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 text-sm hover:text-white w-full"
        >
          <Copy className="w-4 h-4" />
          {copied ? "Link copied!" : "Copy Link"}
        </button>
      </PopoverContent>
    </Popover>
  );
}
