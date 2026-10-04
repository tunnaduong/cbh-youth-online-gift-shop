"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tells when an element has scrolled into view (once - it doesn't flip back).
 * `ready` turns true after mount, so a caller can hide the element only when
 * there is JS around to reveal it again.
 */
export function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [ready, setReady] = useState(false);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    // Already on screen at load: show it straight away, no waiting state.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setInView(true);
      return;
    }
    setReady(true);
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, ready, inView };
}
