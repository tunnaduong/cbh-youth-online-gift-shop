"use client";

import { CheckCircle2, Gift } from "lucide-react";
import Link from "next/link";
import { useStudentDiscount } from "../../contexts/StudentDiscountContext";
import { useAppMode } from "../../lib/appMode";

export default function PromoBanner() {
  const { percent, loading } = useStudentDiscount();
  const verified = percent > 0;
  const appMode = useAppMode();

  return (
    // The main site's green banner strip. Everything on it is white on green
    // in both themes, hence the fixed hex colours.
    <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2E9A2A] via-[#3FA836] to-[#2E9A2A] p-5 text-white shadow-card">
      <Gift
        className="pointer-events-none absolute -bottom-4 -right-4 h-28 w-28 text-white/15 transition-transform duration-500 group-hover:-rotate-12 group-hover:scale-110"
        strokeWidth={1}
      />
      <div className="relative">
        <h3 className="text-base font-bold">Ưu đãi học sinh</h3>
        <p className="mt-1.5 text-sm text-white/90">
          {verified
            ? `Tài khoản học sinh đã xác minh - bạn đang được giảm ${percent}% cho tất cả sản phẩm`
            : "Giảm 10% cho tất cả sản phẩm khi xác minh tài khoản học sinh"}
        </p>

        {/* Held back until the status is known, so a verified student never
            sees "Xác minh ngay" flash up and then disappear. */}
        {loading ? (
          <div className="mt-4 h-10 w-36 animate-pulse rounded-xl bg-white/20" />
        ) : verified ? (
          <span className="mt-4 inline-flex animate-fade-in items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white backdrop-blur">
            <CheckCircle2 className="h-4 w-4" />
            Đã xác minh
          </span>
        ) : appMode ? (
          // Verification is on the main site, which the app's WebView won't
          // leave the shop for - point at where it lives in the app instead.
          <p className="mt-4 text-sm font-semibold text-white">
            Xác minh trong mục Cài đặt của ứng dụng
          </p>
        ) : (
          <Link
            href="https://chuyenbienhoa.com/settings?tab=student-kyc"
            className="mt-4 inline-block animate-fade-in rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#287421] shadow-sm transition duration-200 hover:bg-[#f3fbf2] active:scale-[0.97]"
          >
            Xác minh ngay
          </Link>
        )}
      </div>
    </div>
  );
}
