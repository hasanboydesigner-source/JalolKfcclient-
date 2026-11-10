import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { DEFAULT_SETTINGS, sanitizePublicSettings } from '../../shared/settingsDefaults';
import { useSocket } from '../hooks/useSocket';

const SettingsContext = createContext(null);

const SETTINGS_CACHE_KEY = 'restaurant_settings_cache';

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const cached = localStorage.getItem(SETTINGS_CACHE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Failed to parse cached settings:', e);
    }
    return sanitizePublicSettings(DEFAULT_SETTINGS);
  });

  const [loading, setLoading] = useState(true);

  // Apply visual theme variables to document root
  const applyTheme = useCallback((currentSettings) => {
    if (!currentSettings?.branding) return;

    const { primaryColor, accentColor, themeMode, borderRadius, faviconUrl } = currentSettings.branding;
    const root = document.documentElement;

    if (primaryColor) {
      root.style.setProperty('--brand-primary', primaryColor);
      root.style.setProperty('--brand-accent', accentColor || primaryColor);
      root.style.setProperty('--pos-danger', primaryColor);
    }

    if (borderRadius === 'sharp') {
      root.style.setProperty('--radius-sm', '2px');
      root.style.setProperty('--radius-md', '4px');
      root.style.setProperty('--radius-lg', '6px');
      root.style.setProperty('--radius-xl', '8px');
    } else if (borderRadius === 'pill') {
      root.style.setProperty('--radius-sm', '12px');
      root.style.setProperty('--radius-md', '20px');
      root.style.setProperty('--radius-lg', '32px');
      root.style.setProperty('--radius-xl', '48px');
    } else {
      // Rounded default
      root.style.setProperty('--radius-sm', '6px');
      root.style.setProperty('--radius-md', '10px');
      root.style.setProperty('--radius-lg', '16px');
      root.style.setProperty('--radius-xl', '24px');
    }

    // Set theme attribute
    if (themeMode && themeMode !== 'auto') {
      root.setAttribute('data-theme', themeMode);
    }

    // Update document title & favicon
    if (currentSettings.business?.name) {
      document.title = `${currentSettings.business.name} | POS System`;
    }

    if (faviconUrl) {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/png';
      link.rel = 'icon';
      link.href = faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, []);

  const fetchPublicSettings = useCallback(async () => {
    try {
      const res = await axios.get('/api/settings/public');
      if (res.data && typeof res.data === 'object' && !Array.isArray(res.data) && res.data.business) {
        setSettings(res.data);
        localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(res.data));
        applyTheme(res.data);
      }
    } catch (err) {
      console.warn('Using cached or default settings:', err.message);
    } finally {
      setLoading(false);
    }
  }, [applyTheme]);

  // Live Apply via Socket.io broadcast
  const handleLiveSettingsUpdate = useCallback((newPublicSettings) => {
    console.log('⚡ Realtime settings update received');
    setSettings(newPublicSettings);
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(newPublicSettings));
    applyTheme(newPublicSettings);
  }, [applyTheme]);

  // Connect socket for settings broadcast
  useSocket(null, null, handleLiveSettingsUpdate);

  useEffect(() => {
    fetchPublicSettings();
  }, [fetchPublicSettings]);

  // Apply theme initially on mount
  useEffect(() => {
    applyTheme(settings);
  }, [settings, applyTheme]);

  // Helper: Format Currency Price
  const formatPrice = useCallback((amount) => {
    const num = Number(amount) || 0;
    const decimals = settings.localization?.decimals || 0;
    const symbol = settings.localization?.currencySymbol || "so'm";
    const position = settings.localization?.currencyPosition || 'after';

    const formattedNum = num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    return position === 'before' ? `${symbol} ${formattedNum}` : `${formattedNum} ${symbol}`;
  }, [settings]);

  // Update Section API
  const updateSection = async (section, updateData) => {
    const token = localStorage.getItem('pos_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await axios.patch(`/api/settings/${section}`, updateData, { headers });
    if (res.data.success) {
      await fetchPublicSettings();
      return true;
    }
    return false;
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      formatPrice,
      refreshSettings: fetchPublicSettings,
      updateSection
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
