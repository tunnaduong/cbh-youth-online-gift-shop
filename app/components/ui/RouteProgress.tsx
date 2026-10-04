"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * The thin green bar at the top of the page while moving between pages - the
 * main site has the same one (from @bprogress/next; this is a dependency-free
 * equivalent). It starts on a click on a link to another page of the shop and
 * finishes when the path changes.
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as Element | null)?.closest?.("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      // Only a move to another page of this site: a same-page link (a hash,
      // a filter) never changes the path, so the bar would never finish.
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      setPhase("loading");
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  // Arrived.
  useEffect(() => {
    setPhase((p) => (p === "loading" ? "done" : p));
  }, [pathname]);

  useEffect(() => {
    if (phase === "idle") return;
    // "done": leave time for the bar to fill and fade. "loading": give up on
    // a navigation that never lands (cancelled, or it left the site).
    const timer = setTimeout(() => setPhase(phase === "done" ? "idle" : "done"), phase === "done" ? 450 : 8000);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === "idle") return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]">
      <div className={`route-progress ${phase === "loading" ? "is-loading" : "is-done"}`} />
    </div>
  );
}
