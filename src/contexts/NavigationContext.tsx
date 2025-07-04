// contexts/NavigationContext.tsx
'use client';
import { createContext, useState, Dispatch, SetStateAction, useContext } from "react";

interface NavigationContextType {
  fromPage: string;
  setFromPage: Dispatch<SetStateAction<string>>;
}

export const NavigationContext = createContext<NavigationContextType>({
  fromPage: "",
  setFromPage: (_value: SetStateAction<string>) => { void _value; },
});

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const [fromPage, setFromPage] = useState<string>("");

  return (
    <NavigationContext.Provider value={{ fromPage, setFromPage }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => useContext(NavigationContext);
