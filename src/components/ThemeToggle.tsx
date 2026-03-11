import { Moon, SunMedium } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
      aria-label="Alternar tema"
      type="button"
    >
      {theme === 'dark' ? <SunMedium size={16} /> : <Moon size={16} />}
      <span>{theme === 'dark' ? 'Modo claro' : 'Modo escuro'}</span>
    </button>
  );
}
