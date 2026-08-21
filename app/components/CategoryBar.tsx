"use client";

import { useEffect, useState } from "react";
import { getShopCategories, type ShopCategory } from "../lib/shop";
import { getIconForSlug, AllCategoriesIcon } from "../lib/categoryIcons";
import { useCatalog } from "../contexts/CatalogContext";

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

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[84px] animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
      <CategoryButton
        label="Tất cả"
        Icon={AllCategoriesIcon}
        isActive={activeCategoryId === null}
        onClick={() => setActiveCategoryId(null)}
      />
      {categories.map((category) => (
        <CategoryButton
          key={category.id}
          label={category.name}
          Icon={getIconForSlug(category.slug)}
          isActive={activeCategoryId === category.id}
          onClick={() => setActiveCategoryId(category.id)}
        />
      ))}
    </div>
  );
}

function CategoryButton({
  label,
  Icon,
  isActive,
  onClick,
}: {
  label: string;
  Icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border bg-white px-2 py-4 text-center text-xs font-medium transition-all hover:-translate-y-0.5 hover:shadow-md ${
        isActive
          ? "border-green-600/30 text-green-700 shadow-sm"
          : "border-slate-100 text-slate-600"
      }`}
    >
      <Icon
        className={`h-6 w-6 ${isActive ? "text-green-600" : "text-slate-500"}`}
        strokeWidth={1.6}
      />
      {label}
    </button>
  );
}
