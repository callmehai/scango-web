export type TargetLanguage =
    | "ara"
    | "bul"
    | "chs"
    | "cht"
    | "hrv"
    | "cze"
    | "dan"
    | "dut"
    | "eng"
    | "fin"
    | "fre"
    | "ger"
    | "gre"
    | "hun"
    | "kor"
    | "ita"
    | "jpn"
    | "pol"
    | "por"
    | "rus"
    | "slv"
    | "spa"
    | "swe"
    | "tha"
    | "tur"
    | "ukr"
    | "vnm"
    | "auto";

// Language support mapping for OCR engines
// Engine 2 (best support) covers these languages
export const LANGUAGE_MAP: Record<
    TargetLanguage,
    {
        label: string;
        flag: string;
        engine2Supported: boolean;
    }
> = {
    auto: { label: "Auto Detect", flag: "🔍", engine2Supported: true },

    ara: { label: "Arabic (العربية)", flag: "🇸🇦", engine2Supported: false },
    bul: { label: "Bulgarian (Български)", flag: "🇧🇬", engine2Supported: false },

    chs: {
        label: "Chinese - Simplified (简体中文)",
        flag: "🇨🇳",
        engine2Supported: true,
    },
    cht: {
        label: "Chinese - Traditional (繁体中文)",
        flag: "🇹🇼",
        engine2Supported: true,
    },

    hrv: { label: "Croatian (Hrvatski)", flag: "🇭🇷", engine2Supported: false },
    cze: { label: "Czech (Čeština)", flag: "🇨🇿", engine2Supported: false },
    dan: { label: "Danish (Dansk)", flag: "🇩🇰", engine2Supported: true },
    dut: { label: "Dutch (Nederlands)", flag: "🇳🇱", engine2Supported: true },
    eng: { label: "English", flag: "🇺🇸", engine2Supported: true },
    fin: { label: "Finnish (Suomi)", flag: "🇫🇮", engine2Supported: true },
    fre: { label: "French (Français)", flag: "🇫🇷", engine2Supported: true },
    ger: { label: "German (Deutsch)", flag: "🇩🇪", engine2Supported: true },
    gre: { label: "Greek (Ελληνικά)", flag: "🇬🇷", engine2Supported: false },
    hun: { label: "Hungarian (Magyar)", flag: "🇭🇺", engine2Supported: false },
    ita: { label: "Italian (Italiano)", flag: "🇮🇹", engine2Supported: true },
    jpn: { label: "Japanese (日本語)", flag: "🇯🇵", engine2Supported: true },
    kor: { label: "Korean (한국어)", flag: "🇰🇷", engine2Supported: true },
    pol: { label: "Polish (Polski)", flag: "🇵🇱", engine2Supported: false },
    por: { label: "Portuguese (Português)", flag: "🇵🇹", engine2Supported: true },
    rus: { label: "Russian (Русский)", flag: "🇷🇺", engine2Supported: true },
    slv: { label: "Slovenian (Slovenščina)", flag: "🇸🇮", engine2Supported: true },
    spa: { label: "Spanish (Español)", flag: "🇪🇸", engine2Supported: true },
    swe: { label: "Swedish (Svenska)", flag: "🇸🇪", engine2Supported: true },
    tha: { label: "Thai (ไทย)", flag: "🇹🇭", engine2Supported: true },
    tur: { label: "Turkish (Türkçe)", flag: "🇹🇷", engine2Supported: false },
    ukr: { label: "Ukrainian (Українська)", flag: "🇺🇦", engine2Supported: true },
    vnm: { label: "Vietnamese (Tiếng Việt)", flag: "🇻🇳", engine2Supported: true },
};

// Map our 3-letter target codes to BCP-47 tags for the Web Speech API, so the
// read-aloud voice matches whatever language the AI actually translated into
// (the app is multi-language). "auto" has no fixed output language → caller
// falls back to the UI language.
export const SPEECH_LANG: Record<TargetLanguage, string> = {
    ara: "ar-SA",
    bul: "bg-BG",
    chs: "zh-CN",
    cht: "zh-TW",
    hrv: "hr-HR",
    cze: "cs-CZ",
    dan: "da-DK",
    dut: "nl-NL",
    eng: "en-US",
    fin: "fi-FI",
    fre: "fr-FR",
    ger: "de-DE",
    gre: "el-GR",
    hun: "hu-HU",
    kor: "ko-KR",
    ita: "it-IT",
    jpn: "ja-JP",
    pol: "pl-PL",
    por: "pt-PT",
    rus: "ru-RU",
    slv: "sl-SI",
    spa: "es-ES",
    swe: "sv-SE",
    tha: "th-TH",
    tur: "tr-TR",
    ukr: "uk-UA",
    vnm: "vi-VN",
    auto: "",
};
