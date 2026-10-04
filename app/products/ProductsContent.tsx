"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import ProductCard, { ProductCardSkeleton, productGrid } from "../components/ui/ProductCard";
import { getIconForSlug, AllCategoriesIcon } from "../lib/categoryIcons";
import {
  getShopCategories,
  getShopProducts,
  type ShopCategory,
  type ShopProduct,
} from "../lib/shop";
import { btnPrimary, input, pageTitle } from "../lib/ui";

const grid = `${productGrid} lg:grid-cols-4 xl:grid-cols-5`;

const pageBtn =
  "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-semibold transition duration-200 active:scale-95";
const pageBtnIdle =
  "border border-gray-200 bg-surface text-gray-600 hover:border-primary-300 hover:bg-primary-50 hover:text-brand-strong";

export default function ProductsContent() {
  const router = useRouter();
  const params = useSearchParams();

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
    <main className="mx-auto w-full max-w-[1240px] px-3 pb-8 pt-5 sm:px-4 lg:px-6 lg:pt-7">
      {/* Page title + search */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className={pageTitle}>Sản phẩm</h1>
          {/* Keeps its line while loading, so the layout doesn't jump. */}
          <p className="mt-1 min-h-5 text-sm text-gray-500">
            {!loading && (
              <span className="animate-fade-in">
                {total.toLocaleString("vi-VN")} sản phẩm
                {search && (
                  <> cho &ldquo;<span className="font-medium text-gray-800">{search}</span>&rdquo;</>
                )}
              </span>
            )}
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            aria-label="Tìm kiếm sản phẩm"
            className={`${input} h-11 pl-10`}
          />
        </form>
      </div>

      {/* Category filter pills — horizontal scroll on mobile */}
      <div className="-mx-3 mb-6 px-3 sm:mx-0 sm:px-0">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
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
        <div className={grid}>
          {Array.from({ length: 10 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={SlidersHorizontal}
          title="Không tìm thấy sản phẩm nào."
          hint="Thử từ khóa khác hoặc xem tất cả sản phẩm."
        >
          <button
            type="button"
            onClick={() => { setSearchInput(""); pushParams({ search: null, category: null }); }}
            className={`${btnPrimary} h-10 px-5`}
          >
            Xem tất cả
          </button>
        </EmptyState>
      ) : (
        <div className={`${grid} stagger`}>
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => pushParams({ page: String(page - 1) })}
            disabled={page <= 1}
            aria-label="Trang trước"
            className={`${pageBtn} ${pageBtnIdle} disabled:cursor-not-allowed disabled:opacity-40`}
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
                  aria-current={p === page ? "page" : undefined}
                  className={`${pageBtn} ${
                    p === page ? "bg-primary-500 text-white shadow-glow" : pageBtnIdle
                  }`}
                >
                  {p}
                </button>
              );
            }
            if (Math.abs(p - page) === 2) {
              return <span key={p} className="text-gray-400">…</span>;
            }
            return null;
          })}
          <button
            onClick={() => pushParams({ page: String(page + 1) })}
            disabled={page >= totalPages}
            aria-label="Trang sau"
            className={`${pageBtn} ${pageBtnIdle} disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </main>
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
    // The main site's filter pills: solid green when chosen, grey otherwise.
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex h-[42px] shrink-0 items-center gap-1.5 rounded-full px-5 text-sm font-medium transition duration-200 active:scale-95 ${
        active
          ? "bg-primary-500 text-white shadow-glow"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={2} />
      {label}
    </button>
  );
}
