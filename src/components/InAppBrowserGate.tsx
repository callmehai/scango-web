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
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  const app = detectInAppBrowser();
  if (!app || dismissed) return null;

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
    <div className="inapp-gate" role="dialog" aria-modal="true">
      <div className="inapp-gate__card">
        <Logo height={56} iconOnly className="inapp-gate__logo" />
        <h1 className="inapp-gate__title">{t.inAppGateTitle}</h1>
        <p className="inapp-gate__body">
          {app !== "WebView" && <strong>{app} · </strong>}
          {t.inAppGateBody}
        </p>

        {canOpenDirectly ? (
          <button
            type="button"
            className="inapp-gate__btn"
            onClick={() => openInSystemBrowser()}
          >
            {t.authOpenInBrowser}
          </button>
        ) : (
          <>
            <p className="inapp-gate__hint">{t.authInAppIosHint}</p>
            <button
              type="button"
              className="inapp-gate__btn"
              onClick={copyLink}
            >
              {copied ? t.authLinkCopied : t.authCopyLink}
            </button>
          </>
        )}

        <button
          type="button"
          className="inapp-gate__dismiss"
          onClick={() => setDismissed(true)}
        >
          {t.inAppGateDismiss}
        </button>
      </div>
    </div>
  );
}
