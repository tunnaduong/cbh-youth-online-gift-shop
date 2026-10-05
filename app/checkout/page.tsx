"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogIn, ShoppingCart } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import Spinner, { PageSpinner } from "../components/ui/Spinner";
import { btnOutline, btnPrimary, card, input, pageTitle, stagger } from "../lib/ui";
import PaymentMethodSelector, {
  type PaymentMethod,
} from "../components/PaymentMethodSelector";
import { useAuth } from "../contexts/AuthContext";
import { cartItemKey, cartItemPrice, useCart } from "../contexts/CartContext";
import { useStudentDiscount } from "../contexts/StudentDiscountContext";
import { getLoginUrl } from "../lib/auth";
import {
  cancelShopOrder,
  createShopOrder,
  getOrderPaymentStatus,
  variantLabel,
  type QrPayment,
  type ShopOrder,
} from "../lib/shop";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  points: "điểm hoạt động",
  qr: "chuyển khoản QR",
  cod: "thanh toán khi nhận hàng (COD)",
};

const SHIPPING_FEE = 15000;

export default function CheckoutPage() {
  const { loading, loggedIn } = useAuth();
  const { items, totalAmount, clear } = useCart();
  const { percent: studentDiscount, discounted } = useStudentDiscount();

  const discountedAmount = discounted(totalAmount);
  const grandTotal = discountedAmount + SHIPPING_FEE;

  const [shippingAddress, setShippingAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [order, setOrder] = useState<ShopOrder | null>(null);
  const [qrPayment, setQrPayment] = useState<QrPayment | null>(null);
  const [paid, setPaid] = useState(false);
  const [renewing, setRenewing] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll the same way the mobile wallet deposit screen polls its balance -
  // the SePay webhook confirms payment out-of-band (see
  // SEPayWebhookController::processShopOrderPayment), this just checks back
  // every few seconds until it lands.
  useEffect(() => {
    if (!order || order.payment_method !== "qr" || paid) return;

    pollRef.current = setInterval(async () => {
      try {
        const status = await getOrderPaymentStatus(order.id);
        if (status.payment_status === "paid") {
          setPaid(true);
          clear();
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // Best-effort polling - a transient failure just retries next tick.
      }
    }, 3000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order, paid]);

  const placeOrder = async (method: PaymentMethod) => {
    const res = await createShopOrder({
      items: items.map((i) => ({
        product_id: i.product.id,
        variant_id: i.variant?.id ?? null,
        quantity: i.quantity,
      })),
      shipping_address: shippingAddress.trim(),
      phone: phone.trim(),
      note: note.trim() || undefined,
      payment_method: method,
    });
    setOrder(res.order);
    if (method === "qr" && res.payment) {
      setQrPayment(res.payment);
    } else {
      // points: already deducted+paid server-side. cod: accepted, paid on
      // delivery. Either way there's nothing left to wait on.
      setPaid(true);
      clear();
    }
  };

  const handleConfirm = async (method: PaymentMethod) => {
    if (!shippingAddress.trim() || !phone.trim()) {
      setFormError("Vui lòng nhập địa chỉ giao hàng và số điện thoại.");
      return;
    }
    if (!/^\d{9,11}$/.test(phone)) {
      setFormError("Số điện thoại chỉ gồm 9-11 chữ số.");
      return;
    }
    setFormError(null);
    setSubmitting(true);
    try {
      await placeOrder(method);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Không thể tạo đơn hàng.");
    } finally {
      setSubmitting(false);
    }
  };

  // Each transfer gets its own QR (payment_code embeds a fresh timestamp,
  // same "MW<id><timestamp>" pattern the main site's wallet deposit page
  // uses) rather than one QR reused indefinitely - same as that page's own
  // "Tạo mã mới" button: cancel the stale pending order (releases its
  // reserved stock) and place a brand new one to get a fresh code.
  const handleRenewQr = async () => {
    if (!order) return;
    setRenewing(true);
    try {
      await cancelShopOrder(order.id);
      // placeOrder's own setOrder/setQrPayment overwrite the cancelled
      // order in one go - no intermediate null state, so the QR view stays
      // up (with its "Đang tạo mã mới..." button) instead of flashing back
      // to the cart/form for a moment.
      await placeOrder("qr");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Không thể tạo mã QR mới.");
    } finally {
      setRenewing(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-[640px] px-3 pb-8 pt-5 sm:px-4 lg:pt-7">
      <h1 className={`${pageTitle} mb-5`}>Thanh toán</h1>

      {loading ? (
        <PageSpinner />
      ) : !loggedIn ? (
        <EmptyState icon={LogIn} title="Đăng nhập để tiếp tục thanh toán đơn hàng.">
          <a href={getLoginUrl()} className={`${btnPrimary} h-11 px-6`}>
            Đăng nhập để tiếp tục
          </a>
        </EmptyState>
      ) : order && paid ? (
        <div className={`${card} flex animate-fade-up flex-col items-center gap-3 p-8 text-center sm:p-10`}>
          {/* The tick pops in, then draws itself. */}
          <span className="flex h-16 w-16 animate-check-pop items-center justify-center rounded-full bg-primary-500 shadow-glow">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden>
              <path
                d="M5 12.5l4.5 4.5L19 7.5"
                stroke="#fff"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="check-draw"
              />
            </svg>
          </span>
          <h2 className="mt-1 text-lg font-bold text-gray-900">
            Đặt hàng thành công
          </h2>
          <p className="text-sm text-gray-500">
            Đơn #{order.id} đã được ghi nhận, thanh toán bằng{" "}
            {METHOD_LABEL[order.payment_method]}.
          </p>
          <div className="mt-2 flex w-full flex-col gap-2 sm:flex-row">
            <Link href="/orders" className={`${btnOutline} h-11 flex-1`}>
              Xem đơn hàng của tôi
            </Link>
            <Link href="/" className={`${btnPrimary} h-11 flex-1`}>
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      ) : order && qrPayment ? (
        <div className={`${card} flex animate-fade-up flex-col items-center gap-3 p-5`}>
          {formError && (
            <p className="w-full animate-slide-down rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-500">
              {formError}
            </p>
          )}
          {/* Keyed by the code: a renewed QR pops in as a new image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={qrPayment.payment_code}
            src={qrPayment.qr_url}
            alt="Mã QR thanh toán"
            className="h-56 w-56 animate-pop-in rounded-xl border border-card-border bg-white p-1"
          />
          <div className="w-full text-sm">
            <Row label="Ngân hàng" value={qrPayment.bank_name} />
            <Row label="Số tài khoản" value={qrPayment.bank_account} />
            <Row label="Chủ tài khoản" value={qrPayment.bank_account_holder} />
            <Row label="Số tiền" value={`${qrPayment.amount_vnd.toLocaleString("vi-VN")}đ`} />
            <Row label="Nội dung" value={qrPayment.payment_code} />
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <Spinner className="h-3.5 w-3.5" />
            Đang chờ xác nhận chuyển khoản...
          </div>
          <button
            type="button"
            onClick={handleRenewQr}
            disabled={renewing}
            className="mt-1 text-xs font-semibold text-brand hover:text-brand-strong disabled:text-gray-300"
          >
            {renewing ? "Đang tạo mã mới..." : "Tạo mã QR mới"}
          </button>
        </div>
      ) : (
        <div className="stagger flex flex-col gap-5">
          <div className={`${card} p-4 sm:p-5`}>
            <h2 className="mb-3 text-[15px] font-semibold text-gray-900">
              Đơn hàng
            </h2>
            {items.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <ShoppingCart className="h-4 w-4 text-gray-400" />
                Giỏ hàng đang trống.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <div
                    key={cartItemKey(item)}
                    className="flex items-start justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 text-gray-700">
                      {item.product.name}
                      {item.variant && (
                        <span className="text-gray-400"> ({variantLabel(item.variant, item.product.options)})</span>
                      )}{" "}
                      <span className="text-gray-400">x{item.quantity}</span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums text-gray-900">
                      {(cartItemPrice(item) * item.quantity).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="my-3 border-t border-gray-100" />
            {studentDiscount > 0 && (
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">Tạm tính</span>
                <span className="font-medium tabular-nums text-gray-900">{totalAmount.toLocaleString("vi-VN")}đ</span>
              </div>
            )}
            {studentDiscount > 0 && (
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-brand">Giảm giá học sinh ({studentDiscount}%)</span>
                <span className="font-medium tabular-nums text-brand">-{(totalAmount - discountedAmount).toLocaleString("vi-VN")}đ</span>
              </div>
            )}
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-gray-500">Phí vận chuyển</span>
              <span className="font-medium tabular-nums text-gray-900">{SHIPPING_FEE.toLocaleString("vi-VN")}đ</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-700">
                Tổng cộng
              </span>
              <span className="text-lg font-extrabold tabular-nums text-brand">
                {grandTotal.toLocaleString("vi-VN")}đ
              </span>
            </div>
          </div>

          {items.length > 0 && (
            <>
              <div className={`${card} p-4 sm:p-5`} style={stagger(1)}>
                <h2 className="mb-3 text-[15px] font-semibold text-gray-900">
                  Thông tin giao hàng
                </h2>
                <div className="flex flex-col gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-medium text-gray-700">Địa chỉ giao hàng</span>
                    <input
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Số nhà, đường, phường/xã, tỉnh/thành"
                      autoComplete="street-address"
                      className={`${input} h-11`}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-medium text-gray-700">Số điện thoại</span>
                    <input
                      value={phone}
                      // Digits only: anything else typed or pasted (spaces,
                      // dots, "+84"...) is dropped as it comes in.
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      placeholder="Số điện thoại nhận hàng"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={11}
                      autoComplete="tel"
                      className={`${input} h-11`}
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[13px] font-medium text-gray-700">
                      Ghi chú <span className="font-normal text-gray-400">(không bắt buộc)</span>
                    </span>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Lời nhắn cho shop"
                      rows={2}
                      className={`${input} resize-none py-2.5`}
                    />
                  </label>
                </div>
              </div>

              <div style={stagger(2)}>
                <h2 className="mb-3 text-[15px] font-semibold text-gray-900">
                  Phương thức thanh toán
                </h2>
                {formError && (
                  <p className="mb-3 animate-slide-down rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-500">
                    {formError}
                  </p>
                )}
                <PaymentMethodSelector
                  amountVnd={grandTotal}
                  onConfirm={handleConfirm}
                  confirming={submitting}
                />
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-2 last:border-0">
      <span className="shrink-0 text-gray-500">{label}</span>
      <span className="min-w-0 break-words text-right font-semibold text-gray-900">{value}</span>
    </div>
  );
}
