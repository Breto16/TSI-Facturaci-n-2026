import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

// Mantener este arreglo en el mismo orden en que quieres que rote toggleTheme
export const THEMES = [
  'light',
  'lightO',
  'musgo',
  'piedra',
  'terracota',
  'dark',
  'medianoche',
  'brasa',
  'vino',
  'ciruela',
];

// Hex "espejo" de --color-surface y --color-primary de cada tema, solo para
// pintar los swatches del selector. Si cambias un color en el CSS de un
// tema, actualiza también su entrada aquí.
export const THEME_META = {

  light: { label: 'Río', isDark: false, surface: '#eff5f4', primary: '#0f6e6a' },
  lightO: { label: 'Claro', isDark: false, surface: '#f2eee6', primary: '#253a22' },
  musgo: { label: 'Musgo', isDark: false, surface: '#ecece1', primary: '#566b3f' },
  piedra: { label: 'Piedra', isDark: false, surface: '#eef0f2', primary: '#3d6b78' },
  terracota: { label: 'Terracota', isDark: false, surface: '#f2e8dd', primary: '#a1462b' },
  dark: { label: 'Oscuro', isDark: true, surface: '#1e1e1e', primary: '#639a5b' },
  medianoche: { label: 'Medianoche', isDark: true, surface: '#16202e', primary: '#4f83c4' },
  brasa: { label: 'Brasa', isDark: true, surface: '#241c17', primary: '#c96a3a' },
  vino: { label: 'Vino', isDark: true, surface: '#241620', primary: '#a8415a' },
  ciruela: { label: 'Ciruela', isDark: true, surface: '#201925', primary: '#6d4a8c' },
};

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem('theme');
    return THEMES.includes(stored) ? stored : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = (newTheme) => {
    if (THEMES.includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      const currentIndex = THEMES.indexOf(prev);
      const nextIndex = (currentIndex + 1) % THEMES.length;
      return THEMES[nextIndex];
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);