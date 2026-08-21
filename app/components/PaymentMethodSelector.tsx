"use client";

import { useState } from "react";
import { Banknote, Coins, QrCode } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// Same conversion the backend uses (PointsService::convertVNDToPoints) and
// the mobile wallet deposit screen shows - 100đ per point.
const POINTS_PER_VND = 100;

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
  const pointsNeeded = Math.ceil(amountVnd / POINTS_PER_VND);
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
            className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${
              isSelected
                ? "border-green-600 bg-green-50/60"
                : "border-slate-200 bg-white hover:border-green-600/40"
            }`}
          >
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                isSelected ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-semibold text-slate-800">
                {method.label}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {method.description}
              </span>
              {method.id === "points" && (
                <span
                  className={`mt-1 block text-xs font-semibold ${
                    hasEnoughPoints ? "text-green-600" : "text-red-500"
                  }`}
                >
                  Số dư: {pointsBalance.toLocaleString("vi-VN")} điểm · Cần{" "}
                  {pointsNeeded.toLocaleString("vi-VN")} điểm
                  {!hasEnoughPoints && " (không đủ điểm)"}
                </span>
              )}
            </span>
            <span
              className={`mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                isSelected ? "border-green-600 bg-green-600" : "border-slate-300"
              }`}
            />
          </button>
        );
      })}

      <button
        type="button"
        disabled={confirming || (selected === "points" && !hasEnoughPoints)}
        onClick={() => onConfirm(selected)}
        className="mt-2 w-full rounded-xl bg-green-600 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
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
