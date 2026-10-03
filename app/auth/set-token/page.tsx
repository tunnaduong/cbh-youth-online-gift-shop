"use client";

import { useEffect } from "react";
import { API_URL } from "../../lib/api";
import { setAuthToken } from "../../lib/auth";

/**
 * Landing page for the mobile app's in-app browser. The app can't write
 * cookies into that browser, so it opens /auth/set-token?code=...&return=...
 * with a single-use code from the API; this swaps the code for a token, sets
 * the shared auth_token cookie, and moves on to the page that was asked for.
 * Mirrors the main site's /auth/set-token.
 */
export default function SetTokenPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const returnParam = params.get("return");
    // Only same-site paths: absolute URLs and "//evil.example" (or "/\evil",
    // which browsers read the same way) would turn this into an open redirect.
    const returnUrl =
      returnParam && returnParam.startsWith("/") && !/^\/[/\\]/.test(returnParam)
        ? returnParam
        : "/";

    (async () => {
      if (code) {
        try {
          const res = await fetch(`${API_URL}/v1.0/web-session/redeem`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ code }),
          });
          const data = res.ok ? await res.json() : null;
          if (data?.token) setAuthToken(data.token);
        } catch {
          // Expired/used code: carry on with whatever session the browser
          // already has rather than stranding the user on a blank page.
        }
      }
      // A full load rather than router.replace, so AuthProvider starts over
      // and picks up the new cookie.
      window.location.replace(returnUrl);
    })();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-500" />
    </div>
  );
}
