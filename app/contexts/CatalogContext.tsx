"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";

interface CatalogContextValue {
  activeCategoryId: number | null;
  setActiveCategoryId: (id: number | null) => void;
  search: string;
  setSearch: (value: string) => void;
}

// Shared just between CategoryBar/Header and FeaturedProducts so picking a
// category or searching filters the product grid below it, without
// prop-drilling through page.tsx.
const CatalogContext = createContext<CatalogContextValue>({
  activeCategoryId: null,
  setActiveCategoryId: () => {},
  search: "",
  setSearch: () => {},
});

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const searchParams = useSearchParams();
  // The header search box lives outside this provider (it's in Header,
  // rendered above HomeGate/CatalogProvider), so it hands off a query via
  // ?search= on navigation to "/" - read once as the initial value rather
  // than syncing it in an effect.
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");

  return (
    <CatalogContext.Provider
      value={{ activeCategoryId, setActiveCategoryId, search, setSearch }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  return useContext(CatalogContext);
}
