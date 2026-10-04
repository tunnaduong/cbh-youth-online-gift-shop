"use client";

import { useEffect, useState } from "react";
import { Shapes } from "lucide-react";
import { getShopCategories, type ShopCategory } from "../lib/shop";
import { getIconForSlug, AllCategoriesIcon } from "../lib/categoryIcons";
import { useCatalog } from "../contexts/CatalogContext";
import { card, stagger } from "../lib/ui";
import SectionHeader from "./ui/SectionHeader";

const grid = "mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4";

export default function CategoryBar() {
  const { activeCategoryId, setActiveCategoryId } = useCatalog();
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getShopCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="catalog" className={`${card} scroll-mt-24 p-4 sm:p-5`}>
      <SectionHeader icon={Shapes} title="Danh mục" />

      {loading ? (
        <div className={grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="shimmer h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className={`${grid} stagger`}>
          <CategoryButton
            index={0}
            label="Tất cả"
            Icon={AllCategoriesIcon}
            isActive={activeCategoryId === null}
            onClick={() => setActiveCategoryId(null)}
          />
          {categories.map((category, i) => (
            <CategoryButton
              key={category.id}
              index={i + 1}
              label={category.name}
              Icon={getIconForSlug(category.slug)}
              isActive={activeCategoryId === category.id}
              onClick={() => setActiveCategoryId(category.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CategoryButton({
  index,
  label,
  Icon,
  isActive,
  onClick,
}: {
  index: number;
  label: string;
  Icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    // A tinted tile with the icon in its own little square, lifting on hover -
    // the main site's category tiles. The chosen one turns solid green.
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      style={stagger(index)}
      // min-w-0 + overflow-wrap: a long category name in a narrow cell would
      // otherwise widen its grid cell past the screen edge.
      className={`group flex min-w-0 items-center gap-3 rounded-xl p-3 text-left text-[13px] font-medium [overflow-wrap:anywhere] transition duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] ${
        isActive ? "bg-primary-500 text-white shadow-glow" : "bg-chip text-gray-700"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${
          isActive ? "bg-white/20 text-white" : "bg-surface text-brand"
        }`}
      >
        <Icon className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" strokeWidth={2} />
      </span>
      <span className="min-w-0 leading-snug">{label}</span>
    </button>
  );
}
