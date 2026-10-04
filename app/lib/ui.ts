import type { CSSProperties } from "react";

// Shared class strings, so every page draws the same card, button and input
// (they follow the main site: rounded-2xl cards with a hairline border,
// rounded-xl controls, green primary with a slight press). Add the size
// (height / padding) at the call site.

export const card = "rounded-2xl border border-card-border bg-surface shadow-card";

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:active:scale-100";

export const btnPrimary = `${btnBase} bg-primary-500 text-white shadow-sm hover:bg-primary-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none`;

export const btnOutline = `${btnBase} border border-gray-200 bg-surface text-gray-700 hover:border-primary-300 hover:bg-primary-50 hover:text-brand-strong disabled:text-gray-400 disabled:hover:border-gray-200 disabled:hover:bg-surface`;

/** Round icon button, as in the main site's top bar. */
export const iconBtn =
  "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900";

export const input =
  "w-full rounded-xl border border-gray-200 bg-surface px-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100";

export const pageTitle = "text-[26px] font-bold leading-tight text-gray-900 sm:text-[30px]";

/** A skeleton block: add the size and radius. */
export const skeleton = "shimmer rounded-lg";

/** `style={stagger(i)}` on the children of a `.stagger` container. */
export const stagger = (index: number) => ({ "--i": index }) as CSSProperties;
