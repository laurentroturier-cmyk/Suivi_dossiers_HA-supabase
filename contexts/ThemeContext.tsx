import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Initialiser le thème depuis localStorage ou la préférence système
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    
    if (storedTheme) {
      setTheme(storedTheme);
    } else {
      // Utiliser la préférence système si disponible
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
    
    setMounted(true);
  }, []);

  // Appliquer le thème au document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Force Edge à appliquer/retirer la classe proprement
    if (theme === 'dark') {
      root.classList.remove('light'); // Au cas où
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('light'); // Classe explicite pour mode clair
    }
    
    // Double vérification pour Edge (bug de cache)
    requestAnimationFrame(() => {
      if (theme === 'dark' && !root.classList.contains('dark')) {
        root.classList.add('dark');
      } else if (theme === 'light' && root.classList.contains('dark')) {
        root.classList.remove('dark');
        root.classList.add('light');
      }
    });
    
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Ne rien rendre jusqu'à ce que le thème soit chargé pour éviter de flasher
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
