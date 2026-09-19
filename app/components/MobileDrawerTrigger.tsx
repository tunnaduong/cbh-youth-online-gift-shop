"use client";

import { useState } from "react";
import { PanelRight } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import MobileDrawer from "./MobileDrawer";

export default function MobileDrawerTrigger() {
  const [open, setOpen] = useState(false);
  const { totalQuantity } = useCart();

  return (
    <>
      {/* Floating trigger — only visible on mobile */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Mở thông tin giỏ hàng"
        className="fixed bottom-6 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-green-600 shadow-lg transition-transform hover:scale-105 active:scale-95 lg:hidden"
      >
        <PanelRight className="h-5 w-5 text-white" />
        {totalQuantity > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-green-700 shadow">
            {totalQuantity > 9 ? "9+" : totalQuantity}
          </span>
        )}
      </button>

      <MobileDrawer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
