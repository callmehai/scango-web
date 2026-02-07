import type { TargetLanguage } from "./languages";
import { LANGUAGE_MAP } from "./languages";

export const TOPIC_OPTIONS = [
  { value: "product", icon: "📦" },
  { value: "history", icon: "📚" },
  { value: "place", icon: "📍" },
  { value: "general", icon: "📄" },
] as const;


export const LANGUAGE_ORDER: TargetLanguage[] = [
  "eng",
  "vnm",
  "jpn",
  "kor",
  "chs",
  "cht",
  "fre",
  "ger",
  "spa",
  "por",
  "rus",
];

export const TRANSLATION_LANGS: Array<{
  code: TargetLanguage;
  label: string;
  flag: string;
}> = [
  { code: "eng", ...LANGUAGE_MAP.eng },
  { code: "vnm", ...LANGUAGE_MAP.vnm },
  { code: "jpn", ...LANGUAGE_MAP.jpn },
  { code: "kor", ...LANGUAGE_MAP.kor },
  { code: "chs", ...LANGUAGE_MAP.chs }, // Chinese Simplified
  { code: "cht", ...LANGUAGE_MAP.cht }, // Chinese Traditional
  { code: "fre", ...LANGUAGE_MAP.fre },
  { code: "ger", ...LANGUAGE_MAP.ger },
  { code: "spa", ...LANGUAGE_MAP.spa },
  { code: "por", ...LANGUAGE_MAP.por },
  { code: "rus", ...LANGUAGE_MAP.rus },
  { code: "ita", ...LANGUAGE_MAP.ita },
  { code: "dut", ...LANGUAGE_MAP.dut },
  { code: "swe", ...LANGUAGE_MAP.swe },
  { code: "dan", ...LANGUAGE_MAP.dan },
  { code: "fin", ...LANGUAGE_MAP.fin },
  { code: "pol", ...LANGUAGE_MAP.pol },
  { code: "cze", ...LANGUAGE_MAP.cze },
  { code: "hun", ...LANGUAGE_MAP.hun },
  { code: "tur", ...LANGUAGE_MAP.tur },
  { code: "ara", ...LANGUAGE_MAP.ara },
  { code: "tha", ...LANGUAGE_MAP.tha },
  { code: "hrv", ...LANGUAGE_MAP.hrv },
  { code: "gre", ...LANGUAGE_MAP.gre },
  { code: "bul", ...LANGUAGE_MAP.bul },
  { code: "slv", ...LANGUAGE_MAP.slv },
  { code: "ukr", ...LANGUAGE_MAP.ukr },
];