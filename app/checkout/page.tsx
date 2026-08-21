"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Header from "../components/Header";
import PaymentMethodSelector, {
  type PaymentMethod,
} from "../components/PaymentMethodSelector";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { getLoginUrl } from "../lib/auth";
import {
  cancelShopOrder,
  createShopOrder,
  getOrderPaymentStatus,
  type QrPayment,
  type ShopOrder,
} from "../lib/shop";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  points: "điểm hoạt động",
  qr: "chuyển khoản QR",
  cod: "thanh toán khi nhận hàng (COD)",
};

export default function CheckoutPage() {
  const { loading, loggedIn } = useAuth();
  const { items, totalAmount, clear } = useCart();

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
      items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
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
    <>
      <Header />
      <main className="mx-auto w-full max-w-[640px] px-6 py-8">
        <h1 className="mb-6 text-2xl font-extrabold text-slate-800">
          Thanh toán
        </h1>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-green-600" />
          </div>
        ) : !loggedIn ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">
              Đăng nhập để tiếp tục thanh toán đơn hàng.
            </p>
            <a
              href={getLoginUrl()}
              className="mt-1 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
            >
              Đăng nhập để tiếp tục
            </a>
          </div>
        ) : order && paid ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <h2 className="text-lg font-bold text-slate-800">
              Đặt hàng thành công
            </h2>
            <p className="text-sm text-slate-500">
              Đơn #{order.id} đã được ghi nhận, thanh toán bằng{" "}
              {METHOD_LABEL[order.payment_method]}.
            </p>
          </div>
        ) : order && qrPayment ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5">
            {formError && (
              <p className="text-sm font-medium text-red-500">{formError}</p>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrPayment.qr_url}
              alt="Mã QR thanh toán"
              className="h-56 w-56 rounded-xl"
            />
            <div className="w-full space-y-1.5 text-sm">
              <Row label="Ngân hàng" value={qrPayment.bank_name} />
              <Row label="Số tài khoản" value={qrPayment.bank_account} />
              <Row label="Chủ tài khoản" value={qrPayment.bank_account_holder} />
              <Row label="Số tiền" value={`${qrPayment.amount_vnd.toLocaleString("vi-VN")}đ`} />
              <Row label="Nội dung" value={qrPayment.payment_code} />
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-200 border-t-green-600" />
              Đang chờ xác nhận chuyển khoản...
            </div>
            <button
              type="button"
              onClick={handleRenewQr}
              disabled={renewing}
              className="mt-1 text-xs font-semibold text-green-600 hover:text-green-700 disabled:text-slate-300"
            >
              {renewing ? "Đang tạo mã mới..." : "Tạo mã QR mới"}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-bold text-slate-800">
                Đơn hàng
              </h2>
              {items.length === 0 ? (
                <p className="text-sm text-slate-400">Giỏ hàng đang trống.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {items.map(({ product, quantity }) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-600">
                        {product.name} <span className="text-slate-400">x{quantity}</span>
                      </span>
                      <span className="font-medium text-slate-800">
                        {(product.price * quantity).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="my-3 border-t border-slate-100" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">
                  Tổng cộng
                </span>
                <span className="text-base font-extrabold text-green-600">
                  {totalAmount.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            {items.length > 0 && (
              <>
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
                  <h2 className="mb-3 text-sm font-bold text-slate-800">
                    Thông tin giao hàng
                  </h2>
                  <div className="flex flex-col gap-3">
                    <input
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Địa chỉ giao hàng"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-green-600/50"
                    />
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Số điện thoại"
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-green-600/50"
                    />
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ghi chú (không bắt buộc)"
                      rows={2}
                      className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-green-600/50"
                    />
                  </div>
                </div>

                <h2 className="mb-3 text-sm font-bold text-slate-800">
                  Phương thức thanh toán
                </h2>
                {formError && (
                  <p className="mb-3 text-sm font-medium text-red-500">{formError}</p>
                )}
                <PaymentMethodSelector
                  amountVnd={totalAmount}
                  onConfirm={handleConfirm}
                  confirming={submitting}
                />
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-1.5 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}
