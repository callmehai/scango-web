import { useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import {
  detectInAppBrowser,
  getMobilePlatform,
  openInSystemBrowser,
} from "../utils/inAppBrowser";

/**
 * Shown on the auth pages when we're running inside an in-app browser
 * (Messenger / Zalo / Facebook / …), where Google blocks OAuth sign-in.
 * Steers the user to a real browser; on Android we can open Chrome directly,
 * on iOS we show instructions + a copy-link fallback.
 */
export default function InAppBrowserNotice() {
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];
  const [copied, setCopied] = useState(false);

  const app = detectInAppBrowser();
  if (!app) return null;

  const canOpenDirectly = getMobilePlatform() === "android";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked in some WebViews — the iOS hint still guides them */
    }
  };

  return (
    <div className="auth-inapp" role="alert">
      <p className="auth-inapp__text">
        {app !== "WebView" && <strong>{app}: </strong>}
        {t.authInAppNotice}
      </p>

      {canOpenDirectly ? (
        <button
          type="button"
          className="auth-inapp__btn"
          onClick={() => openInSystemBrowser()}
        >
          {t.authOpenInBrowser}
        </button>
      ) : (
        <>
          <p className="auth-inapp__hint">{t.authInAppIosHint}</p>
          <button
            type="button"
            className="auth-inapp__btn"
            onClick={copyLink}
          >
            {copied ? t.authLinkCopied : t.authCopyLink}
          </button>
        </>
      )}
    </div>
  );
}
