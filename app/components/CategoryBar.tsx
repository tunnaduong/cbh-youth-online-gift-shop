"use client";

import { useState } from "react";
import {
  LayoutGrid,
  Shirt,
  KeyRound,
  Smile,
  PenLine,
  NotebookText,
  ShoppingBag,
  Watch,
  type LucideIcon,
} from "lucide-react";

const categories: { label: string; icon: LucideIcon }[] = [
  { label: "Tất cả", icon: LayoutGrid },
  { label: "Áo thun", icon: Shirt },
  { label: "Móc khóa", icon: KeyRound },
  { label: "Sticker", icon: Smile },
  { label: "Bút viết", icon: PenLine },
  { label: "Sổ tay", icon: NotebookText },
  { label: "Balo - Túi", icon: ShoppingBag },
  { label: "Phụ kiện", icon: Watch },
];

export default function CategoryBar() {
  const [active, setActive] = useState("Tất cả");

  return (
    <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
      {categories.map(({ label, icon: Icon }) => {
        const isActive = active === label;
        return (
          <button
            key={label}
            onClick={() => setActive(label)}
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
      })}
    </div>
  );
}
