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
