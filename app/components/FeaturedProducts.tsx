import { Star, Shirt, KeyRound, Smile, PenLine, NotebookText, type LucideIcon } from "lucide-react";
import ProductThumb from "./ProductThumb";

type Product = {
  name: string;
  price: string;
  rating: string;
  sold: string;
  badge?: { label: string; tone: "new" | "hot" };
  icon: LucideIcon;
};

const products: Product[] = [
  {
    name: "Áo thun Chuyên Biên Hòa Classic",
    price: "199.000đ",
    rating: "4.9",
    sold: "Đã bán 156",
    badge: { label: "Mới", tone: "new" },
    icon: Shirt,
  },
  {
    name: "Móc khóa logo Chuyên Biên Hòa",
    price: "29.000đ",
    rating: "4.8",
    sold: "Đã bán 342",
    badge: { label: "Bán chạy", tone: "hot" },
    icon: KeyRound,
  },
  {
    name: "Sticker bộ sưu tập Chuyên Biên Hòa",
    price: "25.000đ",
    rating: "4.8",
    sold: "Đã bán 278",
    badge: { label: "Mới", tone: "new" },
    icon: Smile,
  },
  {
    name: "Bút bi Chuyên Biên Hòa",
    price: "15.000đ",
    rating: "4.7",
    sold: "Đã bán 189",
    icon: PenLine,
  },
  {
    name: "Sổ tay Chuyên Biên Hòa A5",
    price: "49.000đ",
    rating: "4.9",
    sold: "Đã bán 201",
    icon: NotebookText,
  },
];

export default function FeaturedProducts() {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Sản phẩm nổi bật</h2>
        <a href="#" className="text-sm font-medium text-green-600 hover:text-green-700">
          Xem tất cả &gt;
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {products.map((product) => (
          <div
            key={product.name}
            className="group overflow-hidden rounded-2xl border border-slate-100 bg-white transition-shadow hover:shadow-md"
          >
            <div className="relative">
              <ProductThumb icon={product.icon} className="aspect-square w-full" />
              {product.badge && (
                <span
                  className={`absolute left-2.5 top-2.5 rounded-lg px-2 py-1 text-[11px] font-semibold text-white ${
                    product.badge.tone === "new" ? "bg-green-600" : "bg-amber-500"
                  }`}
                >
                  {product.badge.label}
                </span>
              )}
            </div>
            <div className="p-3.5">
              <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-800">
                {product.name}
              </p>
              <p className="mt-1.5 font-bold text-green-600">{product.price}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {product.rating}
                </span>
                <span>{product.sold}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
