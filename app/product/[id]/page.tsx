"use client";

import { useEffect, useMemo, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Star } from "lucide-react";
import Header from "../../components/Header";
import ProductThumb from "../../components/ProductThumb";
import { getIconForSlug } from "../../lib/categoryIcons";
import { getShopProduct, vndToPoints, type ShopProduct } from "../../lib/shop";
import { useCart } from "../../contexts/CartContext";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { addItem } = useCart();
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  // Option group name -> chosen value, e.g. { Size: "M" }
  const [selected, setSelected] = useState<Record<string, string>>({});

  const options = useMemo(() => product?.options ?? [], [product]);
  const variants = useMemo(() => product?.variants ?? [], [product]);
  const hasVariants = options.length > 0 && variants.length > 0;
  const allChosen = options.every((o) => selected[o.name]);
  const variant = hasVariants && allChosen
    ? variants.find((v) => options.every((o) => v.options[o.name] === selected[o.name])) ?? null
    : null;

  // Price range across variants until one is picked.
  const prices = variants.map((v) => v.price);
  const minPrice = hasVariants ? Math.min(...prices) : product?.price ?? 0;
  const maxPrice = hasVariants ? Math.max(...prices) : minPrice;
  const price = variant?.price ?? minPrice;
  const stock = hasVariants ? (variant ? variant.stock : product?.stock ?? 0) : product?.stock ?? 0;

  // A value is unavailable when no in-stock variant matches it together with the other picks.
  const isValueAvailable = (optionName: string, value: string) =>
    variants.some(
      (v) =>
        v.stock > 0 &&
        v.options[optionName] === value &&
        options.every((o) => o.name === optionName || !selected[o.name] || v.options[o.name] === selected[o.name])
    );

  const toggleValue = (optionName: string, value: string) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[optionName] === value) delete next[optionName];
      else next[optionName] = value;
      return next;
    });
    setQuantity(1);
  };

  useEffect(() => {
    getShopProduct(Number(id))
      .then(setProduct)
      .catch(() => setError("Không tìm thấy sản phẩm."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product || (hasVariants && !variant)) return;
    addItem(product, quantity, variant);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[1000px] px-6 py-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-2xl bg-slate-100" />
            <div className="space-y-3">
              <div className="h-6 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="h-5 w-1/3 animate-pulse rounded bg-slate-100" />
              <div className="h-24 w-full animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ) : error || !product ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <p className="text-sm text-slate-500">
              {error ?? "Không tìm thấy sản phẩm."}
            </p>
            <Link
              href="/"
              className="mt-1 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
            >
              Về trang chủ
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <ProductThumb
              icon={getIconForSlug(product.category?.slug)}
              imageUrl={variant?.image_url || product.image_url}
              alt={product.name}
              className="aspect-square w-full rounded-2xl"
            />

            <div className="flex flex-col">
              <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {product.category?.name ?? "Giftshop"}
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-800">
                {product.name}
              </h1>
              <p className="mt-3 text-2xl font-bold text-green-600">
                {!variant && maxPrice > minPrice
                  ? `${minPrice.toLocaleString("vi-VN")}đ - ${maxPrice.toLocaleString("vi-VN")}đ`
                  : `${price.toLocaleString("vi-VN")}đ`}{" "}
                <span className="text-xs font-medium text-slate-400">
                  · {!variant && maxPrice > minPrice ? "từ " : ""}
                  {vndToPoints(price).toLocaleString("vi-VN")} điểm
                </span>
              </p>

              {product.description && (
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {product.description}
                </p>
              )}

              {hasVariants &&
                options.map((o) => (
                  <div key={o.name} className="mt-5">
                    <p className="mb-2 text-sm font-medium text-slate-600">{o.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {o.values.map((value) => {
                        const active = selected[o.name] === value;
                        const available = isValueAvailable(o.name, value);
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => toggleValue(o.name, value)}
                            disabled={!available && !active}
                            className={`rounded-lg border px-3.5 py-1.5 text-sm transition-colors ${
                              active
                                ? "border-green-600 bg-green-50 font-semibold text-green-700"
                                : "border-slate-200 text-slate-700 hover:border-green-500"
                            } disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300 disabled:line-through`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

              <p className="mt-4 text-sm text-slate-500">
                {stock > 0 ? (
                  <>Còn <span className="font-semibold text-slate-700">{stock}</span> sản phẩm</>
                ) : (
                  <span className="font-semibold text-red-500">Hết hàng</span>
                )}
              </p>

              <div className="mt-6 flex items-center gap-4">
                <div className="flex items-center gap-1 rounded-full border border-slate-200 px-1 py-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-slate-800">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                    disabled={quantity >= stock}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={stock <= 0 || (hasVariants && !variant)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {added
                    ? "Đã thêm vào giỏ"
                    : hasVariants && !variant
                      ? "Chọn phân loại"
                      : "Thêm vào giỏ"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
