"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, ShoppingCart, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import Header from "../components/Header";
import ProductThumb from "../components/ProductThumb";
import Price from "../components/Price";
import { getIconForSlug, AllCategoriesIcon } from "../lib/categoryIcons";
import {
  getShopCategories,
  getShopProducts,
  type ShopCategory,
  type ShopProduct,
} from "../lib/shop";
import { useCart } from "../contexts/CartContext";

export default function ProductsContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { addItem } = useCart();

  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(params.get("search") ?? "");

  const categoryId = params.get("category") ? Number(params.get("category")) : null;
  const search = params.get("search") ?? "";
  const page = params.get("page") ? Number(params.get("page")) : 1;

  const pushParams = useCallback(
    (patch: Record<string, string | null>) => {
      const qs = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") qs.delete(k);
        else qs.set(k, v);
      }
      if (!("page" in patch)) qs.delete("page");
      router.push(`/products?${qs.toString()}`);
    },
    [params, router]
  );

  useEffect(() => {
    getShopCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    getShopProducts({
      ...(categoryId ? { category_id: categoryId } : {}),
      ...(search ? { search } : {}),
    })
      .then((res) => {
        setProducts(res.data);
        setTotalPages(res.last_page);
        setTotal(res.total);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categoryId, search, page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    pushParams({ search: searchInput || null });
  };

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-[1280px] px-4 py-6 sm:px-6">
        {/* Page title + search */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Sản phẩm</h1>
            {!loading && (
              <p className="mt-0.5 text-sm text-slate-500">
                {total.toLocaleString("vi-VN")} sản phẩm
                {search && (
                  <> cho &ldquo;<span className="font-medium text-slate-700">{search}</span>&rdquo;</>
                )}
              </p>
            )}
          </div>

          <form onSubmit={handleSearch} className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm text-slate-700 placeholder:text-slate-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-600/20"
            />
            <button
              type="submit"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-green-600"
              aria-label="Tìm kiếm"
            >
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>

        {/* Category filter pills — horizontal scroll on mobile */}
        <div className="-mx-4 mb-6 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <CategoryPill
              label="Tất cả"
              Icon={AllCategoriesIcon}
              active={categoryId === null}
              onClick={() => pushParams({ category: null })}
            />
            {categories.map((c) => (
              <CategoryPill
                key={c.id}
                label={c.name}
                Icon={getIconForSlug(c.slug)}
                active={categoryId === c.id}
                onClick={() => pushParams({ category: String(c.id) })}
              />
            ))}
          </div>
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
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
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-16 text-center">
            <SlidersHorizontal className="h-10 w-10 text-slate-300" />
            <p className="text-sm text-slate-500">Không tìm thấy sản phẩm nào.</p>
            <button
              onClick={() => { setSearchInput(""); pushParams({ search: null, category: null }); }}
              className="mt-1 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              Xem tất cả
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} onAdd={() => addItem(product)} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => pushParams({ page: String(page - 1) })}
              disabled={page <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:border-green-500 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
                return (
                  <button
                    key={p}
                    onClick={() => pushParams({ page: p === 1 ? null : String(p) })}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                      p === page
                        ? "bg-green-600 text-white"
                        : "border border-slate-200 text-slate-600 hover:border-green-500 hover:text-green-700"
                    }`}
                  >
                    {p}
                  </button>
                );
              }
              if (Math.abs(p - page) === 2) {
                return <span key={p} className="text-slate-400">…</span>;
              }
              return null;
            })}
            <button
              onClick={() => pushParams({ page: String(page + 1) })}
              disabled={page >= totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:border-green-500 hover:text-green-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>
    </>
  );
}

function CategoryPill({
  label, Icon, active, onClick,
}: {
  label: string;
  Icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-green-600 bg-green-600 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-green-500 hover:text-green-700"
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.6} />
      {label}
    </button>
  );
}

function ProductCard({ product, onAdd }: { product: ShopProduct; onAdd: () => void }) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-100 bg-white transition-shadow hover:shadow-md">
      <Link href={`/product/${product.id}`} className="block">
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
          {product.category && (
            <span className="absolute right-2.5 top-2.5 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-600 backdrop-blur-sm">
              {product.category.name}
            </span>
          )}
        </div>
      </Link>

      <div className="p-3.5">
        <Link href={`/product/${product.id}`}>
          <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-800 hover:text-green-700">
            {product.name}
          </p>
        </Link>
        <p className="mt-1.5">
          <Price amount={product.price} showPoints />
        </p>
        <p className="mt-1 text-xs text-slate-400">{product.stock} còn lại</p>

        {product.variants_count ? (
          <Link
            href={`/product/${product.id}`}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-green-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700"
          >
            Chọn phân loại
          </Link>
        ) : (
          <button
            onClick={onAdd}
            disabled={product.stock <= 0}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-green-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            Thêm vào giỏ
          </button>
        )}
      </div>
    </div>
  );
}
