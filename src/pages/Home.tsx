import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../hooks/useAuth";
import { UI_TEXT } from "../constants/uiText";
import { Card, Button, ProgressRing, Skeleton, Badge } from "../components/ui";
import api from "../api/axios";
import "../styles/Home.css";

interface UsageStatus {
  limited: boolean;
  scansUsed: number;
  scansLimit: number;
  asksUsed: number;
  asksLimit: number;
  resetAtUtc: string;
}

/**
 * Home — retention dashboard.
 *
 * NOTE: No API / data-fetching / auth logic is added or changed here. We only
 * READ from the existing `useAuth()` / `useSettings()` hooks for presentation.
 * The weekly quota widget is a SAFE PLACEHOLDER: there is no committed usage
 * endpoint/hook wired in the current codebase, so we render an "unknown" state
 * (no numbers, gentle hint) instead of inventing a new API call. If/when a
 * `useUsage()`-style hook lands, swap `usage` below for its real values.
 */

type ScanIconProps = { size?: number };

function ScanIcon({ size = 28 }: ScanIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function HistoryIcon({ size = 28 }: ScanIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 10h8M8 14h4" />
    </svg>
  );
}

function SettingsIcon({ size = 28 }: ScanIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      className="home__arrow"
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
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];

  // Auth context — presentation only. We never assume a specific field exists,
  // so the greeting degrades gracefully across user shapes.
  const auth = useAuth() as unknown as { user?: unknown } | null | undefined;
  const user = auth?.user as
    | { name?: string; displayName?: string; fullName?: string; email?: string }
    | null
    | undefined;

  const displayName =
    user?.name ||
    user?.displayName ||
    user?.fullName ||
    (user?.email ? user.email.split("@")[0] : "") ||
    t.homeGreetingFallback;

  // Time-of-day greeting (client clock only; pure presentation).
  const hour = new Date().getHours();
  const greeting =
    hour < 11
      ? t.homeGreetingMorning
      : hour < 18
        ? t.homeGreetingAfternoon
        : t.homeGreetingEvening;

  // Weekly quota — fetched live from GET /api/me/usage.
  const [usage, setUsage] = useState<UsageStatus | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api
      .get<UsageStatus>("/me/usage")
      .then((res) => {
        if (alive) setUsage(res.data);
      })
      .catch(() => {
        /* leave usage null → idle state */
      })
      .finally(() => {
        if (alive) setUsageLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Unlimited plans (Pro/Unlimited/admin/tester) report limited=false → show ∞.
  const usageUnlimited = usage != null && !usage.limited;
  const usageReady = usage != null && usage.limited;

  // Scans
  const scanUsed = usage?.scansUsed ?? 0;
  const scanQuota = usage?.scansLimit ?? 0;
  const scanRemaining = Math.max(scanQuota - scanUsed, 0);
  // Asks (chat)
  const askUsed = usage?.asksUsed ?? 0;
  const askQuota = usage?.asksLimit ?? 0;
  const askRemaining = Math.max(askQuota - askUsed, 0);

  const tips = [t.homeTip1, t.homeTip2, t.homeTip3];

  return (
    <div className="home">
      {/* Greeting / hero */}
      <header className="home__hero">
        <div className="home__greeting">
          <p className="home__eyebrow">{greeting}</p>
          <h1 className="home__name">{displayName}</h1>
          <p className="home__subtitle">{t.homeSubtitle}</p>
        </div>
      </header>

      {/* Primary CTA — biggest, most prominent action */}
      <Card padding="lg" className="home__cta">
        <div className="home__cta-text">
          <h2 className="home__cta-title">{t.homeCtaTitle}</h2>
          <p className="home__cta-desc">{t.homeCtaDesc}</p>
        </div>
        <Button
          size="lg"
          fullWidth
          leftIcon={<ScanIcon size={22} />}
          onClick={() => navigate("/scan")}
          aria-label={t.scanAria}
        >
          {t.scanBtn}
        </Button>
      </Card>

      {/* Weekly quota */}
      <Card padding="lg" className="home__quota">
        <div className="home__quota-head">
          <h2 className="home__section-title">{t.homeQuotaTitle}</h2>
          <Badge variant="neutral" size="sm">
            {t.homeQuotaPeriod}
          </Badge>
        </div>

        <div className="home__quota-body">
          {usageLoading ? (
            <>
              <div className="home__quota-item">
                <Skeleton variant="circle" width={110} height={110} />
                <Skeleton width="60%" height={14} />
              </div>
              <div className="home__quota-item">
                <Skeleton variant="circle" width={110} height={110} />
                <Skeleton width="60%" height={14} />
              </div>
            </>
          ) : (
            <>
              {/* Scans */}
              <div className="home__quota-item">
                <ProgressRing
                  value={usageReady ? scanRemaining : usageUnlimited ? 1 : 0}
                  max={usageReady ? scanQuota : usageUnlimited ? 1 : 100}
                  tone="success"
                  size={110}
                  thickness={9}
                  label={t.homeQuotaScans}
                >
                  {usageReady ? (
                    <span className="home__quota-fig">
                      <strong>{scanRemaining}</strong>
                      <span className="home__quota-of">/ {scanQuota}</span>
                    </span>
                  ) : usageUnlimited ? (
                    <span className="home__quota-fig">
                      <strong>∞</strong>
                    </span>
                  ) : (
                    <span className="home__quota-fig home__quota-fig--idle">
                      <strong>—</strong>
                    </span>
                  )}
                </ProgressRing>
                <p className="home__quota-label">{t.homeQuotaScans}</p>
              </div>

              {/* Asks (chat) */}
              <div className="home__quota-item">
                <ProgressRing
                  value={usageReady ? askRemaining : usageUnlimited ? 1 : 0}
                  max={usageReady ? askQuota : usageUnlimited ? 1 : 100}
                  tone="success"
                  size={110}
                  thickness={9}
                  label={t.homeQuotaAsks}
                >
                  {usageReady ? (
                    <span className="home__quota-fig">
                      <strong>{askRemaining}</strong>
                      <span className="home__quota-of">/ {askQuota}</span>
                    </span>
                  ) : usageUnlimited ? (
                    <span className="home__quota-fig">
                      <strong>∞</strong>
                    </span>
                  ) : (
                    <span className="home__quota-fig home__quota-fig--idle">
                      <strong>—</strong>
                    </span>
                  )}
                </ProgressRing>
                <p className="home__quota-label">{t.homeQuotaAsks}</p>
              </div>
            </>
          )}
        </div>
        {!usageLoading && (
          <p className="home__quota-foot">
            {usageReady
              ? t.homeQuotaResetHint
              : usageUnlimited
                ? t.homeQuotaUnlimited
                : t.homeQuotaUnknown}
          </p>
        )}
      </Card>

      {/* Quick actions */}
      <section className="home__actions" aria-label={t.homeQuickActions}>
        <h2 className="home__section-title home__actions-title">
          {t.homeQuickActions}
        </h2>

        <div className="home__actions-grid">
          <Card
            as="button"
            interactive
            padding="md"
            className="home__action"
            onClick={() => navigate("/scan")}
            aria-label={t.scanAria}
          >
            <span className="home__action-icon home__action-icon--primary">
              <ScanIcon />
            </span>
            <span className="home__action-body">
              <span className="home__action-title">{t.scanBtn}</span>
              <span className="home__action-desc">{t.scanBtnDescription}</span>
            </span>
            <ArrowIcon />
          </Card>

          <Card
            as="button"
            interactive
            padding="md"
            className="home__action"
            onClick={() => navigate("/history")}
            aria-label={t.historyAria}
          >
            <span className="home__action-icon home__action-icon--secondary">
              <HistoryIcon />
            </span>
            <span className="home__action-body">
              <span className="home__action-title">{t.historyBtn}</span>
              <span className="home__action-desc">
                {t.historyBtnDescription}
              </span>
            </span>
            <ArrowIcon />
          </Card>

          <Card
            as="button"
            interactive
            padding="md"
            className="home__action"
            onClick={() => navigate("/settings")}
            aria-label={t.settings}
          >
            <span className="home__action-icon home__action-icon--tertiary">
              <SettingsIcon />
            </span>
            <span className="home__action-body">
              <span className="home__action-title">{t.settings}</span>
              <span className="home__action-desc">{t.settingsDescription}</span>
            </span>
            <ArrowIcon />
          </Card>
        </div>
      </section>

      {/* Tips */}
      <section className="home__tips" aria-label={t.homeTipsTitle}>
        <h2 className="home__section-title">{t.homeTipsTitle}</h2>
        <ul className="home__tips-list">
          {tips.map((tip, i) => (
            <li key={i} className="home__tip">
              <span className="home__tip-bullet" aria-hidden="true">
                💡
              </span>
              <span className="home__tip-text">{tip}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
