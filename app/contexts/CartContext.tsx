"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  getServerCart,
  saveServerCart,
  type ServerCart,
  type ShopProduct,
  type ShopProductVariant,
} from "../lib/shop";
import { useAuth } from "./AuthContext";

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
// Which account this browser's cart was last merged into, so a guest cart is
// only folded into the account's cart once.
const SYNCED_USER_KEY = "giftshop_cart_user";
const PUSH_DELAY_MS = 600;

const fromServer = (cart: ServerCart): CartItem[] =>
  cart.items.map((i) => ({ product: i.product, variant: i.variant, quantity: i.quantity }));

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // The browser copy keeps the cart across refreshes and for guests; signed-in
  // users also get it synced with their account (see below).
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

  // --- Account sync: the cart follows the user across devices ---------------
  const { user } = useAuth();
  const userId = user?.id ?? null;
  // Set once the account's cart has been loaded, so local changes made
  // before that can't overwrite it with a stale copy.
  const [synced, setSynced] = useState(false);
  // True while `items` holds exactly what the server has (just loaded from
  // it), so the effect below doesn't push it straight back.
  const fromServerRef = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signedInRef = useRef(false);
  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = items;

  const applyServerCart = useCallback((cart: ServerCart) => {
    fromServerRef.current = true;
    setItems(fromServer(cart));
  }, []);

  // First load after sign-in (or page load while signed in).
  useEffect(() => {
    if (!hydrated || !userId) {
      // Signed out: the cart belongs to the account, so it must not stay in
      // this browser and get merged into whoever signs in next.
      if (hydrated && signedInRef.current) {
        signedInRef.current = false;
        localStorage.removeItem(SYNCED_USER_KEY);
        setItems([]);
      }
      setSynced(false);
      return;
    }
    signedInRef.current = true;

    let cancelled = false;
    getServerCart()
      .then(async (cart) => {
        if (cancelled) return;

        const local = itemsRef.current;
        const mergedBefore = localStorage.getItem(SYNCED_USER_KEY) === String(userId);

        if (!mergedBefore && local.length > 0) {
          // A cart built before signing in on this device: add its lines to
          // the account's cart (the account's quantity wins for shared lines).
          const serverItems = fromServer(cart);
          const keys = new Set(serverItems.map(cartItemKey));
          const merged = [...serverItems, ...local.filter((i) => !keys.has(cartItemKey(i)))];
          const saved = await saveServerCart(
            merged.map((i) => ({
              product_id: i.product.id,
              variant_id: i.variant?.id ?? null,
              quantity: i.quantity,
            }))
          );
          if (cancelled) return;
          applyServerCart(saved);
        } else {
          applyServerCart(cart);
        }

        localStorage.setItem(SYNCED_USER_KEY, String(userId));
        setSynced(true);
      })
      .catch((error) => console.error("Failed to load the account cart:", error));

    return () => {
      cancelled = true;
    };
  }, [hydrated, userId, applyServerCart]);

  // Push local changes to the account (debounced: quantity steppers fire a lot).
  useEffect(() => {
    if (!synced || !userId) return;
    if (fromServerRef.current) {
      fromServerRef.current = false;
      return;
    }

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      pushTimer.current = null;
      saveServerCart(
        itemsRef.current.map((i) => ({
          product_id: i.product.id,
          variant_id: i.variant?.id ?? null,
          quantity: i.quantity,
        }))
      ).catch((error) => console.error("Failed to save the account cart:", error));
    }, PUSH_DELAY_MS);
  }, [items, synced, userId]);

  // Pick up changes made on another device when this tab is looked at again.
  useEffect(() => {
    if (!synced || !userId) return;

    const refresh = () => {
      // A change of our own is still waiting to be sent: it wins.
      if (document.visibilityState !== "visible" || pushTimer.current) return;
      getServerCart()
        .then((cart) => {
          if (!pushTimer.current) applyServerCart(cart);
        })
        .catch(() => {});
    };

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [synced, userId, applyServerCart]);

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
