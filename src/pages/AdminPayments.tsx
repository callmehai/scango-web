import { useCallback, useEffect, useRef, useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT, planLabel, formatVnd } from "../constants/uiText";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Field,
  Modal,
  Spinner,
  Textarea,
  useToast,
} from "../components/ui";
import type { BadgeVariant } from "../components/ui";
import Dropdown from "../components/Dropdown";
import Pagination from "../components/Pagination";
import { exportToExcel, fileStamp } from "../utils/exportExcel";
import { fetchAllPages } from "../utils/fetchAllPages";
import api from "../api/axios";

import "../styles/Admin.css";

interface AdminPayment {
  id: string;
  orderCode: string;
  userId: string;
  userEmail: string;
  userName: string;
  plan: string;
  amountVnd: number;
  status: string;
  bankRef: string | null;
  note: string | null;
  createdAt: string;
  paidAt: string | null;
  refundedAt: string | null;
  expiresAt: string;
}

const STATUSES = ["pending", "paid", "expired", "cancelled", "refunded"] as const;

export default function AdminPayments() {
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];
  const toast = useToast();

  const [items, setItems] = useState<AdminPayment[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [exporting, setExporting] = useState(false);

  const [confirm, setConfirm] = useState<{
    kind: "approve" | "reject";
    p: AdminPayment;
  } | null>(null);
  const [refundTarget, setRefundTarget] = useState<AdminPayment | null>(null);
  const [refundNote, setRefundNote] = useState("");

  const statusLabel = (s: string): string =>
    ({
      pending: t.payStatusPending,
      paid: t.payStatusPaid,
      expired: t.payStatusExpired,
      cancelled: t.payStatusCancelled,
      refunded: t.payStatusRefunded,
    })[s] ?? s;

  const statusVariant = (s: string): BadgeVariant =>
    ({
      pending: "warning",
      paid: "success",
      expired: "neutral",
      cancelled: "neutral",
      refunded: "primary",
    })[s] as BadgeVariant ?? "neutral";

  // Error text in a ref so a language switch doesn't change `load`'s identity
  // (which would refetch the list on every language toggle).
  const loadErrorRef = useRef(t.adminLoadError);
  useEffect(() => {
    loadErrorRef.current = t.adminLoadError;
  }, [t.adminLoadError]);

  // Fetch every matching order (the endpoint caps limit at 100) so paging and
  // Excel export cover the full filtered set. Payment volume is small.
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const all = await fetchAllPages<AdminPayment>((skip, limit) =>
        api
          .get<{ items: AdminPayment[]; total: number }>("/admin/payments", {
            params: {
              status: statusFilter === "all" ? undefined : statusFilter,
              skip,
              limit,
            },
          })
          .then((r) => r.data),
      );
      setItems(all);
    } catch {
      setError(loadErrorRef.current);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pagedItems = items.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Filter/page-size changes return to page 1.
  useEffect(() => {
    setPage(1);
  }, [statusFilter, pageSize]);

  const act = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    try {
      await fn();
      await load();
    } catch {
      toast.error(t.adminPayActionError);
    } finally {
      setBusyId(null);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    const { kind, p } = confirm;
    setConfirm(null);
    await act(p.id, () => api.post(`/admin/payments/${p.id}/${kind}`));
  };

  const runRefund = async () => {
    if (!refundTarget) return;
    const p = refundTarget;
    const note = refundNote.trim() || undefined;
    setRefundTarget(null);
    setRefundNote("");
    await act(p.id, () => api.post(`/admin/payments/${p.id}/refund`, { note }));
  };

  const fmtDate = (iso: string | null) =>
    iso ? new Date(iso).toLocaleString(systemLang === "vi" ? "vi-VN" : "en-US") : "—";

  // Exports the current filtered set (all pages). Amount stays a raw number so
  // Excel can sum it.
  const exportPayments = async () => {
    if (items.length === 0) {
      toast.error(t.adminExportEmpty);
      return;
    }
    setExporting(true);
    try {
      await exportToExcel<AdminPayment>({
        filename: `scango-payments-${fileStamp()}`,
        sheetName: "Payments",
        columns: [
          { header: t.adminPayColOrder, value: (p) => p.orderCode },
          { header: t.profileEmail, value: (p) => p.userEmail },
          { header: t.profileName, value: (p) => p.userName },
          { header: t.adminPayColPlan, value: (p) => planLabel(p.plan, t) },
          { header: t.adminPayColAmount, value: (p) => p.amountVnd },
          { header: t.adminPayColStatus, value: (p) => statusLabel(p.status) },
          { header: t.adminPayColCreated, value: (p) => fmtDate(p.createdAt) },
          { header: t.adminPayColPaid, value: (p) => fmtDate(p.paidAt) },
          { header: t.adminPayColNote, value: (p) => p.note ?? "" },
        ],
        rows: items,
      });
    } catch {
      toast.error(t.adminExportError);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="admin-page">
      {/* Filter */}
      <Card padding="md" className="admin-toolbar">
        <div className="admin-filters">
          <Field label={t.adminPayFilterStatus}>
            <Dropdown<string>
              value={statusFilter}
              onChange={setStatusFilter}
              ariaLabel={t.adminPayFilterStatus}
              options={[
                { value: "all", label: t.adminAll },
                ...STATUSES.map((s) => ({ value: s, label: statusLabel(s) })),
              ]}
            />
          </Field>
        </div>

        <div className="admin-toolbar__actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={exportPayments}
            loading={exporting}
            disabled={exporting || loading || items.length === 0}
            leftIcon={<span aria-hidden="true">⬇</span>}
          >
            {exporting ? t.adminExporting : t.adminExportExcel}
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="admin-state">
          <Spinner size="lg" label={t.adminPaymentsTitle} />
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={load} retryLabel={t.commonRetry} />
      ) : items.length === 0 ? (
        <EmptyState icon="💳" title={t.adminPayEmpty} />
      ) : (
        <Card padding="none" className="admin-table-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t.adminPayColOrder}</th>
                  <th>{t.adminPayColUser}</th>
                  <th>{t.adminPayColPlan}</th>
                  <th>{t.adminPayColAmount}</th>
                  <th>{t.adminPayColStatus}</th>
                  <th>{t.adminPayColCreated}</th>
                  <th>{t.adminPayColPaid}</th>
                  <th>{t.adminPayColNote}</th>
                  <th className="admin-table__actions-col">
                    {t.adminPayColActions}
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagedItems.map((p) => (
                  <tr key={p.id}>
                    <td data-label={t.adminPayColOrder}>
                      <code>{p.orderCode}</code>
                    </td>
                    <td data-label={t.adminPayColUser}>
                      <div className="admin-user">
                        <span className="admin-user__email">{p.userEmail}</span>
                        <span className="admin-user__name">{p.userName}</span>
                      </div>
                    </td>
                    <td data-label={t.adminPayColPlan}>{planLabel(p.plan, t)}</td>
                    <td data-label={t.adminPayColAmount}>
                      {formatVnd(p.amountVnd)}
                    </td>
                    <td data-label={t.adminPayColStatus}>
                      <Badge variant={statusVariant(p.status)} dot>
                        {statusLabel(p.status)}
                      </Badge>
                    </td>
                    <td data-label={t.adminPayColCreated}>{fmtDate(p.createdAt)}</td>
                    <td data-label={t.adminPayColPaid}>{fmtDate(p.paidAt)}</td>
                    <td data-label={t.adminPayColNote}>{p.note ?? "—"}</td>
                    <td
                      data-label={t.adminPayColActions}
                      className="admin-table__actions-col"
                    >
                      <div className="admin-actions">
                        {p.status === "pending" && (
                          <>
                            <Button
                              variant="subtle"
                              size="sm"
                              disabled={busyId === p.id}
                              loading={busyId === p.id}
                              onClick={() => setConfirm({ kind: "approve", p })}
                            >
                              {t.adminPayActionApprove}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              disabled={busyId === p.id}
                              onClick={() => setConfirm({ kind: "reject", p })}
                            >
                              {t.adminPayActionReject}
                            </Button>
                          </>
                        )}
                        {p.status === "paid" && (
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={busyId === p.id}
                            onClick={() => {
                              setRefundNote("");
                              setRefundTarget(p);
                            }}
                          >
                            {t.adminPayActionRefund}
                          </Button>
                        )}
                        {p.status !== "pending" && p.status !== "paid" && (
                          <span className="admin-actions__none">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pagination */}
      {!loading && !error && items.length > 0 && (
        <Pagination
          page={safePage}
          pageSize={pageSize}
          total={items.length}
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

      {/* Approve / reject confirmation */}
      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        title={
          confirm?.kind === "approve"
            ? t.adminPayActionApprove
            : t.adminPayActionReject
        }
        message={
          confirm?.kind === "approve"
            ? t.adminPayApproveConfirm
            : t.adminPayRejectConfirm
        }
        confirmLabel={
          confirm?.kind === "approve"
            ? t.adminPayActionApprove
            : t.adminPayActionReject
        }
        cancelLabel={t.cancelBtn}
        closeLabel={t.commonClose}
        tone={confirm?.kind === "approve" ? "primary" : "danger"}
      />

      {/* Refund — records the money-back, keeps the plan */}
      <Modal
        open={refundTarget !== null}
        onClose={() => setRefundTarget(null)}
        title={t.adminPayRefundTitle}
        closeLabel={t.commonClose}
        size="sm"
        footer={
          <>
            <Button variant="subtle" onClick={() => setRefundTarget(null)}>
              {t.cancelBtn}
            </Button>
            <Button variant="danger" onClick={runRefund}>
              {t.adminPayActionRefund}
            </Button>
          </>
        }
      >
        <p className="admin-refund-hint">{t.adminPayRefundHint}</p>
        <Textarea
          value={refundNote}
          onChange={(e) => setRefundNote(e.target.value)}
          placeholder={t.adminPayRefundNote}
          rows={3}
          maxLength={200}
        />
      </Modal>
    </div>
  );
}
