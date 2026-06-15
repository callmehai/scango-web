import { useCallback, useEffect, useRef, useState } from "react";
import { useSettings } from "../hooks/useSettings";
import { UI_TEXT, formatVnd } from "../constants/uiText";
import { Button, Modal, Spinner, useToast } from "./ui";
import api from "../api/axios";
import "../styles/Checkout.css";

interface OrderView {
  id: string;
  orderCode: string;
  plan: string;
  amountVnd: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  paidAt: string | null;
  transferContent: string;
  qrImageUrl: string;
  bankName: string;
  accountNo: string;
  accountHolder: string;
}

interface CheckoutModalProps {
  open: boolean;
  /** Plan code to buy; the modal creates an order when set + open. */
  plan: string | null;
  planName: string;
  onClose: () => void;
  /** Called once payment is confirmed so the parent can refresh the user/plan. */
  onPaid: () => void;
}

const POLL_MS = 4000;
// Show the success state briefly before handing control back to the parent.
const SUCCESS_HOLD_MS = 1800;
// Highlight the countdown once it drops under this, so users feel the urgency.
const URGENT_SECONDS = 60;

export default function CheckoutModal({
  open,
  plan,
  planName,
  onClose,
  onPaid,
}: CheckoutModalProps) {
  const { systemLang } = useSettings();
  const t = UI_TEXT[systemLang];
  const toast = useToast();

  const [order, setOrder] = useState<OrderView | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [remaining, setRemaining] = useState(0); // seconds until expiry
  const [qrFailed, setQrFailed] = useState(false);

  const secondsLeft = (iso: string) =>
    Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));

  const createOrder = useCallback(async () => {
    if (!plan) return;
    setLoading(true);
    setError(null);
    setOrder(null);
    setQrFailed(false);
    try {
      const res = await api.post<OrderView>("/payments/orders", { plan });
      setOrder(res.data);
      setRemaining(secondsLeft(res.data.expiresAt));
    } catch (e) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      setError(status === 503 ? t.checkoutNotConfigured : t.checkoutCreateError);
    } finally {
      setLoading(false);
    }
  }, [plan, t.checkoutCreateError, t.checkoutNotConfigured]);

  // Create an order when the modal opens; reset everything when it closes.
  useEffect(() => {
    if (open && plan) {
      createOrder();
    } else if (!open) {
      setOrder(null);
      setError(null);
      setCopied(false);
      setQrFailed(false);
    }
  }, [open, plan, createOrder]);

  // Poll status on a stable interval. Refs keep callbacks/order fresh without
  // re-arming the timer on every parent re-render (which would reset the clock).
  const orderRef = useRef<OrderView | null>(null);
  const onPaidRef = useRef(onPaid);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    orderRef.current = order;
    onPaidRef.current = onPaid;
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(async () => {
      const cur = orderRef.current;
      // Keep polling as long as the server says "pending" — this deliberately
      // continues past the client-side countdown so a bank confirmation that
      // lands a little late still flips the order to "paid".
      if (!cur || cur.status !== "pending") return;
      try {
        const res = await api.get<OrderView>(`/payments/orders/${cur.id}`);
        if (res.data.status !== cur.status) setOrder(res.data);
      } catch {
        /* transient network error — keep polling */
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [open]);

  // On success: refresh the parent immediately, then hold the success screen a
  // beat so the user actually sees the confirmation before the modal closes.
  useEffect(() => {
    if (order?.status !== "paid") return;
    toast.success(t.checkoutPaidToast);
    onPaidRef.current();
    const id = setTimeout(() => onCloseRef.current(), SUCCESS_HOLD_MS);
    return () => clearTimeout(id);
  }, [order?.status, toast, t.checkoutPaidToast]);

  // Countdown tick.
  useEffect(() => {
    if (!order) return;
    const tick = () => setRemaining(secondsLeft(order.expiresAt));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [order]);

  const copyContent = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.transferContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — user can select manually */
    }
  };

  const mmss = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const status = order?.status;
  const paid = status === "paid";
  const serverExpired = status === "expired" || status === "cancelled";
  const countdownDone = remaining <= 0;
  // Client clock hit zero but the server still says "pending": the transfer may
  // be in flight (the backend honors slightly-late payments), so show a soft
  // "verifying" state — NEVER a hard "expired" — until the server expires it.
  const verifying = !!order && !paid && !serverExpired && countdownDone;
  const urgent = !countdownDone && remaining <= URGENT_SECONDS;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${t.checkoutTitle}: ${planName}`}
      closeLabel={t.commonClose}
      size="md"
    >
      {loading ? (
        <div className="checkout__state">
          <Spinner size="lg" label={t.checkoutCreating} />
          <p className="checkout__hint">{t.checkoutCreating}</p>
        </div>
      ) : error ? (
        <div className="checkout__state">
          <p className="checkout__error">{error}</p>
          <Button variant="secondary" onClick={createOrder}>
            {t.checkoutRetry}
          </Button>
        </div>
      ) : !order ? null : paid ? (
        <div className="checkout__state checkout__success">
          <span className="checkout__success-icon" aria-hidden="true">
            ✓
          </span>
          <p className="checkout__success-title">{t.checkoutSuccess}</p>
          <p className="checkout__hint">{t.checkoutSuccessHint}</p>
        </div>
      ) : serverExpired ? (
        <div className="checkout__state">
          <p className="checkout__error">{t.checkoutExpired}</p>
          <p className="checkout__hint">{t.checkoutExpiredHint}</p>
          <Button variant="primary" onClick={createOrder}>
            {t.checkoutRetry}
          </Button>
        </div>
      ) : verifying ? (
        <div className="checkout__state">
          <Spinner size="lg" label={t.checkoutVerifying} />
          <p className="checkout__verifying-title">{t.checkoutVerifying}</p>
          <p className="checkout__hint">{t.checkoutVerifyingHint}</p>
          <Button variant="subtle" size="sm" onClick={createOrder}>
            {t.checkoutRetry}
          </Button>
        </div>
      ) : (
        <div className="checkout">
          <p className="checkout__instruction">{t.checkoutScanQr}</p>

          <div className="checkout__qr">
            {qrFailed ? (
              <div className="checkout__qr-fallback">
                <span className="checkout__qr-fallback-icon" aria-hidden="true">
                  ⚠️
                </span>
                <span className="checkout__qr-fallback-text">
                  {t.checkoutQrFailed}
                </span>
              </div>
            ) : (
              <img
                src={order.qrImageUrl}
                alt="VietQR"
                width={340}
                height={340}
                onError={() => setQrFailed(true)}
              />
            )}
          </div>

          <div className="checkout__amount-hero">
            <span className="checkout__amount-label">{t.checkoutAmount}</span>
            <span className="checkout__amount-value">
              {formatVnd(order.amountVnd)}
            </span>
          </div>

          {/* Trust anchor — show who the money goes to even when the QR loads,
              so users aren't transferring "into the void". */}
          <div className="checkout__payto">
            <span className="checkout__payto-label">{t.checkoutPayTo}</span>
            <span className="checkout__payto-value">{order.accountHolder}</span>
          </div>

          {/* Full bank details only as a fallback when the QR fails to load. */}
          {qrFailed && (
            <dl className="checkout__info">
              <div>
                <dt>{t.checkoutBank}</dt>
                <dd>{order.bankName}</dd>
              </div>
              <div>
                <dt>{t.checkoutAccountNo}</dt>
                <dd>{order.accountNo}</dd>
              </div>
              <div>
                <dt>{t.checkoutAccountHolder}</dt>
                <dd>{order.accountHolder}</dd>
              </div>
            </dl>
          )}

          <div className="checkout__content">
            <span className="checkout__content-label">{t.checkoutContent}</span>
            <div className="checkout__content-row">
              <code className="checkout__content-code">
                {order.transferContent}
              </code>
              <Button variant="subtle" size="sm" onClick={copyContent}>
                {copied ? t.checkoutCopied : t.checkoutCopy}
              </Button>
            </div>
            <p className="checkout__warn">⚠️ {t.checkoutContentWarn}</p>
          </div>

          <p className="checkout__secure">🔒 {t.checkoutSecure}</p>

          <div className="checkout__waiting">
            <span className="checkout__pulse" aria-hidden="true" />
            <span className="checkout__waiting-text">{t.checkoutWaiting}</span>
            <span
              className={`checkout__timer${urgent ? " checkout__timer--urgent" : ""}`}
            >
              ⏳ {mmss(remaining)}
            </span>
          </div>
          <p className="checkout__hint">{t.checkoutWaitingHint}</p>
        </div>
      )}
    </Modal>
  );
}
