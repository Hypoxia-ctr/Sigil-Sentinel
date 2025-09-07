import React, { useContext } from 'react';

type ThemeContextType = {
  theme: 'dark' | 'light';
};

const ThemeContext = React.createContext<ThemeContextType>({ theme: 'dark' });

export const useTheme = () => useContext(ThemeContext);
