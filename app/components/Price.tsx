"use client";

import { vndToPoints } from "../lib/shop";
import { useStudentDiscount } from "../contexts/StudentDiscountContext";

const vnd = (n: number) => `${n.toLocaleString("vi-VN")}đ`;

/**
 * Shopee-style price: for a verified student the discounted price is the big
 * number, with the original struck through and a -10% badge beside it. For
 * everyone else it collapses back to the plain price.
 */
export default function Price({
  amount,
  size = "sm",
  showPoints = false,
  prefix = "",
}: {
  amount: number;
  size?: "sm" | "lg";
  showPoints?: boolean;
  prefix?: string;
}) {
  const { percent, discounted } = useStudentDiscount();
  const final = discounted(amount);
  const lg = size === "lg";

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
      <span className={lg ? "text-2xl font-bold text-green-700" : "font-bold text-green-600"}>
        {prefix}
        {vnd(final)}
      </span>
      {percent > 0 && (
        <>
          <span className={`text-slate-400 line-through ${lg ? "text-base" : "text-xs"}`}>
            {vnd(amount)}
          </span>
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-500">
            -{percent}%
          </span>
        </>
      )}
      {showPoints && (
        <span className={lg ? "text-sm text-green-600/80" : "text-xs font-medium text-slate-400"}>
          · {vndToPoints(final).toLocaleString("vi-VN")} điểm
        </span>
      )}
    </span>
  );
}
