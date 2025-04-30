import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import type React from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import ClientQueryProvider from "@/components/ClientQueryProvider"; // Import your ClientQueryProvider
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/utils/queryClient'

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
      <body className={`${inter.className} min-h-screen bg-black text-white`}>
        <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <main>{children}</main>
          </QueryClientProvider>
        </AuthProvider>
      </body> 
    </html>
  );
}
