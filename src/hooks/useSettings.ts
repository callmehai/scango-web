import { useEffect, useState } from "react";
import type { TargetLanguage } from "../constants/languages";

export type SystemLanguage = "vi" | "en";
export type ThemeMode = "light" | "dark";

export interface Settings {
  targetLang: TargetLanguage;
  systemLang: SystemLanguage;
  theme: ThemeMode;
}

/** Default app settings */
const DEFAULT_SETTINGS: Settings = {
  targetLang: "vnm",
  systemLang: "vi",
  theme: "dark",
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem("settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error("❌ Error reading settings from localStorage:", error);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem("settings", JSON.stringify(settings));

      document.documentElement.setAttribute('data-theme', settings.theme);
    } catch (error) {
      console.error("❌ Error saving settings:", error);
    }
  }, [settings]);

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const setTargetLang = (lang: TargetLanguage) => {
    updateSetting("targetLang", lang);
  };

  const setSystemLang = (lang: SystemLanguage) => {
    updateSetting("systemLang", lang);
  };

  const setTheme = (theme: ThemeMode) => {
    updateSetting("theme", theme);
  };

  const toggleTheme = () => {
    const newTheme = settings.theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return {
    settings,
    updateSetting,
    setTargetLang,
    setSystemLang,
    setTheme,
    toggleTheme,
    targetLang: settings.targetLang,
    systemLang: settings.systemLang,
    theme: settings.theme,
  };
}