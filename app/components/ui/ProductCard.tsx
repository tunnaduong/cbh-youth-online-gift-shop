"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ShoppingCart } from "lucide-react";
import ProductThumb from "../ProductThumb";
import Price from "../Price";
import { getIconForSlug } from "../../lib/categoryIcons";
import { btnPrimary, skeleton, stagger } from "../../lib/ui";
import type { ShopProduct } from "../../lib/shop";
import { useCart } from "../../contexts/CartContext";
import { useToast } from "../../contexts/ToastContext";

/**
 * The one product card, used by the home grid, the /products listing and
 * "related products" (it used to be written out three times, each slightly
 * different). Modelled on the main site's study-material card: the whole card
 * lifts and its border turns green on hover, the photo zooms a little, and
 * the title turns green.
 */
export default function ProductCard({
  product,
  index = 0,
}: {
  product: ShopProduct;
  /** Position in the grid, for the staggered entrance. */
  index?: number;
}) {
  const { addItem } = useCart();
  const toast = useToast();
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const href = `/product/${product.id}`;
  const soldOut = product.stock <= 0;

  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    []
  );

  const handleAdd = () => {
    addItem(product);
    toast(`Đã thêm "${product.name}" vào giỏ hàng`);
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div
      style={stagger(index)}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-card-border bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lift"
    >
      <Link href={href} className="relative block overflow-hidden">
        <ProductThumb
          icon={getIconForSlug(product.category?.slug)}
          imageUrl={product.image_url}
          alt={product.name}
          className="aspect-square w-full"
          zoom
        />
        {soldOut && (
          <span className="absolute left-2.5 top-2.5 rounded-md bg-gray-900/80 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">
            Hết hàng
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
          <span className="truncate">{product.category?.name ?? "Giftshop"}</span>
        </p>
        <Link href={href}>
          <p className="mt-1.5 line-clamp-2 min-h-[2.625rem] text-[15px] font-semibold leading-snug text-gray-900 transition-colors group-hover:text-brand-strong">
            {product.name}
          </p>
        </Link>
        <p className="mt-1.5">
          <Price amount={product.price} showPoints />
        </p>

        <div className="mt-auto pt-3">
          <p className="mb-2 text-xs tabular-nums text-gray-400">
            {soldOut ? "Tạm hết hàng" : `Còn ${product.stock} sản phẩm`}
          </p>
          {product.variants_count ? (
            <Link href={href} className={`${btnPrimary} h-9 w-full text-xs`}>
              Chọn phân loại
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              disabled={soldOut}
              className={`${btnPrimary} h-9 w-full text-xs`}
            >
              {added ? (
                <>
                  <Check className="h-4 w-4 animate-check-pop" strokeWidth={3} />
                  Đã thêm
                </>
              ) : (
                <>
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Thêm vào giỏ
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Same shell as the card, shimmering, while products load. */
export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-card-border bg-surface shadow-card">
      <div className="shimmer aspect-square w-full" />
      <div className="space-y-2.5 p-3.5">
        <div className={`${skeleton} h-2.5 w-1/3`} />
        <div className={`${skeleton} h-3.5 w-4/5`} />
        <div className={`${skeleton} h-3.5 w-1/2`} />
        <div className={`${skeleton} mt-4 h-9 w-full rounded-xl`} />
      </div>
    </div>
  );
}

export const productGrid = "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4";
