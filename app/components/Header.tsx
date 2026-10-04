"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardList, House, LayoutGrid, Menu, Search, ShoppingCart, User, X } from "lucide-react";
import Image from "next/image";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { getAvatarUrl } from "../lib/api";
import { getLoginUrl } from "../lib/auth";
import { useAppMode } from "../lib/appMode";
import { iconBtn, stagger } from "../lib/ui";
import SettingsMenu from "./SettingsMenu";

const navLinks = [
  { label: "Trang chủ", href: "/", icon: House },
  { label: "Sản phẩm", href: "/products", icon: LayoutGrid },
  { label: "Đơn hàng", href: "/orders", icon: ClipboardList },
];

// A product page belongs under "Sản phẩm".
const isActive = (href: string, pathname: string) =>
  href === "/products"
    ? pathname === "/products" || pathname.startsWith("/product/")
    : href === pathname;

function AccountLink() {
  const { user, loading, loggedIn } = useAuth();
  const appMode = useAppMode();

  if (loading) {
    return <span className="shimmer h-9 w-9 shrink-0 rounded-full" />;
  }

  if (loggedIn && user) {
    const identity = (
      <>
        <Image
          src={getAvatarUrl(user.username)}
          alt={user.profile_name || user.username}
          width={36}
          height={36}
          className="h-9 w-9 rounded-full border border-gray-200 object-cover"
          unoptimized
        />
        <span className="hidden max-w-[120px] truncate text-sm font-medium text-gray-800 xl:inline">
          {user.profile_name || user.username}
        </span>
      </>
    );
    // In the app the profile lives on another site the WebView won't open -
    // show who's signed in without linking anywhere.
    if (appMode) {
      return <span className="flex shrink-0 items-center gap-2 rounded-full p-0.5 xl:pr-2.5">{identity}</span>;
    }
    return (
      <a
        href={`https://www.chuyenbienhoa.com/${user.username}`}
        className="flex shrink-0 items-center gap-2 rounded-full p-0.5 transition-colors hover:bg-gray-100 xl:pr-2.5"
      >
        {identity}
      </a>
    );
  }

  // The app always opens the shop signed in; there's no login page to send
  // anyone to from inside it.
  if (appMode) return null;

  return (
    <a
      href={getLoginUrl()}
      aria-label="Đăng nhập"
      className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl bg-primary-500 px-2.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:bg-primary-600 active:scale-[0.97] sm:px-4"
    >
      <User className="h-[18px] w-[18px] sm:hidden" />
      <span className="hidden sm:inline">Đăng nhập</span>
    </a>
  );
}

function SearchBox({ className, onSubmitted }: { className?: string; onSubmitted?: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/products?search=${encodeURIComponent(trimmed)}` : "/products");
    onSubmitted?.();
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className ?? ""}`}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Tìm kiếm sản phẩm..."
        aria-label="Tìm kiếm sản phẩm"
        className="h-11 w-full rounded-xl border border-gray-200 bg-surface pl-10 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
      />
    </form>
  );
}

export default function Header() {
  const { totalQuantity } = useCart();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // A soft shadow once the page has moved under the bar.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The login handoff page is a bare spinner.
  if (pathname.startsWith("/auth/")) return null;

  return (
    // Same bar as the main site: 69px, translucent over a blur, hairline
    // border. Sticky (not fixed) so pages need no top offset.
    <header
      className={`sticky top-0 z-40 border-b border-gray-200/80 bg-nav/90 backdrop-blur-xl transition-shadow duration-300 ${
        scrolled ? "shadow-[0_4px_20px_rgba(16,24,40,0.06)]" : ""
      }`}
    >
      {/* Tight gaps and no logo text below sm: at 360px the logo text plus the
          icon row came out wider than the screen, pushing the page sideways
          (or, with overflow-x clipped, cutting the right-hand icons off). */}
      <div className="mx-auto flex h-[69px] max-w-[1240px] items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-6">
        {/* Hamburger — mobile only */}
        <button
          onClick={() => {
            setMenuOpen((v) => !v);
            setMobileSearchOpen(false);
          }}
          className={`${iconBtn} lg:hidden`}
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-[21px] w-[21px]" /> : <Menu className="h-[21px] w-[21px]" />}
        </button>

        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
          <Image
            src="/images/logo.png"
            alt="Giftshop logo"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 transition-transform duration-300 hover:rotate-6"
          />
          <span className="hidden min-w-0 text-[14px] leading-[18px] text-brand sm:block">
            <span className="block truncate font-light">Giftshop</span>
            <span className="block truncate font-bold">Chuyên Biên Hòa</span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {navLinks.map(({ label, href, icon: Icon }) => {
            const active = isActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-[15px] font-medium transition duration-200 ${
                  active
                    ? "bg-primary-500 text-white shadow-glow"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <SearchBox className="mx-auto hidden w-full min-w-0 max-w-[460px] flex-1 md:block" />

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-1.5 md:ml-0">
          {/* Mobile search toggle */}
          <button
            onClick={() => {
              setMobileSearchOpen((v) => !v);
              setMenuOpen(false);
            }}
            className={`${iconBtn} md:hidden`}
            aria-label="Tìm kiếm"
            aria-expanded={mobileSearchOpen}
          >
            <Search className="h-[21px] w-[21px]" strokeWidth={1.9} />
          </button>
          <Link
            href="/cart"
            aria-label="Giỏ hàng"
            className={`${iconBtn} ${pathname === "/cart" ? "bg-primary-50 text-brand" : ""}`}
          >
            <ShoppingCart className="h-[21px] w-[21px]" strokeWidth={1.9} />
            {totalQuantity > 0 && (
              // Keyed by the count so the badge is a new element - and bumps -
              // each time something is added or removed.
              <span
                key={totalQuantity}
                className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] animate-bump items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-nav"
              >
                {totalQuantity > 9 ? "9+" : totalQuantity}
              </span>
            )}
          </Link>
          <SettingsMenu />
          <AccountLink />
        </div>
      </div>

      {/* Mobile search bar */}
      {mobileSearchOpen && (
        <div className="animate-slide-down border-t border-gray-200/80 px-3 py-3 md:hidden">
          <SearchBox className="w-full" onSubmitted={() => setMobileSearchOpen(false)} />
        </div>
      )}

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <nav className="stagger flex flex-col gap-1 border-t border-gray-200/80 px-3 py-3 lg:hidden">
          {navLinks.map(({ label, href, icon: Icon }, i) => {
            const active = isActive(href, pathname);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                style={stagger(i)}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] font-medium transition-colors ${
                  active
                    ? "bg-primary-500 text-white shadow-glow"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="h-[19px] w-[19px]" strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
