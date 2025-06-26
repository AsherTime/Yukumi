// contexts/NavigationContext.tsx
'use client';
import { createContext, useContext, useState } from 'react';

const NavigationContext = createContext({
  fromPage: '',
  setFromPage: (page: string) => {},
});

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const [fromPage, setFromPage] = useState('');
  return (
    <NavigationContext.Provider value={{ fromPage, setFromPage }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => useContext(NavigationContext);
