"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppMode } from "../lib/appMode";

const links = [
  { label: "Trang chủ", href: "/" },
  { label: "Sản phẩm", href: "/products" },
  { label: "Giỏ hàng", href: "/cart" },
  { label: "Đơn hàng", href: "/orders" },
];

/** A slim version of the main site's footer: the green link strip, then the brand line. */
export default function Footer() {
  const pathname = usePathname();
  const appMode = useAppMode();

  if (pathname.startsWith("/auth/")) return null;

  return (
    <footer className="mt-10 bg-surface text-gray-600">
      <div className="bg-[#319527] shadow-md">
        <nav className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3.5 text-[14px] lg:px-6">
          {links.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="text-white/90 transition-colors hover:text-white hover:underline"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Extra room at the bottom below lg, where the floating buttons sit. */}
      <div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-4 pb-24 pt-6 sm:flex-row sm:items-center sm:justify-between lg:px-6 lg:pb-6">
        <div className="flex items-center gap-3">
          <Image src="/images/logo.png" alt="" width={40} height={40} className="h-10 w-10 shrink-0" />
          <div className="min-w-0">
            <p className="text-[15px] font-bold text-gray-900">Giftshop Chuyên Biên Hòa</p>
            <p className="text-[13px] text-gray-500">Mang dấu ấn Chuyên Biên Hòa đến mọi nơi bạn đi!</p>
          </div>
        </div>
        <div className="text-[12px] text-gray-500 sm:text-right">
          {/* The app's WebView is locked to this domain: no way out to the forum from there. */}
          {!appMode && (
            <a
              href="https://www.chuyenbienhoa.com"
              className="text-[13px] font-medium text-brand hover:text-brand-strong"
            >
              Diễn đàn học sinh Chuyên Biên Hòa
            </a>
          )}
          <p className="mt-1">© 2026 CBH Youth Online</p>
        </div>
      </div>
    </footer>
  );
}
