"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { PanelRight } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { useChatWidget } from "../contexts/ChatWidgetContext";
import MobileDrawer from "./MobileDrawer";

export default function MobileDrawerTrigger() {
  const [open, setOpen] = useState(false);
  const { totalQuantity } = useCart();
  const { conversationId } = useChatWidget();
  const { loggedIn } = useAuth();
  const pathname = usePathname();

  if (pathname.startsWith("/auth/")) return null;

  return (
    <>
      {/* Floating trigger — only visible on mobile. It moves up a slot when
          the support chat button is there (always, once signed in): both used to sit in the same
          corner, the chat button covering this one. */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Mở thông tin giỏ hàng"
        className={`fixed right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 shadow-glow transition-all duration-300 hover:scale-105 hover:bg-primary-600 active:scale-95 lg:hidden ${
          conversationId || loggedIn ? "bottom-[5.5rem]" : "bottom-5"
        }`}
      >
        <PanelRight className="h-5 w-5 text-white" />
        {totalQuantity > 0 && (
          <span
            key={totalQuantity}
            className="absolute -right-1 -top-1 flex h-5 min-w-5 animate-bump items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white ring-2 ring-page"
          >
            {totalQuantity > 9 ? "9+" : totalQuantity}
          </span>
        )}
      </button>

      <MobileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
