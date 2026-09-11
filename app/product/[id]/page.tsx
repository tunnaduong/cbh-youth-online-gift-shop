"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingCart, Star } from "lucide-react";
import Header from "../../components/Header";
import ProductThumb from "../../components/ProductThumb";
import { getIconForSlug } from "../../lib/categoryIcons";
import { getShopProduct, type ShopProduct } from "../../lib/shop";
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

  useEffect(() => {
    getShopProduct(Number(id))
      .then(setProduct)
      .catch(() => setError("Không tìm thấy sản phẩm."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity);
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
              imageUrl={product.image_url}
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
                {product.price.toLocaleString("vi-VN")}đ
              </p>

              {product.description && (
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {product.description}
                </p>
              )}

              <p className="mt-4 text-sm text-slate-500">
                {product.stock > 0 ? (
                  <>Còn <span className="font-semibold text-slate-700">{product.stock}</span> sản phẩm</>
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
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {added ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
