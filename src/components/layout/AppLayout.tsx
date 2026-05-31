import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useSettings } from "../../hooks/useSettings";
import { UI_TEXT } from "../../constants/uiText";
import Logo from "../Logo";
import HeaderControls from "../HeaderControls";
import "../../styles/AppLayout.css";

export interface AppLayoutProps {
  /** Optional page title. Shown as a large heading at the top of the content
   *  on sub-pages (i.e. when `showBack` is true). */
  title?: ReactNode;
  /** Show a back button (history -1) on the left of the header. Default false. */
  showBack?: boolean;
  /** Constrain content to a narrower (reading) width. Default false. */
  narrow?: boolean;
  /** Remove the horizontal padding of the content container (full-bleed). */
  flush?: boolean;
  children: ReactNode;
}

/**
 * Consistent application shell for AUTHENTICATED pages.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │ [back]            ◭ ScanGo      theme lang …  │  sticky header
 *   ├──────────────────────────────────────────────┤
 *   │   Page title                                   │  large heading (sub-pages)
 *   │            page content (max-width)            │
 *   └──────────────────────────────────────────────┘
 *
 * - The brand logo is centered in the header and navigates home.
 * - Left: optional back button. Right: <HeaderControls> (theme / lang /
 *   profile / logout).
 * - The page title renders as a large heading at the top of the content for
 *   sub-pages (showBack); the Home dashboard has its own hero, so its title is
 *   not repeated.
 * - Content is centered with a standard max-width + responsive, safe-area
 *   aware padding. Token-only styling, light/dark, reduced-motion safe.
 *
 * Pages should render ONLY their content as children — they must not render
 * their own header / back button / global controls anymore.
 */
export default function AppLayout({
  title,
  showBack = false,
  narrow = false,
  flush = false,
  children,
}: AppLayoutProps) {
  const navigate = useNavigate();
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];

  const contentClass = [
    "app-content",
    narrow ? "app-content--narrow" : "",
    flush ? "app-content--flush" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__side app-header__side--left">
          {showBack && (
            <button
              type="button"
              className="app-icon-btn"
              onClick={() => navigate(-1)}
              aria-label={t.back}
              title={t.back}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        <button
          type="button"
          className="app-header__brand"
          onClick={() => navigate("/")}
          aria-label={t.backHome}
          title={t.backHome}
        >
          <Logo height={30} className="app-header__brand-mark" />
        </button>

        <div className="app-header__side app-header__side--right">
          <HeaderControls />
        </div>
      </header>

      <main className={contentClass}>
        {title && showBack && <h1 className="app-page-title">{title}</h1>}
        {children}
      </main>
    </div>
  );
}
