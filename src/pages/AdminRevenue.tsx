import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT, formatVnd } from "../constants/uiText";
import { Card, EmptyState, ErrorState, Field, Spinner } from "../components/ui";
import Dropdown from "../components/Dropdown";
import api from "../api/axios";

import "../styles/Admin.css";

interface RevenueDay {
  date: string; // yyyy-MM-dd (VN)
  revenueVnd: number;
  orderCount: number;
}

interface RevenueData {
  days: number;
  totalRevenue: number;
  totalOrders: number;
  refundedTotal: number;
  series: RevenueDay[];
}

const fmtAxis = (iso?: string) => {
  if (!iso) return "";
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};
const fmtCompact = (n: number) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${n}`;
};

export default function AdminRevenue() {
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];

  const [days, setDays] = useState(30);
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Error text in a ref so a language switch doesn't change `load`'s identity
  // (which would refetch + redraw the chart on every language toggle).
  const loadErrorRef = useRef(t.adminLoadError);
  useEffect(() => {
    loadErrorRef.current = t.adminLoadError;
  }, [t.adminLoadError]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<RevenueData>("/admin/payments/revenue", {
        params: { days },
      });
      setData(res.data);
    } catch {
      setError(loadErrorRef.current);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  const cards = data
    ? [
        { label: t.adminRevenueTotal, value: formatVnd(data.totalRevenue) },
        { label: t.adminRevenueOrders, value: data.totalOrders },
        { label: t.adminRevenueRefunded, value: formatVnd(data.refundedTotal) },
      ]
    : [];

  const peak = data ? Math.max(0, ...data.series.map((d) => d.revenueVnd)) : 0;

  return (
    <div className="admin-page">
      {/* Range selector */}
      <div className="revenue-toolbar">
        <Field label={t.adminRevenueRange}>
          <Dropdown<number>
            value={days}
            onChange={setDays}
            ariaLabel={t.adminRevenueRange}
            options={[
              { value: 7, label: t.adminRevenue7d },
              { value: 30, label: t.adminRevenue30d },
              { value: 90, label: t.adminRevenue90d },
            ]}
          />
        </Field>
      </div>

      {loading ? (
        <div className="admin-state">
          <Spinner size="lg" label={t.adminRevenueTitle} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} retryLabel={t.commonRetry} />
      ) : !data || data.totalOrders === 0 ? (
        <EmptyState icon="📈" title={t.adminRevenueEmpty} />
      ) : (
        <>
          <div className="admin-metrics">
            {cards.map((c) => (
              <Card key={c.label} padding="md" className="admin-metric">
                <span className="admin-metric__value">{c.value}</span>
                <span className="admin-metric__label">{c.label}</span>
              </Card>
            ))}
          </div>

          <Card padding="md" className="revenue-chart-card">
            <div className="revenue-chart-head">
              <span className="revenue-chart-title">{t.adminRevenueChartTitle}</span>
              <span className="revenue-chart-max">
                {t.adminRevenuePeak}: {formatVnd(peak)}
              </span>
            </div>

            <div className="revenue-chart-wrap">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={data.series}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="revBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border-light)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtAxis}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    minTickGap={24}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <YAxis
                    tickFormatter={fmtCompact}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    width={44}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-hover-subtle)" }}
                    formatter={(v) => [formatVnd(Number(v)), t.adminRevenueTotal]}
                    labelFormatter={(label) => fmtAxis(String(label))}
                    contentStyle={{
                      background: "var(--color-surface-raised)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    itemStyle={{ color: "var(--color-text)" }}
                    labelStyle={{ color: "var(--color-text-muted)" }}
                  />
                  <Bar
                    dataKey="revenueVnd"
                    fill="url(#revBar)"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <p className="revenue-note">{t.adminRevenueNote}</p>
          </Card>
        </>
      )}
    </div>
  );
}
