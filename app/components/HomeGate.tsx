"use client";

import { Lock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { getLoginUrl } from "../lib/auth";

/**
 * Every product/price/cart shown on this site right now is placeholder
 * content (there's no real catalog API yet) - gating it behind login isn't
 * about protecting real data, it's so a logged-out visitor sees it's a demo
 * rather than mistaking it for a working store, with a clear way to sign in
 * (via the shared CBH account, see ../lib/auth) to get past the preview.
 */
export default function HomeGate({ children }: { children: React.ReactNode }) {
  const { loading, loggedIn } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-center px-6 py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-green-600" />
      </div>
    );
  }

  if (loggedIn) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none select-none opacity-40 blur-[1px]"
      >
        {children}
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-16 sm:pt-28">
        <div className="pointer-events-auto mx-6 flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-8 text-center shadow-xl backdrop-blur">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
            <Lock className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-bold text-slate-800">
            Đây là bản xem trước
          </h2>
          <p className="text-sm text-slate-500">
            Đăng nhập bằng tài khoản Chuyên Biên Hòa để xem và mua sắm tại
            Giftshop.
          </p>
          <a
            href={getLoginUrl()}
            className="mt-2 w-full rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
          >
            Đăng nhập để tiếp tục
          </a>
        </div>
      </div>
    </div>
  );
}
