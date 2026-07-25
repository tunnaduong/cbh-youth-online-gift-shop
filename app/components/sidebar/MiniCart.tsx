import { ShoppingCart, Shirt, KeyRound } from "lucide-react";
import ProductThumb from "../ProductThumb";

const items = [
  {
    name: "Áo thun Chuyên Biên Hòa Classic",
    price: "199.000đ",
    qty: "x1",
    icon: Shirt,
  },
  {
    name: "Móc khóa logo Chuyên Biên Hòa",
    price: "29.000đ",
    qty: "x1",
    icon: KeyRound,
  },
];

export default function MiniCart() {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <ShoppingCart className="h-5 w-5 text-slate-700" />
        <h3 className="text-sm font-bold text-slate-800">Giỏ hàng của bạn</h3>
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-[11px] font-bold text-white">
          2
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.name} className="flex items-center gap-3">
            <ProductThumb icon={item.icon} className="h-12 w-12 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
              <p className="text-sm font-semibold text-green-600">{item.price}</p>
            </div>
            <span className="text-xs text-slate-400">{item.qty}</span>
          </div>
        ))}
      </div>

      <div className="my-3 border-t border-slate-100" />

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Tạm tính:</span>
        <span className="font-bold text-green-600">228.000đ</span>
      </div>

      <button className="mt-4 w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-700">
        Xem giỏ hàng
      </button>
    </div>
  );
}
