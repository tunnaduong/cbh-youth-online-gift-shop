import { LucideIcon } from "lucide-react";

export default function ProductThumb({
  icon: Icon,
  className = "",
}: {
  icon: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-green-50 to-slate-100 ${className}`}
    >
      <Icon className="h-12 w-12 text-green-700/70" strokeWidth={1.5} />
    </div>
  );
}
