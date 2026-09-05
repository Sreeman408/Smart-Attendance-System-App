import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Preferences } from '@capacitor/preferences';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('academia_theme');
      if (stored === 'dark') return true;
      if (stored === 'light') return false;
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  const applyTheme = (dark: boolean) => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('academia_theme', 'dark');
      Preferences.set({ key: 'academia_theme', value: 'dark' }).catch(() => {});
    } else {
      root.classList.remove('dark');
      localStorage.setItem('academia_theme', 'light');
      Preferences.set({ key: 'academia_theme', value: 'light' }).catch(() => {});
    }
  };

  useEffect(() => {
    applyTheme(isDark);

    const handleThemeChange = () => {
      const stored = localStorage.getItem('academia_theme');
      const shouldBeDark = stored === 'dark' || document.documentElement.classList.contains('dark');
      setIsDark(shouldBeDark);
    };

    window.addEventListener('themechange', handleThemeChange);
    return () => window.removeEventListener('themechange', handleThemeChange);
  }, [isDark]);

  const handleToggle = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    applyTheme(nextDark);
    window.dispatchEvent(new Event('themechange'));
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/50 flex items-center justify-center cursor-pointer ${className}`}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-amber-400 drop-shadow-xs" />
      ) : (
        <Moon className="w-5 h-5 text-slate-700 hover:text-slate-900 drop-shadow-xs" />
      )}
    </button>
  );
};
