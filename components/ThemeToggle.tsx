import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../design-system/theme/ThemeProvider';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg transition-all duration-200 ${
        resolvedTheme === 'dark'
          ? 'bg-dark-700 hover:bg-dark-600 text-dark-100'
          : 'bg-light-200 hover:bg-light-300 text-light-800'
      } ${className}`}
      aria-label={`Basculer vers le mode ${resolvedTheme === 'light' ? 'sombre' : 'clair'}`}
      title={`Mode ${resolvedTheme === 'light' ? 'sombre' : 'clair'}`}
    >
      {resolvedTheme === 'light' ? (
        <Moon size={20} strokeWidth={2} />
      ) : (
        <Sun size={20} strokeWidth={2} />
      )}
    </button>
  );
};
