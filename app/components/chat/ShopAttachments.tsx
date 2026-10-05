"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, CircleAlert, MapPin, Phone, ReceiptText, User } from "lucide-react";
import LocationPicker, { type LatLng } from "../LocationPicker";
import ProductThumb from "../ProductThumb";
import Spinner from "../ui/Spinner";
import type { ChatOrderDraft, ChatPayment, ChatProductImage, ShopMessageMetadata } from "../../lib/chat";
import { confirmChatOrder, getOrderPaymentStatus, type QrPayment } from "../../lib/shop";

// What the shop AI can attach to an answer (see GenerateAiChatReply on the
// API): product photos, an order slip to confirm, or a QR to pay. The model
// only names ids - every photo, price and bank detail here was filled in by
// the API from the shop's own data.

const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

const METHOD_LABEL: Record<ChatOrderDraft["payment_method"], string> = {
  points: "Điểm hoạt động",
  qr: "Chuyển khoản QR",
  cod: "Thanh toán khi nhận hàng (COD)",
};

const PAYMENT_POLL_MS = 4000;

const cardBox = "w-[250px] max-w-full overflow-hidden rounded-2xl border border-card-border bg-surface shadow-card";

export default function ShopAttachments({
  messageId,
  metadata,
}: {
  messageId: number;
  metadata: ShopMessageMetadata;
}) {
  const images = Array.isArray(metadata.shop_images) ? metadata.shop_images : [];
  const draft = metadata.shop_order_draft;
  const payment = metadata.shop_payment;

  if (images.length === 0 && !draft && !payment) return null;

  return (
    <div className="flex flex-col gap-2">
      {images.map((image) => (
        <ProductImageCard key={`${image.product_id}:${image.variant_id ?? 0}`} image={image} />
      ))}
      {draft && Array.isArray(draft.items) && <OrderDraftCard messageId={messageId} draft={draft} />}
      {payment && payment.qr_url && <PaymentCard orderId={payment.order_id} initial={payment} />}
    </div>
  );
}

/** A product photo with its name and price; the whole card opens the product page. */
function ProductImageCard({ image }: { image: ChatProductImage }) {
  return (
    <Link
      href={`/product/${image.product_id}`}
      className={`${cardBox} group block transition duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lift`}
    >
      <ProductThumb imageUrl={image.image_url} alt={image.name} className="aspect-square w-full" zoom />
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors group-hover:text-brand-strong">
          {image.name}
        </p>
        {image.variant_label && <p className="mt-0.5 truncate text-xs text-gray-500">{image.variant_label}</p>}
        <p className="mt-1 text-sm font-bold text-brand">{vnd(image.price)}</p>
      </div>
    </Link>
  );
}

/**
 * The order slip. Nothing is ordered until "Xác nhận đặt hàng" is pressed;
 * after that the slip shows the order number and, for a bank transfer, the
 * QR to pay with (and turns to "paid" by itself once the transfer lands).
 */
