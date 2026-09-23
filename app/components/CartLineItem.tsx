"use client";

import Link from "next/link";
import { Minus, Plus, X } from "lucide-react";
import ProductThumb from "./ProductThumb";
import Price from "./Price";
import { getIconForSlug } from "../lib/categoryIcons";
import type { CartItem } from "../contexts/CartContext";
import { cartItemKey, cartItemPrice, cartItemStock, useCart } from "../contexts/CartContext";
import { variantLabel } from "../lib/shop";

// Shared between the compact MiniCart preview (editable=false) and the full
// /cart page (editable=true) so the two stay visually consistent.
export default function CartLineItem({
  item,
  editable = false,
}: {
  item: CartItem;
  editable?: boolean;
}) {
  const { setQuantity, removeItem } = useCart();
  const { product, variant, quantity } = item;
  const key = cartItemKey(item);

  return (
    <div className="flex items-center gap-3">
      <Link href={`/product/${product.id}`} className="shrink-0">
        <ProductThumb
          icon={getIconForSlug(product.category?.slug)}
          imageUrl={variant?.image_url || product.image_url}
          alt={product.name}
          className={editable ? "h-16 w-16 rounded-xl" : "h-12 w-12 rounded-xl"}
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={`/product/${product.id}`}>
          <p className="truncate text-sm font-medium text-slate-800 hover:text-green-700">
            {product.name}
          </p>
        </Link>
        {variant && (
          <p className="truncate text-xs text-slate-500">{variantLabel(variant, product.options)}</p>
        )}
        <p className="text-sm font-semibold text-green-600">
          <Price amount={cartItemPrice(item)} />
        </p>
      </div>

      {editable ? (
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-slate-200 px-1 py-1">
            <button
              type="button"
              onClick={() => setQuantity(key, quantity - 1)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              aria-label="Giảm số lượng"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-6 text-center text-sm font-semibold text-slate-800">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(key, quantity + 1)}
              disabled={quantity >= cartItemStock(item)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
              aria-label="Tăng số lượng"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => removeItem(key)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500"
            aria-label="Xóa khỏi giỏ hàng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <span className="shrink-0 text-xs text-slate-400">x{quantity}</span>
      )}
    </div>
  );
}
