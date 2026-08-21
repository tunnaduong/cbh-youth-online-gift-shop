"use client";

import { ShoppingCart } from "lucide-react";
import ProductThumb from "../ProductThumb";
import { getIconForSlug } from "../../lib/categoryIcons";
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
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex items-center gap-3">
              <ProductThumb
                icon={getIconForSlug(product.category?.slug)}
                imageUrl={product.image_url}
                alt={product.name}
                className="h-12 w-12 shrink-0 rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{product.name}</p>
                <p className="text-sm font-semibold text-green-600">
                  {product.price.toLocaleString("vi-VN")}đ
                </p>
              </div>
              <span className="text-xs text-slate-400">x{quantity}</span>
            </div>
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
        href="/checkout"
        className="mt-4 block w-full rounded-xl bg-green-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-green-700"
      >
        Xem giỏ hàng
      </a>
    </div>
  );
}
