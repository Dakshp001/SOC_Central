// Theme Toggle Component
// Save as: src/pages/Main_dashboard/ThemeToggle.tsx

import React from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeProvider";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const isDark = theme === 'dark';

  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={toggleTheme} 
      className="
        h-9 w-9 p-0
        bg-white hover:bg-gray-100
        dark:bg-black dark:hover:bg-gray-900
        border border-black hover:border-black/70
        dark:border-gray-400 dark:hover:border-gray-300
        text-foreground hover:text-foreground/80
        rounded-lg
        transition-all duration-200
        hover:scale-105 hover:shadow-lg
      "
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </Button>
  );
};