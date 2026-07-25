export default function FrogLogo({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#16a34a" />
      <ellipse cx="15" cy="16" rx="5" ry="5.5" fill="#ffffff" />
      <ellipse cx="33" cy="16" rx="5" ry="5.5" fill="#ffffff" />
      <circle cx="15" cy="17" r="2.3" fill="#14532d" />
      <circle cx="33" cy="17" r="2.3" fill="#14532d" />
      <ellipse cx="24" cy="29" rx="14" ry="11" fill="#ffffff" />
      <ellipse cx="17.5" cy="29" rx="2.6" ry="3.4" fill="#14532d" />
      <ellipse cx="30.5" cy="29" rx="2.6" ry="3.4" fill="#14532d" />
      <path d="M17 34c2.5 2 11.5 2 14 0" stroke="#14532d" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
