"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { ShopProduct, ShopProductVariant } from "../lib/shop";

export interface CartItem {
  product: ShopProduct;
  variant?: ShopProductVariant | null;
  quantity: number;
}

/** Same product in two variants = two cart lines. */
export const cartItemKey = (i: { product: ShopProduct; variant?: ShopProductVariant | null }) =>
  `${i.product.id}:${i.variant?.id ?? 0}`;
export const cartItemPrice = (i: CartItem) => i.variant?.price ?? i.product.price;
export const cartItemStock = (i: CartItem) => i.variant?.stock ?? i.product.stock;

interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
  addItem: (product: ShopProduct, quantity?: number, variant?: ShopProductVariant | null) => void;
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  totalQuantity: 0,
  totalAmount: 0,
  addItem: () => {},
  removeItem: () => {},
  setQuantity: () => {},
  clear: () => {},
});

const STORAGE_KEY = "giftshop_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Cart only exists client-side (no backend cart table) - load whatever was
  // saved from a previous visit once on mount, so a refresh doesn't empty it.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // Corrupt/old-shape data - start fresh rather than crash the page.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback(
    (product: ShopProduct, quantity = 1, variant: ShopProductVariant | null = null) => {
      const key = cartItemKey({ product, variant });
      setItems((prev) => {
        const existing = prev.find((i) => cartItemKey(i) === key);
        if (existing) {
          return prev.map((i) =>
            cartItemKey(i) === key ? { ...i, quantity: i.quantity + quantity } : i
          );
        }
        return [...prev, { product, variant, quantity }];
      });
    },
    []
  );

  const removeItem = useCallback((key: string) => {
    setItems((prev) => prev.filter((i) => cartItemKey(i) !== key));
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => cartItemKey(i) !== key);
      return prev.map((i) => (cartItemKey(i) === key ? { ...i, quantity } : i));
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totalQuantity = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );
  const totalAmount = useMemo(
    () => items.reduce((sum, i) => sum + cartItemPrice(i) * i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, totalQuantity, totalAmount, addItem, removeItem, setQuantity, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
