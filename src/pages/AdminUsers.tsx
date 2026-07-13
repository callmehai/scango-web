import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { useAuth } from "../hooks/useAuth";
import { UI_TEXT, planLabel } from "../constants/uiText";
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
  useToast,
} from "../components/ui";
import type { BadgeVariant } from "../components/ui";
import Dropdown from "../components/Dropdown";
import Pagination from "../components/Pagination";
import { exportToExcel, fileStamp } from "../utils/exportExcel";
import { fetchAllPages } from "../utils/fetchAllPages";
import api from "../api/axios";

type SortField =
  | "created"
  | "lastLogin"
  | "email"
  | "name"
  | "plan"
  | "status"
  | "role"
  | "convos"
  | "tokens";
type SortDir = "asc" | "desc";

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

interface PlanStat {
  code: string;
  name: string;
  priceVnd: number;
  count: number;
}

interface Metrics {
  totalUsers: number;
  totalConversations: number;
  aiCalls: number;
  estimatedGeminiCostUsd: number;
  planBreakdown?: PlanStat[];
}

export default function AdminUsers() {
  const { systemLang } = useSettings();
  const { user: me } = useAuth();
  const t = UI_TEXT[systemLang];
  const toast = useToast();
  // Only admins reach this page now (AdminRoute), so canManage is effectively
  // always true here — kept as a defensive guard around the mutation controls.
  const canManage = me?.role === "admin";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [plans, setPlans] = useState<{ code: string; name: string }[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortField>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [exporting, setExporting] = useState(false);

  // Sorting + search are done server-side (see loadUsers) so they stay correct
  // as the user list grows past one page. Only the role/plan filters are applied
  // client-side over the current page.
  const visibleUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          (roleFilter === "all" || u.role === roleFilter) &&
          (planFilter === "all" || u.plan === planFilter),
      ),
    [users, roleFilter, planFilter],
  );

  const totalPages = Math.max(1, Math.ceil(visibleUsers.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pagedUsers = useMemo(
    () => visibleUsers.slice((safePage - 1) * pageSize, safePage * pageSize),
    [visibleUsers, safePage, pageSize],
  );

  // Return to page 1 whenever the query/filters/sort/page-size change so the
  // user isn't stranded on a now-out-of-range page.
  useEffect(() => {
    setPage(1);
  }, [q, roleFilter, planFilter, sortBy, sortDir, pageSize]);

  // Fetch every matching row (the endpoint caps limit at 100) so filtering,
  // paging and Excel export all operate on the complete result set. The admin
  // user base is small, so pulling it all client-side is fine here.
  const loadUsers = useCallback(async () => {
    const items = await fetchAllPages<AdminUser>((skip, limit) =>
      api
        .get<{ items: AdminUser[]; total: number }>("/admin/users", {
          params: {
            q: q || undefined,
            skip,
            limit,
            sort: sortBy,
            order: sortDir,
          },
        })
        .then((r) => r.data),
    );
    setUsers(items);
  }, [q, sortBy, sortDir]);

  const loadMetrics = useCallback(async () => {
    const res = await api.get<Metrics>("/admin/metrics");
    setMetrics(res.data);
  }, []);

  // Keep the error text in a ref so switching language doesn't change `reload`'s
  // identity and trigger an unwanted user-list refetch.
  const loadErrorRef = useRef(t.adminLoadError);
  useEffect(() => {
    loadErrorRef.current = t.adminLoadError;
  }, [t.adminLoadError]);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    loadUsers()
      .catch(() => setError(loadErrorRef.current))
      .finally(() => setLoading(false));
  }, [loadUsers]);

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

  // Exports the current filtered set (all pages), not just the visible page.
  const exportUsers = async () => {
    if (visibleUsers.length === 0) {
      toast.error(t.adminExportEmpty);
      return;
    }
    setExporting(true);
    try {
      await exportToExcel<AdminUser>({
        filename: `scango-users-${fileStamp()}`,
        sheetName: "Users",
        columns: [
          { header: t.profileEmail, value: (u) => u.email },
          { header: t.profileName, value: (u) => u.name },
          { header: t.adminColRole, value: (u) => u.role },
          { header: t.adminColPlan, value: (u) => planLabel(u.plan, t) },
          {
            header: t.adminColVerified,
            value: (u) => (u.emailVerified ? "✓" : "✗"),
          },
          { header: t.adminColConvos, value: (u) => u.conversationCount },
          { header: t.adminColTokens, value: (u) => u.totalTokens },
          {
            header: t.profileQuotaScans,
            value: (u) => (u.limited ? `${u.scansUsed}/${u.scansLimit}` : "∞"),
          },
          {
            header: t.profileQuotaAsks,
            value: (u) => (u.limited ? `${u.asksUsed}/${u.asksLimit}` : "∞"),
          },
          { header: t.adminColStatus, value: (u) => u.status },
        ],
        rows: visibleUsers,
      });
    } catch {
      toast.error(t.adminExportError);
    } finally {
      setExporting(false);
    }
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
          value: `$${metrics.estimatedGeminiCostUsd.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
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

      {/* Subscribers per paid plan */}
      {metrics?.planBreakdown && (
        <div className="admin-plan-stats">
          <span className="admin-plan-stats__title">{t.adminPlanStatsTitle}</span>
          <div className="admin-plan-stats__grid">
            {metrics.planBreakdown
              .filter((p) => p.priceVnd > 0)
              .map((p) => (
                <Card key={p.code} padding="md" className="admin-plan-stat">
                  <span className="admin-plan-stat__count">{p.count}</span>
                  <span className="admin-plan-stat__name">
                    {planLabel(p.code, t)}
                  </span>
                </Card>
              ))}
          </div>
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
                ...plans.map((p) => ({ value: p.code, label: planLabel(p.code, t) })),
              ]}
            />
          </Field>

          <Field label={t.adminSortBy}>
            <div className="admin-sort">
              <Dropdown<string>
                value={sortBy}
                onChange={(v) => setSortBy(v as SortField)}
                ariaLabel={t.adminSortBy}
                options={[
                  { value: "created", label: t.adminSortCreated },
                  { value: "lastLogin", label: t.adminSortLastLogin },
                  { value: "email", label: t.adminSortEmail },
                  { value: "name", label: t.adminSortName },
                  { value: "plan", label: t.adminSortPlan },
                  { value: "status", label: t.adminSortStatus },
                  { value: "role", label: t.adminSortRole },
                  { value: "convos", label: t.adminSortConvos },
                  { value: "tokens", label: t.adminSortTokens },
                ]}
              />
              <Button
                variant="secondary"
                size="sm"
                className="admin-sort__dir"
                aria-label={sortDir === "desc" ? t.adminSortDesc : t.adminSortAsc}
                title={sortDir === "desc" ? t.adminSortDesc : t.adminSortAsc}
                onClick={() =>
                  setSortDir((d) => (d === "desc" ? "asc" : "desc"))
                }
              >
                {sortDir === "desc" ? "↓" : "↑"}
              </Button>
            </div>
          </Field>
        </div>

        <div className="admin-toolbar__actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={exportUsers}
            loading={exporting}
            disabled={exporting || loading || visibleUsers.length === 0}
            leftIcon={<span aria-hidden="true">⬇</span>}
          >
            {exporting ? t.adminExporting : t.adminExportExcel}
          </Button>
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
                  {canManage && (
                    <th className="admin-table__actions-col">
                      {t.adminColActions}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {pagedUsers.map((u) => (
                  <tr key={u.id}>
                    <td data-label={t.adminColUser}>
                      <div className="admin-user">
                        <span className="admin-user__email">{u.email}</span>
                        <span className="admin-user__name">{u.name}</span>
                      </div>
                    </td>
                    <td data-label={t.adminColRole}>
                      {!canManage || me?.id === u.id ? (
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
                      {canManage && plans.length > 0 ? (
                        <select
                          className="admin-select admin-select--sm"
                          value={u.plan}
                          disabled={busyId === u.id}
                          aria-label={t.adminColPlan}
                          onChange={(e) => changePlan(u, e.target.value)}
                        >
                          {plans.map((p) => (
                            <option key={p.code} value={p.code}>
                              {planLabel(p.code, t)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Badge variant={u.isPaid ? "primary" : "neutral"}>
                          {planLabel(u.plan, t)}
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
                    {canManage && (
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
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {!loading && !error && visibleUsers.length > 0 && (
        <Pagination
          page={safePage}
          pageSize={pageSize}
          total={visibleUsers.length}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          disabled={loading}
          labels={{
            nav: t.historyPaginationLabel,
            first: t.historyPaginationFirst,
            prev: t.historyPaginationPrev,
            next: t.historyPaginationNext,
            last: t.historyPaginationLast,
            perPage: t.historyPerPage,
            showing: t.historyShowingRange,
          }}
        />
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
