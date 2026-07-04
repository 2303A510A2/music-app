import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

const defaults = {
  themeMode: 'dark',
  accentColor: '#1db954',
  fontSize: 'medium',
  bgColor: null,
  bgImage: null
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    const stored = localStorage.getItem('appSettings');
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  });

  useEffect(() => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    document.documentElement.style.setProperty('--accent-color', settings.accentColor);
    document.documentElement.classList.toggle('light-mode', settings.themeMode === 'light');
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
