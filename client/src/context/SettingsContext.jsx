import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext(null);

const defaults = {
  themeMode: 'dark',
  accentColor: '#1db954',
  fontSize: 'medium',
  compactMode: false,
  bgColor: null,
  bgImage: null
};

function applyTheme(themeMode) {
  if (themeMode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('light-mode', !prefersDark);
  } else {
    document.documentElement.classList.toggle('light-mode', themeMode === 'light');
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const stored = localStorage.getItem('appSettings');
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  });

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    document.documentElement.style.setProperty('--accent-color', settings.accentColor);
    applyTheme(settings.themeMode);
    document.documentElement.classList.toggle('compact-mode', settings.compactMode);
  }, [settings]);

  useEffect(() => {
    if (settings.themeMode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [settings.themeMode]);

  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