function OrderDraftCard({ messageId, draft }: { messageId: number; draft: ChatOrderDraft }) {
  // The poll brings `order_id` back with the message; until it does, this
  // remembers the order just placed from here.
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);
  const [placedPayment, setPlacedPayment] = useState<QrPayment | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The spot on the map, required before confirming - same as on the checkout
  // page. The API may suggest one it found for the address; it only counts
  // once the customer has looked at the map and confirmed it.
  // An address ordered to before comes with the spot confirmed back then
  // (`saved_location`), so it starts pinned; "Đổi vị trí" still changes it.
  const [pin, setPin] = useState<LatLng | null>(draft.saved_location ?? null);

  const orderId = draft.order_id ?? placedOrderId;

  const handleConfirm = async () => {
    if (confirming) return;
    if (!pin) {
      setError("Bạn chọn vị trí giao hàng trên bản đồ trước nhé.");
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      const res = await confirmChatOrder(messageId, pin);
      setPlacedOrderId(res.order.id);
      setPlacedPayment(res.payment ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đặt được đơn hàng, vui lòng thử lại.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className={`${cardBox} animate-msg-in`}>
      <div className="flex items-center gap-2 border-b border-gray-100 bg-primary-50 px-3 py-2">
        <ReceiptText className="h-4 w-4 shrink-0 text-brand" />
        <p className="text-[13px] font-semibold text-brand-strong">
          {orderId ? `Đơn hàng #${orderId}` : "Phiếu đặt hàng"}
        </p>
      </div>

      <div className="space-y-2.5 p-3 text-[13px]">
        <div className="space-y-2">
          {draft.items.map((item) => (
            <div key={`${item.product_id}:${item.variant_id ?? 0}`} className="flex items-center gap-2">
              <ProductThumb imageUrl={item.image_url} alt={item.name} className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900">{item.name}</p>
                <p className="truncate text-xs text-gray-500">
                  {item.variant_label ? `${item.variant_label} · ` : ""}x{item.quantity}
                </p>
              </div>
              <span className="shrink-0 font-medium tabular-nums text-gray-800">
                {vnd(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-1 border-t border-gray-100 pt-2 text-xs text-gray-600">
          <p className="flex items-start gap-1.5">
            <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="min-w-0 break-words">{draft.recipient_name}</span>
          </p>
          <p className="flex items-start gap-1.5">
            <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="tabular-nums">{draft.phone}</span>
          </p>
          <p className="flex items-start gap-1.5">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="min-w-0 break-words">{draft.address}</span>
          </p>
          {draft.note && <p className="break-words italic text-gray-500">Ghi chú: {draft.note}</p>}
        </div>

        <div className="space-y-1 border-t border-gray-100 pt-2 text-xs">
          <Line label={draft.discount_percent ? `Tạm tính (đã giảm ${draft.discount_percent}%)` : "Tạm tính"} value={vnd(draft.subtotal)} />
          <Line label="Phí vận chuyển" value={vnd(draft.shipping_fee)} />
          <Line label="Thanh toán" value={METHOD_LABEL[draft.payment_method] ?? draft.payment_method} />
          <div className="flex items-center justify-between pt-1">
            <span className="text-[13px] font-semibold text-gray-800">Tổng cộng</span>
            <span className="text-base font-extrabold tabular-nums text-brand">{vnd(draft.total)}</span>
          </div>
        </div>

        {error && (
          <p className="flex animate-slide-down items-start gap-1.5 rounded-lg bg-red-50 px-2.5 py-2 text-xs font-medium text-red-500">
            <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
            {error}
          </p>
        )}

        {orderId ? (
          <>
            <p className="flex animate-fade-in items-center gap-1.5 text-xs font-semibold text-brand">
              <span className="flex h-4 w-4 animate-check-pop items-center justify-center rounded-full bg-primary-500 text-white">
                <Check className="h-3 w-3" strokeWidth={3.5} />
              </span>
              Đã đặt hàng
              <Link href="/orders" className="ml-auto font-medium underline-offset-2 hover:underline">
                Xem đơn
              </Link>
            </p>
            {draft.payment_method === "qr" && <PaymentCard orderId={orderId} initial={placedPayment} embedded />}
          </>
        ) : (
          <>
            <LocationPicker
              value={pin}
              onChange={(point) => {
                setPin(point);
                setError(null);
              }}
              address={draft.address}
              suggested={draft.suggested_location ?? null}
              compact
            />
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary-500 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-primary-600 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
            >
              {confirming && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              )}
              {confirming ? "Đang đặt hàng..." : "Xác nhận đặt hàng"}
            </button>
            <p className="text-center text-[11px] text-gray-400">
              Cần sửa thông tin? Nhắn cho AI để lập phiếu mới.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium tabular-nums text-gray-800">{value}</span>
    </div>
  );
}

/**
 * QR and transfer details for an order paid by bank transfer. Asks the API
 * every few seconds whether the transfer has landed (the SePay webhook
 * confirms it out of band - same polling as the checkout page) and switches
 * to "paid" when it has. `embedded` drops the card frame when it sits inside
 * the order slip.
 */
function PaymentCard({
  orderId,
  initial,
  embedded = false,
}: {
  orderId: number;
  initial: QrPayment | ChatPayment | null;
  embedded?: boolean;
}) {
  const [payment, setPayment] = useState<QrPayment | ChatPayment | null>(initial);
  const [state, setState] = useState<"checking" | "pending" | "paid" | "closed">("checking");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let checks = 0;

    const check = async () => {
      checks += 1;
      try {
        const status = await getOrderPaymentStatus(orderId);
        if (cancelled) return;
        if (status.payment_status === "paid") {
          setState("paid");
          return;
        }
        // Cancelled, or no longer waiting for a transfer: nothing to pay.
        if (status.status === "cancelled" || status.payment_status !== "pending" || !status.payment) {
          setState("closed");
          return;
        }
        setPayment(status.payment);
        setState("pending");
      } catch {
        // Best effort - a failed check just tries again on the next tick.
      }
      // An order left unpaid shouldn't keep a request going for as long as
      // the chat stays open: after ~15 minutes the QR stays but the checking
      // stops (reopening the chat starts it again).
      if (!cancelled && checks < 225) timer = setTimeout(check, PAYMENT_POLL_MS);
    };

    check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId]);

  const frame = embedded ? "border-t border-gray-100 pt-2.5" : `${cardBox} animate-msg-in p-3`;

  if (state === "paid") {
    return (
      <div className={`${frame} flex animate-fade-in items-center gap-2 text-[13px] font-semibold text-brand`}>
        <span className="flex h-6 w-6 shrink-0 animate-check-pop items-center justify-center rounded-full bg-primary-500 text-white shadow-glow">
          <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
        </span>
        Đơn #{orderId} đã thanh toán
      </div>
    );
  }

  if (state === "closed") {
    return (
      <div className={`${frame} text-xs text-gray-500`}>
        Đơn #{orderId} không còn chờ thanh toán.
      </div>
    );
  }

  if (!payment) {
    return (
      <div className={`${frame} flex items-center gap-2 text-xs text-gray-500`}>
        <Spinner className="h-3.5 w-3.5" />
        Đang lấy mã QR...
      </div>
    );
  }

  return (
    <div className={`${frame} flex flex-col items-center gap-2`}>
      {!embedded && (
        <p className="self-start text-[13px] font-semibold text-gray-900">Thanh toán đơn #{orderId}</p>
      )}
      {/* White behind the code in both themes, so it always scans. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={payment.payment_code}
        src={payment.qr_url}
        alt="Mã QR thanh toán"
        className="h-44 w-44 animate-pop-in rounded-xl border border-card-border bg-white p-1"
      />
      <div className="w-full space-y-1 text-xs">
        <Line label="Ngân hàng" value={payment.bank_name} />
        <Line label="Số tài khoản" value={payment.bank_account} />
        <Line label="Chủ tài khoản" value={payment.bank_account_holder} />
        <Line label="Số tiền" value={vnd(payment.amount_vnd)} />
        <Line label="Nội dung" value={payment.payment_code} />
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
        <Spinner className="h-3 w-3" />
        Đang chờ xác nhận chuyển khoản...
      </p>
    </div>
  );
}
