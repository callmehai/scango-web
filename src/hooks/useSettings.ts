import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { TargetLanguage } from "../constants/languages";

export type SystemLanguage = "vi" | "en";
export type ThemeMode = "light" | "dark";

export interface Settings {
  targetLang: TargetLanguage;
  systemLang: SystemLanguage;
  theme: ThemeMode;
}

const DEFAULT_SETTINGS: Settings = {
  targetLang: "vnm",
  systemLang: "vi",
  theme: "dark",
};

interface SettingsContextValue {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  setTargetLang: (lang: TargetLanguage) => void;
  setSystemLang: (lang: SystemLanguage) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  targetLang: TargetLanguage;
  systemLang: SystemLanguage;
  theme: ThemeMode;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
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
      document.documentElement.setAttribute("data-theme", settings.theme);
    } catch (error) {
      console.error("❌ Error saving settings:", error);
    }
  }, [settings]);

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const value: SettingsContextValue = {
    settings,
    updateSetting,
    setTargetLang: (lang) => updateSetting("targetLang", lang),
    setSystemLang: (lang) => updateSetting("systemLang", lang),
    setTheme: (theme) => updateSetting("theme", theme),
    toggleTheme: () =>
      updateSetting("theme", settings.theme === "light" ? "dark" : "light"),
    targetLang: settings.targetLang,
    systemLang: settings.systemLang,
    theme: settings.theme,
  };

  return createElement(SettingsContext.Provider, { value }, children);
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used inside <SettingsProvider>");
  }
  return ctx;
}
