import { LucideIcon, Gift } from "lucide-react";

export default function ProductThumb({
  icon: Icon = Gift,
  imageUrl,
  alt = "",
  className = "",
}: {
  icon?: LucideIcon;
  imageUrl?: string | null;
  alt?: string;
  className?: string;
}) {
  if (imageUrl) {
    return (
      <div className={`overflow-hidden bg-slate-50 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={alt}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-green-50 to-slate-100 ${className}`}
    >
      <Icon className="h-12 w-12 text-green-700/70" strokeWidth={1.5} />
    </div>
  );
}
