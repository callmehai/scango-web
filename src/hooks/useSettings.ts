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
  theme: "dark", // ⚠️ Chỉ dùng khi localStorage rỗng
};

/**
 * QUAN TRỌNG: Hook này quản lý TẤT CẢ settings bao gồm theme
 * - Đọc từ localStorage khi khởi tạo
 * - Lưu vào localStorage mỗi khi thay đổi
 * - Apply theme vào document.documentElement
 */
export function useSettings() {
  // BƯỚC 1: Đọc settings từ localStorage (chỉ chạy 1 lần khi component mount)
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const stored = localStorage.getItem("settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log("📖 Loaded settings from localStorage:", parsed);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (error) {
      console.error("❌ Error reading settings from localStorage:", error);
    }
    console.log("🆕 Using default settings:", DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  });

  // BƯỚC 2: Mỗi khi settings thay đổi → lưu vào localStorage VÀ apply theme
  useEffect(() => {
    try {
      // Lưu vào localStorage
      localStorage.setItem("settings", JSON.stringify(settings));
      console.log("💾 Saved settings to localStorage:", settings);

      // Apply theme vào HTML element
      document.documentElement.setAttribute('data-theme', settings.theme);
      console.log("🎨 Applied theme to document:", settings.theme);
    } catch (error) {
      console.error("❌ Error saving settings:", error);
    }
  }, [settings]); // ⚠️ Chỉ chạy khi settings thay đổi

  // BƯỚC 3: Các hàm update settings
  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => {
    console.log(`🔧 Updating ${key}:`, value);
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
    console.log(`🔄 Toggling theme: ${settings.theme} → ${newTheme}`);
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