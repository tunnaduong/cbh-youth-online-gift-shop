"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import Header from "../components/Header";
import { useAuth } from "../contexts/AuthContext";
import { getLoginUrl } from "../lib/auth";
import { cancelShopOrder, getMyShopOrders, type ShopOrder } from "../lib/shop";

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "Chờ xử lý", className: "bg-amber-50 text-amber-600" },
  processing: { label: "Đang xử lý", className: "bg-blue-50 text-blue-600" },
  shipped: { label: "Đang giao", className: "bg-indigo-50 text-indigo-600" },
  completed: { label: "Hoàn tất", className: "bg-green-50 text-green-600" },
  cancelled: { label: "Đã hủy", className: "bg-slate-100 text-slate-500" },
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  points: "Điểm hoạt động",
  qr: "Chuyển khoản QR",
  cod: "Thanh toán khi nhận hàng",
};

const PAYMENT_STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: "Chưa thanh toán", className: "text-amber-600" },
  paid: { label: "Đã thanh toán", className: "text-green-600" },
  failed: { label: "Thất bại", className: "text-red-500" },
};

// pending/processing orders that haven't already been paid (points/qr) can
// still be cancelled - mirrors ShopController::cancelOrder's own rule.
function isCancellable(order: ShopOrder): boolean {
  if (!["pending", "processing"].includes(order.status)) return false;
  if (order.payment_method !== "cod" && order.payment_status === "paid") return false;
  return true;
}

export default function OrdersPage() {
  const { loading: authLoading, loggedIn } = useAuth();
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleCancel = async (orderId: number) => {
    setCancellingId(orderId);
    try {
      await cancelShopOrder(orderId);
      setLoading(true);
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể hủy đơn hàng.");
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[800px] px-6 py-8">
        <h1 className="mb-6 text-2xl font-extrabold text-slate-800">
          Đơn hàng của tôi
        </h1>

        {authLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-green-600" />
          </div>
        ) : !loggedIn ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">
              Đăng nhập để xem đơn hàng của bạn.
            </p>
            <a
              href={getLoginUrl()}
              className="mt-1 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
            >
              Đăng nhập để tiếp tục
            </a>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-green-600" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <PackageSearch className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">Bạn chưa có đơn hàng nào.</p>
            <Link
              href="/#catalog"
              className="mt-1 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
            >
              Bắt đầu mua sắm
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-500">
                {error}
              </p>
            )}

            {orders.map((order) => {
              const status = STATUS_LABEL[order.status] ?? {
                label: order.status,
                className: "bg-slate-100 text-slate-500",
              };
              const paymentStatus = PAYMENT_STATUS_LABEL[order.payment_status];

              return (
                <div
                  key={order.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5"
                >
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-800">
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
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-600">
                          {item.product?.name ?? `Sản phẩm #${item.product_id}`}
                          {item.variant_label && (
                            <span className="text-slate-400"> ({item.variant_label})</span>
                          )}{" "}
                          <span className="text-slate-400">x{item.quantity}</span>
                        </span>
                        <span className="font-medium text-slate-800">
                          {(item.price * item.quantity).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="my-3 border-t border-slate-100" />

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <span>
                      {PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method}
                      {paymentStatus && (
                        <span className={`ml-1.5 font-semibold ${paymentStatus.className}`}>
                          · {paymentStatus.label}
                        </span>
                      )}
                    </span>
                    <span className="text-base font-extrabold text-green-600">
                      {order.total_amount.toLocaleString("vi-VN")}đ
                    </span>
                  </div>

                  {isCancellable(order) && (
                    <button
                      type="button"
                      onClick={() => handleCancel(order.id)}
                      disabled={cancellingId === order.id}
                      className="mt-3 text-xs font-semibold text-red-500 hover:text-red-600 disabled:text-slate-300"
                    >
                      {cancellingId === order.id ? "Đang hủy..." : "Hủy đơn"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
