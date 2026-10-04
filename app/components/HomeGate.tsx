"use client";

import { useAuth } from "../contexts/AuthContext";
import { PageSpinner } from "./ui/Spinner";

/**
 * Giftshop is members-only - only logged-in CBH Youth Online accounts can
 * browse/buy, so a logged-out visitor sees a blurred preview instead of the
 * live catalog, with a clear way to sign in (via the shared CBH account,
 * see ../lib/auth) to get past it.
 */
export default function HomeGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) return <PageSpinner />;

  return <>{children}</>;
}
