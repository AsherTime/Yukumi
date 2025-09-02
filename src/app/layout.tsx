import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import type React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/utils/queryClient'
import { LoginGateProvider } from '@/contexts/LoginGateContext';
import LoginGateModalWrapper from '@/components/LoginGateModalWrapper';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { Toaster } from "@/components/ui/sonner"
import VisitTracker from "@/components/VisitTracker";

const inter = Inter({ subsets: ["latin"] });


export const metadata: Metadata = {
  title: "Yukumi",
  description: "Anime Community Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="image" property="og:image" content="https://yukumi.pages.dev/og-image.png" />
        <meta property="og:image:alt" content="Yukumi preview image" />
        <meta name="title" property="og:title" content="Yukumi" />
        <meta name="description" property="og:description" content="Social cataloguing website for Japanese animated shows that allows users to track their watching progress, create shareable content and engage with fellow enthusiasts." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://yukumi.pages.dev/" />
        <meta name="author" content="Sarthak Pattnaik" />
        <meta property="article:published_time" content="2025-09-02T00:00:00Z" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Yukumi" />
        <meta name="twitter:description" content="Social cataloguing website for Japanese animated shows that allows users to track their watching progress, create shareable content and engage with fellow enthusiasts." />
        <meta name="twitter:image" content="https://yukumi.pages.dev/og-image.png" />
      </head>
      <body className={`${inter.className} min-h-screen bg-black text-white`}>
        <Toaster richColors position="top-right" />
        <AuthProvider>
          <NavigationProvider>
            <QueryClientProvider client={queryClient}>
              <LoginGateProvider>
                <VisitTracker />
                <main>{children}</main>
                <LoginGateModalWrapper />
              </LoginGateProvider>
            </QueryClientProvider>
          </NavigationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
