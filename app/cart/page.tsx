"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import Header from "../components/Header";
import { cartItemKey } from "../contexts/CartContext";
import CartLineItem from "../components/CartLineItem";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { getLoginUrl } from "../lib/auth";

export default function CartPage() {
  const { items, totalAmount, clear } = useCart();
  const { loading: authLoading, loggedIn } = useAuth();

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[720px] px-6 py-8">
        <h1 className="mb-6 text-2xl font-extrabold text-slate-800">
          Giỏ hàng
        </h1>

        {authLoading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-green-600" />
          </div>
        ) : !loggedIn ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="text-sm text-slate-500">
              Đăng nhập bằng tài khoản Chuyên Biên Hòa để xem giỏ hàng.
            </p>
            <a
              href={getLoginUrl()}
              className="mt-1 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
            >
              Đăng nhập để tiếp tục
            </a>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <ShoppingCart className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">Giỏ hàng đang trống.</p>
            <Link
              href="/#catalog"
              className="mt-1 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-col gap-5">
                {items.map((item) => (
                  <CartLineItem key={cartItemKey(item)} item={item} editable />
                ))}
              </div>

              <div className="my-4 border-t border-slate-100" />

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">
                  Tổng cộng
                </span>
                <span className="text-lg font-extrabold text-green-600">
                  {totalAmount.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={clear}
                className="text-sm font-medium text-slate-500 hover:text-red-500"
              >
                Xóa toàn bộ giỏ hàng
              </button>
              <Link
                href="/checkout"
                className="rounded-xl bg-green-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
              >
                Tiến hành thanh toán
              </Link>
            </div>
          </>
        )}
      </main>
    </>
  );
}
