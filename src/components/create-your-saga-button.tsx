"use client";

import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PenLine } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLoginGate } from '@/contexts/LoginGateContext';

export function CreateYourSagaButton() {
  const router = useRouter();
  const { requireLogin } = useLoginGate();
  return (
    <Card className="bg-zinc-900/80 border border-zinc-800/60 rounded-2xl p-4 shadow-lg flex flex-col items-center text-center">
      <CardHeader className="p-0 mb-2 w-full">
        <CardTitle className="text-white font-bold text-lg w-full">Create Your Saga</CardTitle>
      </CardHeader>
      <div className="text-gray-400 text-sm mb-4 w-full">Write your own story and share it with the community.</div>
      <Button
        onClick={() => {
          const allowed = requireLogin();
          if (!allowed) return;
          router.push("/fan-story-creation")
        }}
        className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-fuchsia-700 text-white font-semibold hover:from-purple-500 hover:to-fuchsia-600 transition-all flex items-center justify-center gap-2"
      >
        <PenLine className="w-5 h-5" />
        Write Your Story
      </Button>
    </Card>
  );
} 