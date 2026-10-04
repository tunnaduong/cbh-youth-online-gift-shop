"use client";

import { useState } from "react";
import { Banknote, Coins, QrCode } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { vndToPoints } from "../lib/shop";
import { btnPrimary } from "../lib/ui";


export type PaymentMethod = "points" | "qr" | "cod";

interface PaymentMethodSelectorProps {
  amountVnd: number;
  onConfirm: (method: PaymentMethod) => void;
  confirming?: boolean;
}

const METHODS: { id: PaymentMethod; label: string; description: string }[] = [
  {
    id: "points",
    label: "Điểm hoạt động",
    description: "Thanh toán bằng điểm tích lũy trên Chuyên Biên Hòa",
  },
  {
    id: "qr",
    label: "Quét mã QR",
    description: "Chuyển khoản ngân hàng, mã QR tạo tức thì",
  },
  {
    id: "cod",
    label: "Thanh toán khi nhận hàng",
    description: "Trả tiền mặt cho người giao hàng (COD)",
  },
];

const METHOD_ICONS: Record<PaymentMethod, React.ElementType> = {
  points: Coins,
  qr: QrCode,
  cod: Banknote,
};

// Just the method picker - the actual QR (with the server-generated
// payment_code) only exists once an order has been created, so that lives on
// the checkout page's post-submit state instead of being previewed here.
export default function PaymentMethodSelector({
  amountVnd,
  onConfirm,
  confirming = false,
}: PaymentMethodSelectorProps) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<PaymentMethod>("qr");

  const pointsBalance = user?.total_points ?? 0;
  const pointsNeeded = vndToPoints(amountVnd);
  const hasEnoughPoints = pointsBalance >= pointsNeeded;

  return (
    <div className="flex flex-col gap-3">
      {METHODS.map((method) => {
        const Icon = METHOD_ICONS[method.id];
        const isSelected = selected === method.id;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => setSelected(method.id)}
            aria-pressed={isSelected}
            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition duration-200 active:scale-[0.99] ${
              isSelected
                ? "border-primary-500 bg-primary-50 shadow-card"
                : "border-card-border bg-surface hover:border-primary-300"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition duration-200 ${
                isSelected ? "scale-105 bg-primary-500 text-white shadow-glow" : "bg-gray-100 text-gray-600"
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-gray-900">
                {method.label}
              </span>
              <span className="mt-0.5 block text-xs text-gray-500">
                {method.description}
              </span>
              {method.id === "points" && (
                <span
                  className={`mt-1 block text-xs font-semibold ${
                    hasEnoughPoints ? "text-brand" : "text-red-500"
                  }`}
                >
                  Số dư: {pointsBalance.toLocaleString("vi-VN")} điểm · Cần{" "}
                  {pointsNeeded.toLocaleString("vi-VN")} điểm
                  {!hasEnoughPoints && " (không đủ điểm)"}
                </span>
              )}
            </span>
            {/* Radio: the dot grows in when chosen. */}
            <span
              className={`mt-1 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2 transition duration-200 ${
                isSelected ? "border-primary-500" : "border-gray-300"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full bg-primary-500 transition duration-200 ${
                  isSelected ? "scale-100" : "scale-0"
                }`}
              />
            </span>
          </button>
        );
      })}

      <button
        type="button"
        disabled={confirming || (selected === "points" && !hasEnoughPoints)}
        onClick={() => onConfirm(selected)}
        className={`${btnPrimary} mt-2 h-12 w-full`}
      >
        {confirming && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500" />
        )}
        {confirming
          ? "Đang xử lý..."
          : selected === "cod"
          ? "Đặt hàng (COD)"
          : selected === "points"
          ? "Thanh toán bằng điểm"
          : "Tạo mã QR thanh toán"}
      </button>
    </div>
  );
}
