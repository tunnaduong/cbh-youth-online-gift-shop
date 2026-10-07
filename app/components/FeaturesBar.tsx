import { PenTool, Leaf, Award } from "lucide-react";
import { card } from "../lib/ui";

const features = [
  {
    icon: PenTool,
    title: "Thiết kế độc quyền",
    desc: "Chỉ có tại Giftshop Chuyên Biên Hòa",
  },
  {
    icon: Leaf,
    title: "Chất liệu cao cấp",
    desc: "Bền đẹp, thân thiện môi trường",
  },
  {
    icon: Award,
    title: "Tự hào Chuyên Biên Hòa",
    desc: "Mang niềm tự hào của học sinh đi khắp nơi",
  },
];

export default function FeaturesBar() {
  return (
    <div className={`${card} grid grid-cols-1 gap-4 p-4 sm:grid-cols-3 sm:p-5`}>
      {features.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="group flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-brand transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-md">
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            <p className="text-xs leading-relaxed text-gray-500">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
