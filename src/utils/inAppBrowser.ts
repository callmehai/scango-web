// Detect embedded in-app browsers (WebViews) such as Messenger, Facebook,
// Zalo, Instagram, etc. Google blocks OAuth sign-in inside these WebViews with
// `Error 403: disallowed_useragent`, so we steer users to a real browser.

export type MobilePlatform = "ios" | "android" | "other";

const ua = (): string =>
  typeof navigator === "undefined" ? "" : navigator.userAgent || "";

/** Which named app's WebView we're inside, or null for a normal browser. */
export function detectInAppBrowser(): string | null {
  const s = ua();
  // Facebook / Messenger inject FBAN/FBAV/FB_IAB; Messenger also adds "Messenger".
  if (/\bFBAN\b|\bFBAV\b|FB_IAB|FBIOS|Messenger/i.test(s)) return "Facebook";
  if (/Zalo/i.test(s)) return "Zalo";
  if (/Instagram/i.test(s)) return "Instagram";
  if (/\bLine\//i.test(s)) return "LINE";
  if (/TikTok|musical_ly|BytedanceWebview/i.test(s)) return "TikTok";
  // Generic Android WebView: "; wv)" marker, no real-browser token.
  if (/; wv\)/i.test(s) && /Android/i.test(s)) return "WebView";
  return null;
}

export function isInAppBrowser(): boolean {
  return detectInAppBrowser() !== null;
}

export function getMobilePlatform(): MobilePlatform {
  const s = ua();
  if (/iPhone|iPad|iPod/i.test(s)) return "ios";
  if (/Android/i.test(s)) return "android";
  return "other";
}

/**
 * Try to break out of the WebView into the system browser.
 * - Android: deep-link to Chrome via an `intent://` URL (1-tap, reliable).
 * - iOS: WebViews can't be forced to Safari programmatically, so the caller
 *   should show instructions instead. We return false there.
 *
 * Returns true if an escape was attempted.
 */
export function openInSystemBrowser(targetUrl = window.location.href): boolean {
  if (getMobilePlatform() === "android") {
    const stripped = targetUrl.replace(/^https?:\/\//, "");
    // host+path go before #Intent; scheme/package live in the fragment.
    window.location.href =
      `intent://${stripped}#Intent;scheme=https;` +
      `package=com.android.chrome;end`;
    return true;
  }
  return false;
}
