import { useCallback, useEffect, useMemo, useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../hooks/useAuth";
import { UI_TEXT } from "../constants/uiText";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Spinner,
} from "../components/ui";
import type { BadgeVariant } from "../components/ui";
import Dropdown from "../components/Dropdown";
import api from "../api/axios";

type SortBy = "email" | "tokens" | "convos";

import "../styles/Admin.css";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  plan: string;
  status: string;
  emailVerified: boolean;
  isPaid: boolean;
  conversationCount: number;
  totalTokens: number;
  limited: boolean;
  scansUsed: number;
  scansLimit: number;
  asksUsed: number;
  asksLimit: number;
}

interface Metrics {
  totalUsers: number;
  totalConversations: number;
  aiCalls: number;
  estimatedGeminiCostUsd: number;
}

export default function AdminUsers() {
  const { systemLang } = useSettings();
  const { user: me } = useAuth();
  const t = UI_TEXT[systemLang];

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [plans, setPlans] = useState<{ code: string; name: string }[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortBy>("email");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter + sort happen client-side over the fetched page (server still does
  // the text search via `q`). Keeps the table usable as the user list grows.
  const visibleUsers = useMemo(() => {
    const filtered = users.filter(
      (u) =>
        (roleFilter === "all" || u.role === roleFilter) &&
        (planFilter === "all" || u.plan === planFilter),
    );
    return [...filtered].sort((a, b) => {
      if (sortBy === "tokens") return b.totalTokens - a.totalTokens;
      if (sortBy === "convos") return b.conversationCount - a.conversationCount;
      return a.email.localeCompare(b.email);
    });
  }, [users, roleFilter, planFilter, sortBy]);

  const loadUsers = useCallback(async () => {
    const res = await api.get<{ items: AdminUser[] }>("/admin/users", {
      params: { q: q || undefined, limit: 100 },
    });
    setUsers(res.data.items);
  }, [q]);

  const loadMetrics = useCallback(async () => {
    const res = await api.get<Metrics>("/admin/metrics");
    setMetrics(res.data);
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    loadUsers()
      .catch(() => setError(t.adminLoadError))
      .finally(() => setLoading(false));
  }, [loadUsers, t.adminLoadError]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    loadMetrics().catch(() => {});
  }, [loadMetrics]);

  useEffect(() => {
    api
      .get<{ code: string; name: string }[]>("/admin/plans")
      .then((res) => setPlans(res.data))
      .catch(() => {});
  }, []);

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    try {
      await fn();
      await Promise.all([loadUsers(), loadMetrics()]);
    } finally {
      setBusyId(null);
    }
  };

  const resetQuota = (u: AdminUser) =>
    act(u.id, () => api.post(`/admin/users/${u.id}/reset-quota`));

  const changeRole = (u: AdminUser, role: string) =>
    act(u.id, () => api.patch(`/admin/users/${u.id}/role`, { role }));

  const changePlan = (u: AdminUser, plan: string) =>
    act(u.id, () => api.patch(`/admin/users/${u.id}/plan`, { plan }));

  const toggleSuspend = (u: AdminUser) =>
    act(u.id, () =>
      u.status === "suspended"
        ? api.post(`/admin/users/${u.id}/unsuspend`)
        : api.post(`/admin/users/${u.id}/suspend`),
    );

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    await act(id, () => api.delete(`/admin/users/${id}`));
    setDeleteTarget(null);
  };

  const statusVariant = (status: string): BadgeVariant =>
    status === "suspended" ? "danger" : "success";

  const metricCards: { label: string; value: string | number }[] = metrics
    ? [
        { label: t.adminMetricUsers, value: metrics.totalUsers },
        { label: t.adminMetricConvos, value: metrics.totalConversations },
        { label: t.adminMetricCalls, value: metrics.aiCalls },
        {
          label: t.adminMetricCost,
          value: `$${metrics.estimatedGeminiCostUsd}`,
        },
      ]
    : [];

  return (
    <div className="admin-page">
      {/* Metrics */}
      {metrics && (
        <div className="admin-metrics">
          {metricCards.map((m) => (
            <Card key={m.label} padding="md" className="admin-metric">
              <span className="admin-metric__value">{m.value}</span>
              <span className="admin-metric__label">{m.label}</span>
            </Card>
          ))}
        </div>
      )}

      {/* Search + filters */}
      <Card padding="md" className="admin-toolbar">
        <Field label={t.adminSearchUser} htmlFor="admin-user-search">
          <Input
            id="admin-user-search"
            type="search"
            placeholder={t.adminSearchUser}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            leftIcon={<span aria-hidden="true">🔍</span>}
          />
        </Field>

        <div className="admin-filters">
          <Field label={t.adminFilterRole}>
            <Dropdown<string>
              value={roleFilter}
              onChange={setRoleFilter}
              ariaLabel={t.adminFilterRole}
              options={[
                { value: "all", label: t.adminAll },
                { value: "user", label: "user" },
                { value: "admin", label: "admin" },
                { value: "tester", label: "tester" },
              ]}
            />
          </Field>

          <Field label={t.adminFilterPlan}>
            <Dropdown<string>
              value={planFilter}
              onChange={setPlanFilter}
              ariaLabel={t.adminFilterPlan}
              options={[
                { value: "all", label: t.adminAll },
                ...plans.map((p) => ({ value: p.code, label: p.name })),
              ]}
            />
          </Field>

          <Field label={t.adminSortBy}>
            <Dropdown<string>
              value={sortBy}
              onChange={(v) => setSortBy(v as SortBy)}
              ariaLabel={t.adminSortBy}
              options={[
                { value: "email", label: t.adminSortEmail },
                { value: "tokens", label: t.adminSortTokens },
                { value: "convos", label: t.adminSortConvos },
              ]}
            />
          </Field>
        </div>
      </Card>

      {/* Content states */}
      {loading ? (
        <div className="admin-state">
          <Spinner size="lg" label={t.adminUsersTitle} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={reload} retryLabel={t.commonRetry} />
      ) : visibleUsers.length === 0 ? (
        <EmptyState icon="🔍" title={t.adminUsersEmpty} />
      ) : (
        <Card padding="none" className="admin-table-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t.adminColUser}</th>
                  <th>{t.adminColRole}</th>
                  <th>{t.adminColPlan}</th>
                  <th>{t.adminColVerified}</th>
                  <th>{t.adminColConvos}</th>
                  <th>{t.adminColTokens}</th>
                  <th>{t.adminColQuota}</th>
                  <th>{t.adminColStatus}</th>
                  <th className="admin-table__actions-col">
                    {t.adminColActions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleUsers.map((u) => (
                  <tr key={u.id}>
                    <td data-label={t.adminColUser}>
                      <div className="admin-user">
                        <span className="admin-user__email">{u.email}</span>
                        <span className="admin-user__name">{u.name}</span>
                      </div>
                    </td>
                    <td data-label={t.adminColRole}>
                      {me?.id === u.id ? (
                        <Badge variant="primary">{u.role}</Badge>
                      ) : (
                        <select
                          className="admin-select admin-select--sm"
                          value={u.role}
                          disabled={busyId === u.id}
                          aria-label={t.adminColRole}
                          onChange={(e) => changeRole(u, e.target.value)}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                          <option value="tester">tester</option>
                        </select>
                      )}
                    </td>
                    <td data-label={t.adminColPlan}>
                      {plans.length > 0 ? (
                        <select
                          className="admin-select admin-select--sm"
                          value={u.plan}
                          disabled={busyId === u.id}
                          aria-label={t.adminColPlan}
                          onChange={(e) => changePlan(u, e.target.value)}
                        >
                          {plans.map((p) => (
                            <option key={p.code} value={p.code}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant={u.isPaid ? "primary" : "neutral"}>
                          {u.plan}
                        </Badge>
                      )}
                    </td>
                    <td data-label={t.adminColVerified}>
                      {u.emailVerified ? (
                        <span className="admin-ok" aria-label="verified">
                          ✓
                        </span>
                      ) : (
                        <span className="admin-no" aria-label="unverified">
                          ✗
                        </span>
                      )}
                    </td>
                    <td data-label={t.adminColConvos}>{u.conversationCount}</td>
                    <td data-label={t.adminColTokens}>
                      {u.totalTokens.toLocaleString()}
                    </td>
                    <td data-label={t.adminColQuota}>
                      {u.limited
                        ? `${u.scansUsed}/${u.scansLimit} · ${u.asksUsed}/${u.asksLimit}`
                        : "∞"}
                    </td>
                    <td data-label={t.adminColStatus}>
                      <Badge variant={statusVariant(u.status)} dot>
                        {u.status}
                      </Badge>
                    </td>
                    <td
                      data-label={t.adminColActions}
                      className="admin-table__actions-col"
                    >
                      <div className="admin-actions">
                        <Button
                          variant="subtle"
                          size="sm"
                          disabled={busyId === u.id}
                          loading={busyId === u.id}
                          onClick={() => resetQuota(u)}
                        >
                          {t.adminActionReset}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={busyId === u.id || me?.id === u.id}
                          title={me?.id === u.id ? t.adminSelfDisabled : undefined}
                          onClick={() => toggleSuspend(u)}
                        >
                          {u.status === "suspended"
                            ? t.adminActionUnsuspend
                            : t.adminActionSuspend}
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          disabled={busyId === u.id || me?.id === u.id}
                          title={me?.id === u.id ? t.adminSelfDisabled : undefined}
                          onClick={() => setDeleteTarget(u)}
                        >
                          {t.adminActionDelete}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title={
          deleteTarget
            ? `${t.adminActionDelete}: ${deleteTarget.email}`
            : t.adminActionDelete
        }
        message={t.adminDeleteConfirm}
        confirmLabel={t.adminActionDelete}
        cancelLabel={t.cancelBtn}
        closeLabel={t.commonClose}
        tone="danger"
      />
    </div>
  );
}
