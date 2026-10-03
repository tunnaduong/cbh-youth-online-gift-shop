"use client";

import { useEffect, useState } from "react";

/**
 * "App mode": the shop is running inside the CBH Youth Online mobile app's
 * WebView, which opens it as /?app=true. The app owns the login (it signs the
 * WebView in as whoever is signed in to the app, and keeps it in step with
 * account switches) and only lets the WebView stay on this domain - so in app
 * mode anything that signs out or leads off to another site is hidden.
 *
 * Only the first page carries ?app=true, so the flag is kept in
 * sessionStorage for the rest of the WebView's session.
 */

const APP_MODE_KEY = "cbh_app_mode";

function readAppMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (new URLSearchParams(window.location.search).get("app") === "true") {
      sessionStorage.setItem(APP_MODE_KEY, "1");
      return true;
    }
    return sessionStorage.getItem(APP_MODE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * False on the server and the first client render (so hydration matches),
 * then the real value.
 */
export function useAppMode(): boolean {
  const [appMode, setAppMode] = useState(false);
  useEffect(() => {
    setAppMode(readAppMode());
  }, []);
  return appMode;
}
