"use client";

import { useEffect, useState } from "react";
import { Flame, PackageSearch } from "lucide-react";
import { getShopProducts, type ShopProduct } from "../lib/shop";
import { useCatalog } from "../contexts/CatalogContext";
import EmptyState from "./ui/EmptyState";
import ProductCard, { ProductCardSkeleton, productGrid } from "./ui/ProductCard";
import SectionHeader from "./ui/SectionHeader";

const grid = `${productGrid} xl:grid-cols-4`;

export default function FeaturedProducts() {
  const { activeCategoryId, search } = useCatalog();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShopProducts({
      ...(activeCategoryId ? { category_id: activeCategoryId } : {}),
      ...(search ? { search } : {}),
    })
      .then((res) => setProducts(res.data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [activeCategoryId, search]);

  return (
    <section className="flex flex-col gap-3 sm:gap-4">
      <SectionHeader icon={Flame} title="Sản phẩm nổi bật" href="/products" />

      {loading ? (
        <div className={grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState icon={PackageSearch} title="Chưa có sản phẩm nào trong danh mục này." />
      ) : (
        // Keyed by the filter, so picking another category replays the
        // staggered entrance instead of swapping the cards in place.
        <div key={`${activeCategoryId}-${search}`} className={`${grid} stagger`}>
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}
