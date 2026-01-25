import { useEffect, useState } from "react";

export type Language = "vi" | "en" | "ja" | "ko" | "zh" | "fr";

export interface Settings {
  targetLang: Language;
  // Future settings can be added here:
  // fontSize: 'small' | 'medium' | 'large'
  // ocrQuality: 'fast' | 'balanced' | 'high'
  // autoTranslate: boolean
}

const DEFAULT_SETTINGS: Settings = {
  targetLang: "vi",
};

/**
 * useSettings hook
 * Manages user settings with localStorage persistence
 * 
 * Features:
 * - Persists settings to localStorage
 * - Provides type-safe settings interface
 * - Easily extendable for new settings
 * - Default values fallback
 */
export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem("settings");
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn("Failed to parse stored settings:", error);
    }
    return DEFAULT_SETTINGS;
  });

  // Persist settings whenever they change
  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const setTargetLang = (lang: Language) => {
    updateSetting("targetLang", lang);
  };

  return {
    settings,
    updateSetting,
    setTargetLang,
    targetLang: settings.targetLang,
  };
}
