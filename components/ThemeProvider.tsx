import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'dark' | 'light' | 'arcane';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const storedTheme = localStorage.getItem('sigil-theme') as Theme;
      // Validate stored theme
      if (['dark', 'light', 'arcane'].includes(storedTheme)) {
        return storedTheme;
      }
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const body = window.document.body;
    body.classList.remove('theme-dark', 'theme-light', 'theme-arcane');
    body.classList.add(`theme-${theme}`);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('sigil-theme', newTheme);
    } catch (e) {
      console.warn('Failed to save theme to localStorage', e);
    }
  };

  const value = { theme, setTheme };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
