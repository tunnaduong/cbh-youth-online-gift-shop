"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import TrustBadges from "./sidebar/TrustBadges";
import MiniCart from "./sidebar/MiniCart";
import PromoBanner from "./sidebar/PromoBanner";

export default function MobileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Thông tin giỏ hàng"
        className={`fixed right-0 top-0 z-50 flex h-full w-[85vw] max-w-xs flex-col gap-4 overflow-y-auto bg-slate-50 p-4 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800">Thông tin</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <TrustBadges />
        <MiniCart />
        <PromoBanner />
      </div>
    </>
  );
}
