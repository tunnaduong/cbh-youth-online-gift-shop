import { Gift } from "lucide-react";

export default function PromoBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-green-600 p-5 text-white">
      <Gift className="pointer-events-none absolute -bottom-4 -right-4 h-28 w-28 text-white/15" strokeWidth={1} />
      <div className="relative">
        <h3 className="text-base font-bold">Ưu đãi học sinh</h3>
        <p className="mt-1.5 text-sm text-green-50/90">
          Giảm 10% cho tất cả sản phẩm khi xác minh tài khoản học sinh
        </p>
        <button className="mt-4 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-green-600 transition-colors hover:bg-green-50">
          Xác minh ngay
        </button>
      </div>
    </div>
  );
}
