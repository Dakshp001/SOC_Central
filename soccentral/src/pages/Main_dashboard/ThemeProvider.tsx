// ThemeProvider.tsx
// Save as: src/pages/Main_dashboard/ThemeProvider.tsx

import React, { createContext, useContext, useEffect, useState } from "react";

type ThemeMode = 'light' | 'dark' | 'system';
type ActualTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  actualTheme: ActualTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme") || localStorage.getItem("security-dashboard-theme");
      return (saved as ThemeMode) || "dark";
    }
    return "dark";
  });

  const [actualTheme, setActualTheme] = useState<ActualTheme>("dark");

  // Update theme class and localStorage
  useEffect(() => {
    const root = document.documentElement;
    const isSystem = theme === "system";
    const resolved = isSystem
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : theme;

    root.classList.remove("light", "dark");
    root.classList.add(resolved);
    setActualTheme(resolved);

    localStorage.setItem("theme", theme);
    localStorage.setItem("security-dashboard-theme", theme);
  }, [theme]);

  // Listen for system preference change if theme is "system"
  useEffect(() => {
    if (theme !== "system") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? "dark" : "light";
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(newTheme);
      setActualTheme(newTheme);
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [theme]);

  const toggleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme(actualTheme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, actualTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
