// contexts/NavigationContext.tsx
'use client';

import {
  createContext,
  useState,
  Dispatch,
  SetStateAction,
  useContext,
} from "react";

interface NavigationContextType {
  fromPage: string;
  setFromPage: Dispatch<SetStateAction<string>>;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const [fromPage, setFromPage] = useState<string>("");

  return (
    <NavigationContext.Provider value={{ fromPage, setFromPage }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigationContext must be used within a NavigationProvider");
  }
  return context;
};
