"use client";

import { CheckCircle2, Gift } from "lucide-react";
import Link from "next/link";
import { useStudentDiscount } from "../../contexts/StudentDiscountContext";

export default function PromoBanner() {
  const { percent, loading } = useStudentDiscount();
  const verified = percent > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-green-600 p-5 text-white">
      <Gift className="pointer-events-none absolute -bottom-4 -right-4 h-28 w-28 text-white/15" strokeWidth={1} />
      <div className="relative">
        <h3 className="text-base font-bold">Ưu đãi học sinh</h3>
        <p className="mt-1.5 text-sm text-green-50/90">
          {verified
            ? `Tài khoản học sinh đã xác minh - bạn đang được giảm ${percent}% cho tất cả sản phẩm`
            : "Giảm 10% cho tất cả sản phẩm khi xác minh tài khoản học sinh"}
        </p>

        {/* Held back until the status is known, so a verified student never
            sees "Xác minh ngay" flash up and then disappear. */}
        {loading ? (
          <div className="mt-4 h-[42px] w-36 animate-pulse rounded-xl bg-white/20" />
        ) : verified ? (
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white">
            <CheckCircle2 className="h-4 w-4" />
            Đã xác minh
          </span>
        ) : (
          <Link
            href="https://chuyenbienhoa.com/settings?tab=student-kyc"
            className="mt-4 inline-block rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-green-600 transition-colors hover:bg-green-50"
          >
            Xác minh ngay
          </Link>
        )}
      </div>
    </div>
  );
}
