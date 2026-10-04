import type { LucideIcon } from "lucide-react";
import { card } from "../../lib/ui";

/**
 * "Nothing here" / "sign in first" card: a large thin icon, a line of text
 * and an optional action underneath (pass the button or link as children).
 */
export default function EmptyState({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`${card} flex animate-fade-up flex-col items-center gap-3 px-6 py-14 text-center`}>
      <Icon className="h-12 w-12 text-gray-300" strokeWidth={1.25} />
      <p className="text-base font-medium text-gray-600">{title}</p>
      {hint && <p className="-mt-1.5 text-sm text-gray-500">{hint}</p>}
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}
