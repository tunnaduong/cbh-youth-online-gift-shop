"use client";

import { useState } from "react";
import { Banknote, Coins, QrCode } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

// Same SePay QR image endpoint + bank account the mobile app's wallet
// deposit screen uses (DepositScreen.js) - reusing it here keeps "pay by
// QR" visually/behaviorally consistent with the wallet top-up flow instead
// of inventing a second QR pattern.
const BANK_ACCOUNT = "99421112003";
const BANK_NAME = "TPBank";
const BANK_ACCOUNT_HOLDER = "CHUYEN BIEN HOA";

// Same conversion the mobile wallet deposit screen shows
// (expectedPoints = floor((amount - 1000) / 100)) - 100đ per point.
const POINTS_PER_VND = 100;

export type PaymentMethod = "points" | "qr" | "cod";

interface PaymentMethodSelectorProps {
  amountVnd: number;
  orderCode: string;
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

export default function PaymentMethodSelector({
  amountVnd,
  orderCode,
  onConfirm,
  confirming = false,
}: PaymentMethodSelectorProps) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<PaymentMethod>("qr");

  const pointsBalance = user?.total_points ?? 0;
  const pointsNeeded = Math.ceil(amountVnd / POINTS_PER_VND);
  const hasEnoughPoints = pointsBalance >= pointsNeeded;

  const qrUrl = `https://qr.sepay.vn/img?acc=${BANK_ACCOUNT}&bank=${BANK_NAME}&amount=${amountVnd}&des=${orderCode}&template=compact`;

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

      {selected === "qr" && (
        <div className="mt-1 flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrUrl}
            alt="Mã QR thanh toán"
            className="h-56 w-56 rounded-xl"
          />
          <div className="w-full space-y-1.5 text-sm">
            <Row label="Ngân hàng" value={BANK_NAME} />
            <Row label="Số tài khoản" value={BANK_ACCOUNT} />
            <Row label="Chủ tài khoản" value={BANK_ACCOUNT_HOLDER} />
            <Row
              label="Số tiền"
              value={`${amountVnd.toLocaleString("vi-VN")}đ`}
            />
            <Row label="Nội dung" value={orderCode} />
          </div>
          <p className="text-center text-xs text-slate-400">
            Quét mã bằng app ngân hàng bất kỳ - đơn hàng tự động xác nhận sau
            khi chuyển khoản thành công.
          </p>
        </div>
      )}

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
          : "Tôi đã chuyển khoản"}
      </button>
    </div>
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
