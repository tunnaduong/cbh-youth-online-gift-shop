import { BadgeCheck, ShieldCheck, Truck, Headset } from "lucide-react";
import { card } from "../../lib/ui";
import SectionHeader from "../ui/SectionHeader";

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
    title: "Giao hàng quanh Hà Nam cũ",
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
    <div className={`${card} p-4`}>
      <SectionHeader icon={ShieldCheck} title="Cam kết của shop" />
      <div className="mt-4 flex flex-col gap-3.5">
        {badges.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-brand">
              <Icon className="h-5 w-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900">{title}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
