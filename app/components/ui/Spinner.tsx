/** The shop's one loading spinner. `className` sets the size (default 32px). */
export default function Spinner({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Đang tải"
      className={`block animate-spin rounded-full border-2 border-gray-200 border-t-primary-500 ${className}`}
    />
  );
}

/** Centred in the space a page's content will take. */
export function PageSpinner() {
  return (
    <div className="flex justify-center py-20">
      <Spinner />
    </div>
  );
}
