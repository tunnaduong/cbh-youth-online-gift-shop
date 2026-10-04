"use client";

import { useEffect, useRef, useState } from "react";
import { LucideIcon, Gift } from "lucide-react";

/**
 * The photo and its loading placeholder, kept apart so a new `src` (another
 * variant's photo) gets a new instance - and with it a fresh "not loaded
 * yet" state - via `key`.
 */
function FadeInImage({
  src,
  alt,
  zoom,
  className,
}: {
  src: string;
  alt: string;
  zoom: boolean;
  className: string;
}) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // An image already in the cache can finish before React attaches onLoad.
  useEffect(() => {
    if (ref.current?.complete) setLoaded(true);
  }, []);

  return (
    // Shimmers until the image has loaded, then the image fades in over it.
    <div className={`overflow-hidden ${loaded ? "bg-gray-50" : "shimmer"} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={ref}
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        // A broken image shouldn't shimmer forever.
        onError={() => setLoaded(true)}
        className={`h-full w-full object-cover transition duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        } ${zoom ? "group-hover:scale-105" : ""}`}
      />
    </div>
  );
}

export default function ProductThumb({
  icon: Icon = Gift,
  imageUrl,
  alt = "",
  className = "",
  zoom = false,
}: {
  icon?: LucideIcon;
  imageUrl?: string | null;
  alt?: string;
  className?: string;
  /** Zoom slightly when the surrounding `group` (a card) is hovered. */
  zoom?: boolean;
}) {
  if (imageUrl) {
    return <FadeInImage key={imageUrl} src={imageUrl} alt={alt} zoom={zoom} className={className} />;
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 ${className}`}
    >
      <Icon
        className={`h-12 w-12 max-h-[55%] max-w-[55%] text-primary-500/60 transition duration-300 ${
          zoom ? "group-hover:scale-110" : ""
        }`}
        strokeWidth={1.5}
      />
    </div>
  );
}
