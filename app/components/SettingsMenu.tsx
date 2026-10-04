"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, type Theme } from "../contexts/ThemeContext";
import { useAppMode } from "../lib/appMode";
import { iconBtn } from "../lib/ui";

const THEME_OPTIONS: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Sáng", icon: Sun },
  { id: "dark", label: "Tối", icon: Moon },
  { id: "auto", label: "Tự động", icon: Monitor },
];

export default function SettingsMenu() {
  const { theme, setTheme } = useTheme();
  const { loggedIn, logout } = useAuth();
  const appMode = useAppMode();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${iconBtn} ${open ? "bg-gray-100 text-gray-900" : ""}`}
        aria-label="Cài đặt"
        aria-expanded={open}
      >
        <Settings
          className={`h-[21px] w-[21px] transition-transform duration-300 ${open ? "rotate-90" : ""}`}
          strokeWidth={1.9}
        />
      </button>

      {open && (
        // Grows out of the button's corner, like the main site's menus.
        <div className="absolute right-0 top-12 z-50 w-60 origin-top-right animate-pop-in rounded-xl border border-card-border bg-popover p-3 shadow-lg ring-1 ring-black/5">
          <p className="px-1 pb-2 text-xs font-semibold text-gray-500">
            Giao diện
          </p>
          {/* Segmented control: the chosen theme is the raised pill. */}
          <div className="flex rounded-full border border-gray-200 bg-gray-100 p-1">
            {THEME_OPTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                aria-pressed={theme === id}
                className={`flex flex-1 items-center justify-center gap-1 rounded-full py-1.5 text-xs font-semibold transition duration-200 ${
                  theme === id
                    ? "bg-surface text-brand shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* The app manages the login (and account switching) itself. */}
          {loggedIn && !appMode && (
            <>
              <div className="my-3 border-t border-gray-100" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
