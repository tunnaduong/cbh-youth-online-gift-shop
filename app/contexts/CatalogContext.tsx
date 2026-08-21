"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface CatalogContextValue {
  activeCategoryId: number | null;
  setActiveCategoryId: (id: number | null) => void;
}

// Shared just between CategoryBar and FeaturedProducts so picking a category
// filters the product grid below it, without prop-drilling through page.tsx.
const CatalogContext = createContext<CatalogContextValue>({
  activeCategoryId: null,
  setActiveCategoryId: () => {},
});

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  return (
    <CatalogContext.Provider value={{ activeCategoryId, setActiveCategoryId }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  return useContext(CatalogContext);
}
