"use client";

import { useAuth } from "../contexts/AuthContext";

/**
 * Giftshop is members-only - only logged-in CBH Youth Online accounts can
 * browse/buy, so a logged-out visitor sees a blurred preview instead of the
 * live catalog, with a clear way to sign in (via the shared CBH account,
 * see ../lib/auth) to get past it.
 */
export default function HomeGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-center px-6 py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-green-600" />
      </div>
    );
  }

  return <>{children}</>;
}
