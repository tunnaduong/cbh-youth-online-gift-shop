import { BadgeCheck, ShieldCheck, Truck, Headset } from "lucide-react";

const badges = [
  {
    icon: BadgeCheck,
    title: "Sản phẩm chính hãng",
    desc: "Thiết kế độc quyền",
  },
  {
    icon: ShieldCheck,
    title: "Chất lượng đảm bảo",
    desc: "Kiểm tra kỹ trước khi gửi",
  },
  {
    icon: Truck,
    title: "Giao hàng toàn quốc",
    desc: "Nhanh chóng & an toàn",
  },
  {
    icon: Headset,
    title: "Hỗ trợ 24/7",
    desc: "Đội ngũ luôn sẵn sàng",
  },
];

export default function TrustBadges() {
  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="flex flex-col gap-4">
        {badges.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-green-200 text-green-600">
              <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-800">{title}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
