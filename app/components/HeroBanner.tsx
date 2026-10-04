"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClipboardList, Gift, LayoutGrid, Search, ShoppingCart, Sparkles, type LucideIcon } from "lucide-react";
import { stagger } from "../lib/ui";

// Quick actions under the headline. The tint classes are -50 shades, which
// the dark theme redefines, so the tiles need no dark variants.
const actions: { label: string; hint: string; href: string; icon: LucideIcon; tint: string }[] = [
  { label: "Sản phẩm", hint: "Xem tất cả", href: "/products", icon: LayoutGrid, tint: "bg-blue-50 text-blue-500" },
  { label: "Giỏ hàng", hint: "Món đã chọn", href: "/cart", icon: ShoppingCart, tint: "bg-amber-50 text-amber-500" },
  { label: "Đơn hàng", hint: "Theo dõi đơn", href: "/orders", icon: ClipboardList, tint: "bg-indigo-50 text-indigo-500" },
  { label: "Nổi bật", hint: "Mua ngay", href: "#catalog", icon: Sparkles, tint: "bg-primary-50 text-brand" },
];

/**
 * The home page hero, in the main site's style: a green gradient card with
 * soft drifting circles, the headline, a search box and quick-action tiles
 * that lift on hover. (It used to be a 1.8 MB photo banner.)
 */
export default function HeroBanner() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : "/products");
  };

  return (
    <section className="relative animate-fade-up overflow-hidden rounded-2xl bg-gradient-to-br from-[#2E9A2A] via-[#47AE3D] to-[#8FD27B] p-5 sm:p-7">
      {/* Decoration */}
      <span className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 animate-float rounded-full bg-white/10" />
      <span className="pointer-events-none absolute -bottom-20 right-24 h-44 w-44 animate-float-slow rounded-full bg-white/10" />
      <span className="pointer-events-none absolute -left-10 bottom-6 h-24 w-24 animate-float-slow rounded-full bg-white/5" />
      <Gift
        className="pointer-events-none absolute right-6 top-6 hidden h-32 w-32 rotate-12 text-white/15 sm:block"
        strokeWidth={1}
      />

      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
          Giftshop Chuyên Biên Hòa
        </p>
        <h1 className="mt-2 text-[26px] font-bold leading-tight text-white drop-shadow-sm sm:text-[30px]">
          Quà tặng lưu niệm
          <br />
          Chuyên Biên Hòa
        </h1>
        <p className="mt-2 max-w-md text-sm text-white/90">
          Mang dấu ấn Chuyên Biên Hòa đến mọi nơi bạn đi!
        </p>

        <form
          onSubmit={handleSearch}
          className="mt-5 flex max-w-lg items-center gap-2 rounded-xl bg-surface p-1.5 pl-4 shadow-hero"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Bạn đang tìm món quà nào?"
            aria-label="Tìm kiếm sản phẩm"
            className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />
          <button
            type="submit"
            aria-label="Tìm kiếm"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-white transition duration-200 hover:bg-primary-600 active:scale-95"
          >
            <Search className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </button>
        </form>

        <div className="stagger mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {actions.map(({ label, hint, href, icon: Icon, tint }, i) => (
            <Link
              key={label}
              href={href}
              style={stagger(i + 2)}
              className="group flex min-w-0 items-center gap-3 rounded-xl bg-surface px-3 py-3 shadow-[0_4px_14px_rgba(20,70,20,0.12)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(20,70,20,0.18)] sm:px-4"
            >
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tint}`}>
                <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" strokeWidth={2.1} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-gray-900">{label}</span>
                <span className="block truncate text-xs text-gray-500">{hint}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
