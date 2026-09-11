"use client";

import { ShoppingCart } from "lucide-react";
import CartLineItem from "../CartLineItem";
import { useCart } from "../../contexts/CartContext";

export default function MiniCart() {
  const { items, totalQuantity, totalAmount } = useCart();

  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 text-slate-700" />
        <h3 className="text-sm font-bold text-slate-800">Giỏ hàng của bạn</h3>
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[11px] font-bold text-white">
          {totalQuantity}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-center text-xs text-slate-400">
          Giỏ hàng đang trống.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <CartLineItem key={item.product.id} item={item} />
          ))}
        </div>
      )}

      <div className="my-3 border-t border-slate-100" />

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Tạm tính:</span>
        <span className="font-bold text-green-600">
          {totalAmount.toLocaleString("vi-VN")}đ
        </span>
      </div>

      <a
        href="/cart"
        className="mt-4 block w-full rounded-xl bg-green-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-green-700"
      >
        Xem giỏ hàng
      </a>
    </div>
  );
}
