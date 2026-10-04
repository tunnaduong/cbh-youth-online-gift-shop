"use client";

import Link from "next/link";
import { ArrowRight, LogIn, ShoppingCart } from "lucide-react";
import Price from "../components/Price";
import EmptyState from "../components/ui/EmptyState";
import { PageSpinner } from "../components/ui/Spinner";
import { cartItemKey } from "../contexts/CartContext";
import CartLineItem from "../components/CartLineItem";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { getLoginUrl } from "../lib/auth";
import { btnPrimary, card, pageTitle } from "../lib/ui";

export default function CartPage() {
  const { items, totalAmount, clear } = useCart();
  const { loading: authLoading, loggedIn } = useAuth();

  return (
    <main className="mx-auto w-full max-w-[720px] px-3 pb-8 pt-5 sm:px-4 lg:pt-7">
      <h1 className={`${pageTitle} mb-5`}>Giỏ hàng</h1>

      {authLoading ? (
        <PageSpinner />
      ) : !loggedIn ? (
        <EmptyState icon={LogIn} title="Đăng nhập bằng tài khoản Chuyên Biên Hòa để xem giỏ hàng.">
          <a href={getLoginUrl()} className={`${btnPrimary} h-11 px-6`}>
            Đăng nhập để tiếp tục
          </a>
        </EmptyState>
      ) : items.length === 0 ? (
        <EmptyState icon={ShoppingCart} title="Giỏ hàng đang trống." hint="Chọn vài món quà rồi quay lại đây nhé.">
          <Link href="/#catalog" className={`${btnPrimary} h-11 px-6`}>
            Tiếp tục mua sắm
          </Link>
        </EmptyState>
      ) : (
        <div className="animate-fade-up">
          <div className={`${card} p-4 sm:p-5`}>
            <div className="flex flex-col divide-y divide-gray-100">
              {items.map((item) => (
                <div key={cartItemKey(item)} className="py-4 first:pt-0 last:pb-0">
                  <CartLineItem item={item} editable />
                </div>
              ))}
            </div>

            <div className="my-4 border-t border-gray-100" />

            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">Tổng cộng</span>
              <span className="text-lg font-extrabold text-brand">
                <Price amount={totalAmount} />
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={clear}
              className="text-sm font-medium text-gray-500 hover:text-red-500"
            >
              Xóa toàn bộ giỏ hàng
            </button>
            <Link href="/checkout" className={`${btnPrimary} group h-12 px-6 sm:px-8`}>
              Tiến hành thanh toán
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
