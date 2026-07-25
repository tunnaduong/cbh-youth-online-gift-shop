import { PenTool, Leaf, HeartHandshake, Award } from "lucide-react";

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
    icon: HeartHandshake,
    title: "Góp phần phát triển",
    desc: "5% doanh thu ủng hộ các hoạt động học sinh",
  },
  {
    icon: Award,
    title: "Tự hào Chuyên Biên Hòa",
    desc: "Mang niềm tự hào của học sinh đi khắp nơi",
  },
];

export default function FeaturesBar() {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl bg-amber-50/60 p-5 sm:grid-cols-2 lg:grid-cols-4">
      {features.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-green-600">
            <Icon className="h-5 w-5" strokeWidth={1.6} />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            <p className="text-xs text-slate-500">{desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
