"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, PackageSearch } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import { PageSpinner } from "../components/ui/Spinner";
import { btnPrimary, card, pageTitle, skeleton, stagger } from "../lib/ui";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { getLoginUrl } from "../lib/auth";
import { cancelShopOrder, getMyShopOrders, type ShopOrder } from "../lib/shop";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "Chờ xử lý", className: "bg-amber-50 text-amber-600" },
  processing: { label: "Đang xử lý", className: "bg-blue-50 text-blue-600" },
  shipped: { label: "Đang giao", className: "bg-indigo-50 text-indigo-600" },
  completed: { label: "Hoàn tất", className: "bg-primary-50 text-brand" },
  cancelled: { label: "Đã hủy", className: "bg-gray-100 text-gray-500" },
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  points: "Điểm hoạt động",
  qr: "Chuyển khoản QR",
  cod: "Thanh toán khi nhận hàng",
};

const PAYMENT_STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "Chưa thanh toán", className: "text-amber-600" },
  paid: { label: "Đã thanh toán", className: "text-brand" },
  failed: { label: "Thất bại", className: "text-red-500" },
};

// An order can be cancelled until it is out for delivery: "shipped" and
// later can't. Paid or not doesn't matter - points come back at once, a
// bank transfer is refunded by the shop. Mirrors ShopController::cancelOwnOrder.
function isCancellable(order: ShopOrder): boolean {
  return ["pending", "processing"].includes(order.status);
}

export default function OrdersPage() {
  const { loading: authLoading, loggedIn } = useAuth();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const fetchOrders = useCallback(() => {
    return getMyShopOrders()
      .then((res) => setOrders(res.data))
      .catch(() => setError("Không thể tải danh sách đơn hàng."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    fetchOrders();
  }, [loggedIn, fetchOrders]);

  const handleCancel = async (order: ShopOrder) => {
    const orderId = order.id;
    // Says up front what happens to money already paid.
    const refundNote =
      order.payment_status !== "paid"
        ? ""
        : order.payment_method === "points"
          ? " Điểm đã thanh toán sẽ được hoàn lại ngay."
          : order.payment_method === "qr"
            ? " Tiền đã chuyển khoản sẽ được shop liên hệ hoàn lại sau."
            : "";
    if (!window.confirm(`Bạn chắc chắn muốn hủy đơn #${orderId}?${refundNote}`)) return;

    setCancellingId(orderId);
    setError(null);
    try {
      const res = await cancelShopOrder(orderId);
      toast(res.message || "Đơn hàng đã được hủy.");
      setLoading(true);
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể hủy đơn hàng.");
    } finally {
      setCancellingId(null);
    }
  };


  return (
    <main className="mx-auto w-full max-w-[800px] px-3 pb-8 pt-5 sm:px-4 lg:pt-7">
      <h1 className={`${pageTitle} mb-5`}>Đơn hàng của tôi</h1>

      {authLoading ? (
        <PageSpinner />
      ) : !loggedIn ? (
        <EmptyState icon={LogIn} title="Đăng nhập để xem đơn hàng của bạn.">
          <a href={getLoginUrl()} className={`${btnPrimary} h-11 px-6`}>
            Đăng nhập để tiếp tục
          </a>
        </EmptyState>
      ) : loading ? (
        // Order-shaped placeholders rather than a bare spinner.
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`${card} p-5`}>
              <div className="flex items-center justify-between">
                <div className={`${skeleton} h-4 w-24`} />
                <div className={`${skeleton} h-6 w-20 rounded-full`} />
              </div>
              <div className={`${skeleton} mt-4 h-3.5 w-3/4`} />
              <div className={`${skeleton} mt-2 h-3.5 w-1/2`} />
              <div className="my-3 border-t border-gray-100" />
              <div className="flex items-center justify-between">
                <div className={`${skeleton} h-3 w-32`} />
                <div className={`${skeleton} h-5 w-24`} />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState icon={PackageSearch} title="Bạn chưa có đơn hàng nào.">
          <Link href="/#catalog" className={`${btnPrimary} h-11 px-6`}>
            Bắt đầu mua sắm
          </Link>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {error && (
            <p className="animate-slide-down rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-500">
              {error}
            </p>
          )}

          <div className="stagger flex flex-col gap-4">
            {orders.map((order, i) => {
              const status = STATUS_LABEL[order.status] ?? {
                label: order.status,
                className: "bg-gray-100 text-gray-500",
              };
              const paymentStatus =
                // Cancelled after the transfer arrived: the shop still owes the money back.
                order.status === "cancelled" && order.payment_method === "qr" && order.payment_status === "paid"
                  ? { label: "Chờ hoàn tiền", className: "text-amber-600" }
                  : PAYMENT_STATUS_LABEL[order.payment_status];

              return (
                <div
                  key={order.id}
                  style={stagger(i)}
                  className={`${card} p-4 transition duration-200 hover:border-primary-300 hover:shadow-lift sm:p-5`}
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[15px] font-semibold text-gray-900">
                      Đơn #{order.id}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <span className="min-w-0 text-gray-700">
                          {item.product?.name ?? `Sản phẩm #${item.product_id}`}
                          {item.variant_label && (
                            <span className="text-gray-400"> ({item.variant_label})</span>
                          )}{" "}
                          <span className="text-gray-400">x{item.quantity}</span>
                        </span>
                        <span className="shrink-0 font-medium tabular-nums text-gray-900">
                          {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="my-3 border-t border-gray-100" />

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                    <span>
                      {PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method}
                      {paymentStatus && (
                        <span className={`ml-1.5 font-semibold ${paymentStatus.className}`}>
                          · {paymentStatus.label}
                        </span>
                      )}
                    </span>
                    <span className="text-base font-extrabold tabular-nums text-brand">
                      {order.total_amount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>

                  {isCancellable(order) && (
                    <button
                      type="button"
                      onClick={() => handleCancel(order)}
                      disabled={cancellingId === order.id}
                      className="mt-3 rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-500 transition duration-200 hover:bg-red-50 active:scale-95 disabled:border-gray-200 disabled:text-gray-300"
                    >
                      {cancellingId === order.id ? "Đang hủy..." : "Hủy đơn"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
