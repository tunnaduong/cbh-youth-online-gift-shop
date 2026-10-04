"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cartItemKey } from "../../contexts/CartContext";
import CartLineItem from "../CartLineItem";
import Price from "../Price";
import { useCart } from "../../contexts/CartContext";
import { btnPrimary, card } from "../../lib/ui";
import SectionHeader from "../ui/SectionHeader";

export default function MiniCart() {
  const { items, totalQuantity, totalAmount } = useCart();

  return (
    <div className={`${card} p-4`}>
      <SectionHeader icon={ShoppingCart} title="Giỏ hàng của bạn">
        <span
          key={totalQuantity}
          className="flex h-5 min-w-5 animate-bump items-center justify-center rounded-full bg-primary-500 px-1.5 text-[11px] font-bold text-white"
        >
          {totalQuantity}
        </span>
      </SectionHeader>

      {items.length === 0 ? (
        <p className="py-6 text-center text-[13px] text-gray-500">
          Giỏ hàng đang trống.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {items.map((item) => (
            <CartLineItem key={cartItemKey(item)} item={item} />
          ))}
        </div>
      )}

      <div className="my-3 border-t border-gray-100" />

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">Tạm tính:</span>
        <span className="font-bold text-brand">
          <Price amount={totalAmount} />
        </span>
      </div>

      <Link href="/cart" className={`${btnPrimary} mt-4 h-11 w-full`}>
        Xem giỏ hàng
      </Link>
    </div>
  );
}
