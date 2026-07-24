import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTheme, THEME_META } from '../../context/ThemeContext';

// Solo visual (span, nunca button) — se usa suelto en el botón principal
// y envuelto en <button> dentro de la cuadrícula del menú.
const SwatchCircle = ({ themeId, size = 22, active = false }) => {
  const meta = THEME_META[themeId];
  if (!meta) return null;

  const angle = meta.isDark ? 315 : 135;
  const rad = (angle * Math.PI) / 180;
  const offsetX = 50 + 40 * Math.cos(rad);
  const offsetY = 50 + 40 * Math.sin(rad);

  // Claro: el núcleo (centro del degradado) es primary.
  // Oscuro: el núcleo es surface (el claro), primary queda hacia afuera.
  const coreColor = meta.primary;
  const outerColor = meta.surface;

  return (
    <span
      style={{
        display: 'block',
        width: size,
        height: size,
        borderRadius: '50%',
        border: '1px solid var(--color-border)',
        boxShadow: active
          ? '0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-primary)'
          : 'none',
        background: `radial-gradient(circle at ${offsetX}% ${offsetY}%, ${coreColor} 0%, ${outerColor} 85%)`,
        transition: 'box-shadow 120ms ease',
      }}
    />
  );
};

const ThemeGrid = ({ label, themeIds, activeTheme, onSelect }) => {
  if (themeIds.length === 0) return null;

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: 'var(--color-text-secondary)',
          padding: '4px 4px 6px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: 8,
          padding: '0 4px',
        }}
      >
        {themeIds.map((id) => {
          const meta = THEME_META[id];
          return (
            <div key={id} style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="button"
                title={meta.label}
                aria-label={meta.label}
                onClick={() => onSelect(id)}
                style={{
                  padding: 0,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  lineHeight: 0,
                }}
              >
                <SwatchCircle themeId={id} size={28} active={id === activeTheme} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ThemeToggle = () => {
  const { theme, setTheme, themes } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (themeId) => {
    setTheme(themeId);
    setOpen(false);
  };

  const lightThemes = themes.filter((id) => THEME_META[id] && !THEME_META[id].isDark);
  const darkThemes = themes.filter((id) => THEME_META[id] && THEME_META[id].isDark);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <style>{`
        @keyframes theme-menu-in {
          from { opacity: 0; transform: scale(0.92) translateY(-4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="btn btn-sm d-flex align-items-center gap-2"
        style={{
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
          border: '1px solid var(--color-border)',
          borderRadius: 50,
          paddingLeft: 8,
          paddingRight: 10,
        }}
      >
        <SwatchCircle themeId={theme} size={18} />
        <ChevronDown
          size={14}
          style={{
            transition: 'transform 160ms ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            zIndex: 1000,
            width: 210,
            padding: 8,
            borderRadius: 12,
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
            transformOrigin: 'top right',
            animation: 'theme-menu-in 160ms ease',
          }}
        >
          <ThemeGrid
            label="Claros"
            themeIds={lightThemes}
            activeTheme={theme}
            onSelect={handleSelect}
          />

          <div
            style={{
              height: 1,
              backgroundColor: 'var(--color-border)',
              margin: '8px 4px',
            }}
          />

          <ThemeGrid
            label="Oscuros"
            themeIds={darkThemes}
            activeTheme={theme}
            onSelect={handleSelect}
          />
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;