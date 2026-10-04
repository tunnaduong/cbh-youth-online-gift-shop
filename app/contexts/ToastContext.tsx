"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CircleAlert, CheckCircle2 } from "lucide-react";

type ToastKind = "success" | "error";

interface ToastItem {
  id: number;
  text: string;
  kind: ToastKind;
  leaving: boolean;
}

type ShowToast = (text: string, kind?: ToastKind) => void;

const ToastContext = createContext<ShowToast>(() => {});

const VISIBLE_MS = 2600;
const LEAVE_MS = 200;

/**
 * App-wide toasts: a pill that drops in at the top centre and leaves by
 * itself, like the main site's messages. `useToast()("Đã thêm vào giỏ")`.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    []
  );

  const show = useCallback<ShowToast>((text, kind = "success") => {
    const id = nextId.current++;
    // At most three on screen: the oldest gives way.
    setToasts((prev) => [...prev.slice(-2), { id, text, kind, leaving: false }]);
    timers.current.push(
      setTimeout(
        () => setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t))),
        VISIBLE_MS
      ),
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), VISIBLE_MS + LEAVE_MS)
    );
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-[81px] z-[65] flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`flex max-w-full items-center gap-2 rounded-full border border-card-border bg-popover px-4 py-2.5 text-sm font-medium text-gray-800 shadow-lift ${
              t.leaving ? "animate-toast-out" : "animate-toast-in"
            }`}
          >
            {t.kind === "success" ? (
              <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-brand" />
            ) : (
              <CircleAlert className="h-[18px] w-[18px] shrink-0 text-red-500" />
            )}
            <span className="min-w-0">{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
