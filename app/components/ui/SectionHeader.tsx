import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

/** Section title as on the main site's home cards: green icon, 15px title, optional "see all". */
export default function SectionHeader({
  icon: Icon,
  title,
  href,
  linkLabel = "Xem tất cả",
  children,
}: {
  icon: LucideIcon;
  title: string;
  href?: string;
  linkLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-gray-900">
        <Icon className="h-[18px] w-[18px] shrink-0 text-brand" strokeWidth={2.2} />
        <span className="truncate">{title}</span>
      </h2>
      {children}
      {href && (
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1 text-[13px] font-medium text-brand hover:text-brand-strong"
        >
          {linkLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
