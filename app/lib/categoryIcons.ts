import {
  LayoutGrid,
  Shirt,
  KeyRound,
  Smile,
  PenLine,
  NotebookText,
  ShoppingBag,
  Watch,
  Gift,
  type LucideIcon,
} from "lucide-react";

// Products/categories have no image_url in most seed data yet - map by slug
// keyword so the storefront still looks like a real catalog (not a wall of
// generic boxes) until every product has real photography uploaded.
const ICON_RULES: [RegExp, LucideIcon][] = [
  [/ao|shirt|hoodie/, Shirt],
  [/moc-chia-khoa|khoa|key/, KeyRound],
  [/sticker|smile/, Smile],
  [/but|pen/, PenLine],
  [/so-tay|sach|note|book/, NotebookText],
  [/balo|tui|bag/, ShoppingBag],
  [/phu-kien|dong-ho|watch/, Watch],
];

export function getIconForSlug(slug: string | undefined | null): LucideIcon {
  if (!slug) return Gift;
  const match = ICON_RULES.find(([pattern]) => pattern.test(slug));
  return match ? match[1] : Gift;
}

export const AllCategoriesIcon = LayoutGrid;
