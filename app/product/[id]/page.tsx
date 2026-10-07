"use client";

import { useEffect, useMemo, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { Boxes, Check, ChevronRight, Minus, Plus, ShoppingCart, Package, Tag, CheckCircle2, MessageCircle } from "lucide-react";
import ProductThumb from "../../components/ProductThumb";
import Price from "../../components/Price";
import EmptyState from "../../components/ui/EmptyState";
import ProductCard, { productGrid } from "../../components/ui/ProductCard";
import Reveal from "../../components/ui/Reveal";
import SectionHeader from "../../components/ui/SectionHeader";
import { btnOutline, btnPrimary, card, skeleton, stagger } from "../../lib/ui";
import { useToast } from "../../contexts/ToastContext";
import { getIconForSlug } from "../../lib/categoryIcons";
import { contactShop, getShopProduct, getShopProducts, vndToPoints, type ShopProduct } from "../../lib/shop";
import { useCart } from "../../contexts/CartContext";
import { useStudentDiscount } from "../../contexts/StudentDiscountContext";
import { useAuth } from "../../contexts/AuthContext";
import { useChatWidget } from "../../contexts/ChatWidgetContext";
import { getLoginUrl } from "../../lib/auth";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { addItem } = useCart();
  const { discounted } = useStudentDiscount();
  const { loggedIn } = useAuth();
  const { openChat } = useChatWidget();
  const toast = useToast();
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [related, setRelated] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [contacting, setContacting] = useState(false);

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
    toast(`Đã thêm ${quantity} sản phẩm vào giỏ hàng`);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleContactShop = async () => {
    if (!product) return;
    if (!loggedIn) {
      window.location.href = getLoginUrl();
      return;
    }
    setContacting(true);
    try {
      const { conversation_id } = await contactShop(product.id, variant?.id);
      openChat(conversation_id);
    } catch (error) {
      console.error("Failed to contact shop:", error);
      toast("Không kết nối được với shop, vui lòng thử lại.", "error");
    } finally {
      setContacting(false);
    }
  };


  return (
    <main className="mx-auto w-full max-w-[1240px] px-3 pb-8 pt-5 sm:px-4 lg:px-6 lg:pt-7">
      {/* Breadcrumb */}
      <nav className="mb-5 flex items-center gap-1 text-[13px] text-gray-500">
        <Link href="/" className="shrink-0 hover:text-brand-strong">Trang chủ</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        {product?.category && (
          <>
            <Link href={`/products?category=${product.category.id}`} className="shrink-0 hover:text-brand-strong">
              {product.category.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          </>
        )}
        <span className="line-clamp-1 min-w-0 text-gray-800">{product?.name ?? "Sản phẩm"}</span>
      </nav>

      {loading ? (
        // Same grid as the loaded page, so nothing shifts when it arrives.
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
          <div className="shimmer aspect-square rounded-2xl" />
          <div className="space-y-4">
            <div className={`${skeleton} h-3.5 w-1/4`} />
            <div className={`${skeleton} h-8 w-4/5`} />
            <div className={`${skeleton} h-[84px] w-full rounded-2xl`} />
            <div className={`${skeleton} h-24 w-full`} />
            <div className={`${skeleton} h-12 w-full rounded-xl`} />
          </div>
        </div>
      ) : error || !product ? (
        <EmptyState icon={Package} title={error ?? "Không tìm thấy sản phẩm."}>
          <Link href="/" className={`${btnPrimary} h-11 px-6`}>
            Về trang chủ
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
            {/* Image: picking a variant with its own photo fades the new one in
                (ProductThumb keys the image by its URL). */}
            <div className={`${card} animate-fade-up self-start overflow-hidden lg:sticky lg:top-[85px]`}>
              <ProductThumb
                icon={getIconForSlug(product.category?.slug)}
                imageUrl={variant?.image_url || product.image_url}
                alt={product.name}
                className="aspect-square w-full"
              />
            </div>

            {/* Info */}
            <div className="stagger flex min-w-0 flex-col">
              <div style={stagger(1)}>
                {product.category && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-1 text-[11px] font-semibold text-brand-strong">
                    <Tag className="h-3 w-3" />
                    {product.category.name}
                  </span>
                )}
                <h1 className="mt-2.5 text-[26px] font-bold leading-tight text-gray-900 sm:text-[30px]">
                  {product.name}
                </h1>
              </div>

              <div style={stagger(2)} className="mt-4 rounded-2xl bg-primary-50 px-5 py-4">
                {!variant && maxPrice > minPrice ? (
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <Price amount={minPrice} size="lg" />
                    <span className="text-2xl font-bold text-brand-strong">–</span>
                    <Price amount={maxPrice} size="lg" />
                  </div>
                ) : (
                  <Price amount={price} size="lg" />
                )}
                <p className="mt-0.5 text-sm text-brand/80">
                  {!variant && maxPrice > minPrice ? "từ " : ""}
                  {vndToPoints(discounted(price)).toLocaleString("vi-VN")} điểm
                </p>
              </div>

              <div style={stagger(3)}>
                {product.description && (
                  <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-gray-700">
                    {product.description}
                  </p>
                )}

                {/* Variants */}
                {hasVariants && options.map((o) => (
                  <div key={o.name} className="mt-5">
                    <p className="mb-2 text-sm font-semibold text-gray-800">{o.name}</p>
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
                            aria-pressed={active}
                            className={`rounded-xl border px-4 py-2 text-sm font-medium transition duration-200 active:scale-95 ${
                              active
                                ? "border-primary-500 bg-primary-500 text-white shadow-glow"
                                : "border-gray-200 bg-surface text-gray-700 hover:border-primary-300 hover:bg-primary-50 hover:text-brand-strong"
                            } disabled:cursor-not-allowed disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-300 disabled:line-through disabled:active:scale-100`}
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
                      <CheckCircle2 className="h-4 w-4 text-brand" />
                      <span className="text-gray-700">
                        Còn <span className="font-semibold tabular-nums text-gray-900">{stock}</span> sản phẩm
                      </span>
                    </>
                  ) : (
                    <span className="font-semibold text-red-500">Hết hàng</span>
                  )}
                </div>
              </div>

              {/* Qty + Add to cart. Wraps: on a 360px phone the three controls
                  don't fit on one line. */}
              <div style={stagger(4)} className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex h-12 items-center gap-1 rounded-xl border border-gray-200 bg-surface px-1.5">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition duration-150 hover:bg-gray-100 active:scale-90"
                    aria-label="Giảm số lượng"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold tabular-nums text-gray-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
                    disabled={quantity >= stock}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition duration-150 hover:bg-gray-100 active:scale-90 disabled:cursor-not-allowed disabled:text-gray-300 disabled:active:scale-100"
                    aria-label="Tăng số lượng"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={stock <= 0 || (hasVariants && !variant)}
                  className={`${btnPrimary} h-12 min-w-[170px] flex-1 px-4`}
                >
                  {added ? (
                    <>
                      <Check className="h-[18px] w-[18px] animate-check-pop" strokeWidth={3} />
                      Đã thêm vào giỏ
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      {hasVariants && !variant ? "Chọn phân loại" : "Thêm vào giỏ hàng"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleContactShop}
                  disabled={contacting}
                  className={`${btnOutline} h-12 px-4`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{contacting ? "Đang kết nối..." : "Nhắn tin"}</span>
                </button>
              </div>

              {/* Perks */}
              <div style={stagger(5)} className="mt-6 space-y-2 rounded-2xl bg-chip p-4 text-sm text-gray-700">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand" /> Giao hàng quanh Hà Nam cũ</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand" /> Thanh toán bằng điểm hoặc QR</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-brand" /> Sản phẩm chính hãng từ CBH</div>
              </div>
            </div>
          </div>

          {/* Related products */}
          {related.length > 0 && (
            <Reveal className="mt-10">
              <section className="flex flex-col gap-3 sm:gap-4">
                <SectionHeader
                  icon={Boxes}
                  title="Sản phẩm cùng danh mục"
                  href={product.category ? `/products?category=${product.category.id}` : "/products"}
                />
                <div className={`${productGrid} lg:grid-cols-4`}>
                  {related.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            </Reveal>
          )}
        </>
      )}
    </main>
  );
}
