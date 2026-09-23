"use client";

import { useEffect, useMemo, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { ChevronRight, Minus, Plus, ShoppingCart, Package, Tag, CheckCircle2 } from "lucide-react";
import Header from "../../components/Header";
import ProductThumb from "../../components/ProductThumb";
import Price from "../../components/Price";
import { getIconForSlug } from "../../lib/categoryIcons";
import { getShopProduct, getShopProducts, vndToPoints, type ShopProduct } from "../../lib/shop";
import { useCart } from "../../contexts/CartContext";
import { useStudentDiscount } from "../../contexts/StudentDiscountContext";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { addItem } = useCart();
  const { discounted } = useStudentDiscount();
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [related, setRelated] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});

  const options = useMemo(() => product?.options ?? [], [product]);
  const variants = useMemo(() => product?.variants ?? [], [product]);
  const hasVariants = options.length > 0 && variants.length > 0;
  const allChosen = options.every((o) => selected[o.name]);
  const variant = hasVariants && allChosen
    ? variants.find((v) => options.every((o) => v.options[o.name] === selected[o.name])) ?? null
    : null;

  const prices = variants.map((v) => v.price);
  const minPrice = hasVariants ? Math.min(...prices) : product?.price ?? 0;
  const maxPrice = hasVariants ? Math.max(...prices) : minPrice;
  const price = variant?.price ?? minPrice;
  const stock = hasVariants ? (variant ? variant.stock : product?.stock ?? 0) : product?.stock ?? 0;

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
      .then((p) => {
        setProduct(p);
        if (p.category_id) {
          getShopProducts({ category_id: p.category_id })
            .then((res) => setRelated(res.data.filter((r) => r.id !== p.id).slice(0, 4)))
            .catch(() => {});
        }
      })
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
      <main className="mx-auto w-full max-w-[1280px] px-6 py-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1 text-sm text-slate-500">
          <Link href="/" className="hover:text-green-700">Trang chủ</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          {product?.category && (
            <>
              <Link href={`/?category=${product.category.id}`} className="hover:text-green-700">
                {product.category.name}
              </Link>
              <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
          <span className="line-clamp-1 text-slate-700">{product?.name ?? "Sản phẩm"}</span>
        </nav>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="aspect-square animate-pulse rounded-2xl bg-slate-100" />
            <div className="space-y-3">
              <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
              <div className="h-7 w-3/4 animate-pulse rounded bg-slate-100" />
              <div className="h-7 w-1/2 animate-pulse rounded bg-slate-100" />
              <div className="h-24 w-full animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ) : error || !product ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <Package className="h-12 w-12 text-slate-300" />
            <p className="text-sm text-slate-500">{error ?? "Không tìm thấy sản phẩm."}</p>
            <Link
              href="/"
              className="mt-1 rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700"
            >
              Về trang chủ
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              {/* Image */}
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <ProductThumb
                  icon={getIconForSlug(product.category?.slug)}
                  imageUrl={variant?.image_url || product.image_url}
                  alt={product.name}
                  className="aspect-square w-full"
                />
              </div>

              {/* Info */}
              <div className="flex flex-col">
                {product.category && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                    <Tag className="h-3.5 w-3.5" />
                    {product.category.name}
                  </span>
                )}
                <h1 className="mt-2 text-2xl font-extrabold leading-snug text-slate-800 sm:text-3xl">
                  {product.name}
                </h1>

                <div className="mt-4 rounded-2xl bg-green-50 px-5 py-4">
                  {!variant && maxPrice > minPrice ? (
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <Price amount={minPrice} size="lg" />
                      <span className="text-2xl font-bold text-green-700">–</span>
                      <Price amount={maxPrice} size="lg" />
                    </div>
                  ) : (
                    <Price amount={price} size="lg" />
                  )}
                  <p className="mt-0.5 text-sm text-green-600/80">
                    {!variant && maxPrice > minPrice ? "từ " : ""}
                    {vndToPoints(discounted(price)).toLocaleString("vi-VN")} điểm
                  </p>
                </div>

                {product.description && (
                  <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {product.description}
                  </p>
                )}

                {/* Variants */}
                {hasVariants && options.map((o) => (
                  <div key={o.name} className="mt-5">
                    <p className="mb-2 text-sm font-semibold text-slate-700">{o.name}</p>
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
                            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                              active
                                ? "border-green-600 bg-green-600 text-white shadow-sm"
                                : "border-slate-200 bg-white text-slate-700 hover:border-green-500 hover:text-green-700"
                            } disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300 disabled:line-through`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Stock */}
                <div className="mt-5 flex items-center gap-2 text-sm">
                  {stock > 0 ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-slate-600">
                        Còn <span className="font-semibold text-slate-800">{stock}</span> sản phẩm
                      </span>
                    </>
                  ) : (
                    <span className="font-semibold text-red-500">Hết hàng</span>
                  )}
                </div>

                {/* Qty + Add to cart */}
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-1 py-1">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                      aria-label="Giảm số lượng"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-slate-800">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                      disabled={quantity >= stock}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:cursor-not-allowed disabled:text-slate-300"
                      aria-label="Tăng số lượng"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={stock <= 0 || (hasVariants && !variant)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    {added
                      ? "Đã thêm vào giỏ ✓"
                      : hasVariants && !variant
                        ? "Chọn phân loại"
                        : "Thêm vào giỏ hàng"}
                  </button>
                </div>

                {/* Perks */}
                <div className="mt-6 space-y-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Giao hàng toàn quốc</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Thanh toán bằng điểm hoặc QR</div>
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Sản phẩm chính hãng từ CBH</div>
                </div>
              </div>
            </div>

            {/* Related products */}
            {related.length > 0 && (
              <section className="mt-12">
                <h2 className="mb-4 text-lg font-bold text-slate-800">Sản phẩm cùng danh mục</h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {related.map((p) => (
                    <Link
                      key={p.id}
                      href={`/product/${p.id}`}
                      className="group overflow-hidden rounded-2xl border border-slate-100 bg-white transition-shadow hover:shadow-md"
                    >
                      <ProductThumb
                        icon={getIconForSlug(p.category?.slug)}
                        imageUrl={p.image_url}
                        alt={p.name}
                        className="aspect-square w-full"
                      />
                      <div className="p-3">
                        <p className="line-clamp-2 text-sm font-semibold text-slate-800 group-hover:text-green-700">
                          {p.name}
                        </p>
                        <p className="mt-1 text-sm">
                          <Price amount={p.price} />
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
