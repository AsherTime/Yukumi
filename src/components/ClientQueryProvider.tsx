// ClientQueryProvider.tsx (a new client-side component)
"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a new QueryClient instance
const queryClient = new QueryClient();

interface ClientQueryProviderProps {
  children: React.ReactNode;
}

const ClientQueryProvider: React.FC<ClientQueryProviderProps> = ({ children }) => {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default ClientQueryProvider;
