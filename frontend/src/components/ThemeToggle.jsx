import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { darkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300"
      aria-label="Toggle dark mode"
      id="theme-toggle"
    >
      <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 transition-transform duration-300" style={{ transform: darkMode ? 'rotate(180deg)' : 'rotate(0deg)' }}>
        {darkMode ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;
