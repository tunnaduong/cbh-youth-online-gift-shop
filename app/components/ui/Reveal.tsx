"use client";

import { useInView } from "../../lib/useInView";

/**
 * Fades its content up when it scrolls into view. Rendered visible on the
 * server and for anything already on screen, so nothing depends on JS to be
 * seen.
 */
export default function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, ready, inView } = useInView<HTMLDivElement>();
  const state = inView ? (ready ? "reveal-show" : "") : ready ? "reveal-wait" : "";

  return (
    <div ref={ref} className={`${state} ${className}`}>
      {children}
    </div>
  );
}
