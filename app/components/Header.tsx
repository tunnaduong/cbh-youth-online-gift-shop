"use client";

import { ChevronDown, Search, ShoppingCart, User } from "lucide-react";
import FrogLogo from "./FrogLogo";

const navLinks = [
  { label: "Trang chủ", active: true },
  { label: "Sản phẩm", dropdown: true },
  { label: "Bộ sưu tập" },
  { label: "Giới thiệu" },
  { label: "Liên hệ" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white">
      <div className="mx-auto flex h-[70px] max-w-[1280px] items-center justify-between gap-6 px-6">
        <a href="#" className="flex shrink-0 items-center gap-2.5">
          <FrogLogo />
          <span className="leading-tight">
            <span className="block text-lg font-bold text-slate-800">Giftshop</span>
            <span className="block text-xs font-medium text-slate-500">
              Chuyên Biên Hòa
            </span>
          </span>
        </a>

        <div className="relative hidden max-w-xs flex-1 md:block">
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full rounded-full bg-slate-100 py-2.5 pl-4 pr-10 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-600/30"
          />
          <Search className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>

        <nav className="hidden items-center gap-7 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href="#"
              className={`relative flex items-center gap-1 pb-1 text-sm font-medium transition-colors ${
                link.active
                  ? "text-green-600"
                  : "text-slate-600 hover:text-green-600"
              }`}
            >
              {link.label}
              {link.dropdown && <ChevronDown className="h-3.5 w-3.5" />}
              {link.active && (
                <span className="absolute -bottom-0 left-0 h-0.5 w-full rounded-full bg-green-600" />
              )}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-5">
          <a href="#" className="relative flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-green-600">
            <span className="relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[10px] font-bold text-white">
                2
              </span>
            </span>
            <span className="hidden sm:inline">Giỏ hàng</span>
          </a>
          <a href="#" className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-green-600">
            <User className="h-5 w-5" />
            <span className="hidden sm:inline">Đăng nhập</span>
          </a>
        </div>
      </div>
    </header>
  );
}
