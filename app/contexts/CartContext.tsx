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
// "1" while this browser holds a change the account hasn't received yet (the
// tab was closed or reloaded within the debounce, or the save failed), so the
// next load sends it instead of replacing it with the older account cart.
const DIRTY_KEY = "giftshop_cart_dirty";
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
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  // Set once the account's cart has been loaded, so local changes made
  // before that can't overwrite it with a stale copy.
  const [synced, setSynced] = useState(false);
  // True while `items` holds exactly what the server has (just loaded from
  // it), so the effect below doesn't push it straight back.
  const fromServerRef = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Saves still on their way to the server.
  const savingRef = useRef(0);
  // Set by add/remove/quantity/clear while the account cart hasn't loaded
  // yet, so that change isn't thrown away when it does.
  const dirtyBeforeSyncRef = useRef(false);
  const syncedRef = useRef(false);
  syncedRef.current = synced;
  const markChanged = useCallback(() => {
    if (!syncedRef.current) dirtyBeforeSyncRef.current = true;
  }, []);
  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = items;

  const applyServerCart = useCallback((cart: ServerCart) => {
    fromServerRef.current = true;
    setItems(fromServer(cart));
  }, []);

  // First load after sign-in (or page load while signed in).
  useEffect(() => {
    // Whoever was synced before, a different (or no) user starts over, and a
    // change still waiting to be sent must not go out under the new token.
    setSynced(false);
    if (pushTimer.current) {
      clearTimeout(pushTimer.current);
      pushTimer.current = null;
    }

    if (!hydrated || authLoading) return;

    if (!userId) {
      // Signed out (here, or on another CBH site sharing the login cookie):
      // a cart that was synced with an account belongs to that account, so
      // it must not stay in this browser for the next person. A cart built
      // as a guest (no key) is kept.
      if (localStorage.getItem(SYNCED_USER_KEY) !== null) {
        localStorage.removeItem(SYNCED_USER_KEY);
        localStorage.removeItem(DIRTY_KEY);
        dirtyBeforeSyncRef.current = false;
        setItems([]);
      }
      return;
    }

    const toPayload = (list: CartItem[]) =>
      list.map((i) => ({
        product_id: i.product.id,
        variant_id: i.variant?.id ?? null,
        quantity: i.quantity,
      }));

    let cancelled = false;
    getServerCart()
      .then(async (cart) => {
        if (cancelled) return;

        const local = itemsRef.current;
        const syncedUser = localStorage.getItem(SYNCED_USER_KEY);

        if (syncedUser === String(userId)) {
          if (dirtyBeforeSyncRef.current || localStorage.getItem(DIRTY_KEY) === "1") {
            // Changed here while the account cart was still loading (e.g. a
            // quick "add to cart" on a slow connection), or changed on an
            // earlier visit and never sent: keep that change.
            const saved = await saveServerCart(toPayload(local));
            if (cancelled) return;
            applyServerCart(saved);
          } else {
            applyServerCart(cart);
          }
        } else if (syncedUser === null && local.length > 0) {
          // A cart built as a guest on this device: add its lines to the
          // account's cart (the account's quantity wins for shared lines).
          const serverItems = fromServer(cart);
          const keys = new Set(serverItems.map(cartItemKey));
          const merged = [...serverItems, ...local.filter((i) => !keys.has(cartItemKey(i)))];
          const saved = await saveServerCart(toPayload(merged));
          if (cancelled) return;
          applyServerCart(saved);
        } else {
          // Nothing local, or what is here was another account's cart (the
          // account changed without a sign-out in between): never merge that.
          applyServerCart(cart);
        }

        dirtyBeforeSyncRef.current = false;
        localStorage.removeItem(DIRTY_KEY);
        localStorage.setItem(SYNCED_USER_KEY, String(userId));
        setSynced(true);
      })
      .catch((error) => console.error("Failed to load the account cart:", error));

    return () => {
      cancelled = true;
    };
  }, [hydrated, authLoading, userId, applyServerCart]);

  // Push local changes to the account (debounced: quantity steppers fire a lot).
  useEffect(() => {
    if (!synced || !userId) return;
    if (fromServerRef.current) {
      fromServerRef.current = false;
      return;
    }

    localStorage.setItem(DIRTY_KEY, "1");
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      pushTimer.current = null;
      savingRef.current += 1;
      saveServerCart(
        itemsRef.current.map((i) => ({
          product_id: i.product.id,
          variant_id: i.variant?.id ?? null,
          quantity: i.quantity,
        }))
      )
        .then(() => {
          // Only once nothing newer is waiting or still being sent.
          if (!pushTimer.current && savingRef.current === 1) {
            localStorage.removeItem(DIRTY_KEY);
          }
        })
        .catch((error) => console.error("Failed to save the account cart:", error))
        .finally(() => {
          savingRef.current -= 1;
        });
    }, PUSH_DELAY_MS);
  }, [items, synced, userId]);

  // Pick up changes made on another device when this tab is looked at again.
  useEffect(() => {
    if (!synced || !userId) return;

    const refresh = () => {
      // A change of our own is still waiting to be sent (or on its way, in
      // which case the server may still answer with the cart before it): it wins.
      const busy = () => pushTimer.current !== null || savingRef.current > 0;
      if (document.visibilityState !== "visible" || busy()) return;
      getServerCart()
        .then((cart) => {
          if (!busy()) applyServerCart(cart);
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
      markChanged();
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
    [markChanged]
  );

  const removeItem = useCallback(
    (key: string) => {
      markChanged();
      setItems((prev) => prev.filter((i) => cartItemKey(i) !== key));
    },
    [markChanged]
  );

  const setQuantity = useCallback(
    (key: string, quantity: number) => {
      markChanged();
      setItems((prev) => {
        if (quantity <= 0) return prev.filter((i) => cartItemKey(i) !== key);
        return prev.map((i) => (cartItemKey(i) === key ? { ...i, quantity } : i));
      });
    },
    [markChanged]
  );

  const clear = useCallback(() => {
    markChanged();
    setItems([]);
  }, [markChanged]);

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
