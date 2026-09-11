"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme, type Theme } from "../contexts/ThemeContext";

const THEME_OPTIONS: { id: Theme; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Sáng", icon: Sun },
  { id: "dark", label: "Tối", icon: Moon },
  { id: "auto", label: "Tự động", icon: Monitor },
];

export default function SettingsMenu() {
  const { theme, setTheme } = useTheme();
  const { loggedIn, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 hover:text-green-600"
        aria-label="Cài đặt"
      >
        <Settings className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-40 w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <p className="px-1 pb-2 text-xs font-semibold text-slate-500">
            Giao diện
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {THEME_OPTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-medium transition-colors ${
                  theme === id
                    ? "border-green-600/30 bg-green-50 text-green-700"
                    : "border-slate-200 text-slate-600 hover:border-green-600/40"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {loggedIn && (
            <>
              <div className="my-3 border-t border-slate-100" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
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
