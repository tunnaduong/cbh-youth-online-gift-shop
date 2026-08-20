"use client";

import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import Header from "../components/Header";
import PaymentMethodSelector, {
  type PaymentMethod,
} from "../components/PaymentMethodSelector";
import { useAuth } from "../contexts/AuthContext";
import { getLoginUrl } from "../lib/auth";

// Mirrors MiniCart's demo items - there's no real cart/order API yet, so
// this page's job for now is the payment method step itself (points / QR /
// COD), not a full cart. Swap this for real cart state once one exists.
const DEMO_ITEMS = [
  { name: "Áo thun Chuyên Biên Hòa Classic", price: 199000, qty: 1 },
  { name: "Móc khóa logo Chuyên Biên Hòa", price: 29000, qty: 1 },
];

const METHOD_LABEL: Record<PaymentMethod, string> = {
  points: "điểm hoạt động",
  qr: "chuyển khoản QR",
  cod: "thanh toán khi nhận hàng (COD)",
};

export default function CheckoutPage() {
  const { loading, loggedIn } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [placedWith, setPlacedWith] = useState<PaymentMethod | null>(null);

  const total = useMemo(
    () => DEMO_ITEMS.reduce((sum, item) => sum + item.price * item.qty, 0),
    []
  );
  const orderCode = useMemo(
    () => `GIFTSHOP${Date.now().toString().slice(-8)}`,
    []
  );

  const handleConfirm = (method: PaymentMethod) => {
    setConfirming(true);
    // No order-placement API exists yet - this simulates the confirmation
    // step so the 3 payment methods are wired up end-to-end in the UI, and
    // swapping in a real POST /orders call later is a one-line change here.
    setTimeout(() => {
      setConfirming(false);
      setPlacedWith(method);
    }, 600);
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
        ) : placedWith ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
            <h2 className="text-lg font-bold text-slate-800">
              Đặt hàng thành công
            </h2>
            <p className="text-sm text-slate-500">
              Đơn {orderCode} đã được ghi nhận, thanh toán bằng{" "}
              {METHOD_LABEL[placedWith]}.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-bold text-slate-800">
                Đơn hàng
              </h2>
              <div className="flex flex-col gap-2">
                {DEMO_ITEMS.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-slate-600">
                      {item.name} <span className="text-slate-400">x{item.qty}</span>
                    </span>
                    <span className="font-medium text-slate-800">
                      {(item.price * item.qty).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                ))}
              </div>
              <div className="my-3 border-t border-slate-100" />
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-700">
                  Tổng cộng
                </span>
                <span className="text-base font-extrabold text-green-600">
                  {total.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            <h2 className="mb-3 text-sm font-bold text-slate-800">
              Phương thức thanh toán
            </h2>
            <PaymentMethodSelector
              amountVnd={total}
              orderCode={orderCode}
              onConfirm={handleConfirm}
              confirming={confirming}
            />
          </>
        )}
      </main>
    </>
  );
}
