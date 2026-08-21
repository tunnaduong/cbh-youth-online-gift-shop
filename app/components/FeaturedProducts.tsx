"use client";

import { useEffect, useState } from "react";
import { Star, ShoppingCart } from "lucide-react";
import ProductThumb from "./ProductThumb";
import { getShopProducts, type ShopProduct } from "../lib/shop";
import { getIconForSlug } from "../lib/categoryIcons";
import { useCatalog } from "../contexts/CatalogContext";
import { useCart } from "../contexts/CartContext";

export default function FeaturedProducts() {
  const { activeCategoryId } = useCatalog();
  const { addItem } = useCart();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getShopProducts(activeCategoryId ? { category_id: activeCategoryId } : undefined)
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [activeCategoryId]);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Sản phẩm nổi bật</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-slate-100 bg-white">
              <div className="aspect-square w-full bg-slate-100" />
              <div className="space-y-2 p-3.5">
                <div className="h-3 w-3/4 rounded bg-slate-100" />
                <div className="h-3 w-1/3 rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-400">
          Chưa có sản phẩm nào trong danh mục này.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((product) => (
            <div
              key={product.id}
              className="group overflow-hidden rounded-2xl border border-slate-100 bg-white transition-shadow hover:shadow-md"
            >
              <div className="relative">
                <ProductThumb
                  icon={getIconForSlug(product.category?.slug)}
                  imageUrl={product.image_url}
                  alt={product.name}
                  className="aspect-square w-full"
                />
                {product.stock <= 0 && (
                  <span className="absolute left-2.5 top-2.5 rounded-lg bg-slate-700 px-2 py-1 text-[11px] font-semibold text-white">
                    Hết hàng
                  </span>
                )}
              </div>
              <div className="p-3.5">
                <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-800">
                  {product.name}
                </p>
                <p className="mt-1.5 font-bold text-green-600">
                  {product.price.toLocaleString("vi-VN")}đ
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {product.category?.name ?? "Giftshop"}
                  </span>
                  <span>{product.stock} còn lại</span>
                </div>
                <button
                  onClick={() => addItem(product)}
                  disabled={product.stock <= 0}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-green-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Thêm vào giỏ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
