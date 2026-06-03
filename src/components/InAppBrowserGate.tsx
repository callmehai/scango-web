import { useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT } from "../constants/uiText";
import Logo from "./Logo";
import {
  detectInAppBrowser,
  getMobilePlatform,
  openInSystemBrowser,
} from "../utils/inAppBrowser";
import "../styles/InAppBrowserGate.css";

/**
 * App-wide gate shown when running inside an in-app browser (Messenger / Zalo /
 * Facebook / …), where Google blocks OAuth sign-in (Error 403:
 * disallowed_useragent). Steers users to a real browser before they hit the
 * broken login. Android can jump straight to Chrome; iOS WebViews can't be
 * forced, so we show instructions + a copy-link fallback.
 */
export default function InAppBrowserGate() {
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];
  const [copied, setCopied] = useState(false);

  const app = detectInAppBrowser();
  if (!app) return null;

  // Android can jump straight to Chrome; iOS can't be forced, so we also show
  // the manual instruction below the (best-effort) primary button.
  const isAndroid = getMobilePlatform() === "android";

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
    <div className="inapp-gate" role="dialog" aria-modal="true">
      <div className="inapp-gate__card">
        <Logo height={56} iconOnly className="inapp-gate__logo" />
        <h1 className="inapp-gate__title">{t.inAppGateTitle}</h1>

        {/* Primary CTA: open in a real browser */}
        <button
          type="button"
          className="inapp-gate__btn"
          onClick={() => openInSystemBrowser()}
        >
          {t.authOpenInBrowser}
        </button>

        {/* iOS can't be forced — show the manual steps under the button */}
        {!isAndroid && (
          <p className="inapp-gate__hint">{t.authInAppIosHint}</p>
        )}

        {/* Secondary fallback: copy the link to paste into a browser */}
        <button
          type="button"
          className="inapp-gate__btn inapp-gate__btn--secondary"
          onClick={copyLink}
        >
          {copied ? t.authLinkCopied : t.authCopyLink}
        </button>
      </div>
    </div>
  );
}
