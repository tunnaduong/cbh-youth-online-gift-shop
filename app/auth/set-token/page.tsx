"use client";

import { useEffect } from "react";
import Spinner from "../../components/ui/Spinner";
import { API_URL } from "../../lib/api";
import {
  clearAuthToken,
  getAuthToken,
  isSessionFromApp,
  markSessionFromApp,
  setAuthToken,
} from "../../lib/auth";

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
      // ?logout=1: the mobile app has no signed-in account any more, and its
      // browser mustn't stay signed in either. A session the app handed over
      // is revoked on the API too; one the user signed into themselves only
      // loses its cookie here.
      if (params.get("logout") === "1") {
        const token = getAuthToken();
        if (token && isSessionFromApp()) {
          try {
            await fetch(`${API_URL}/v1.0/logout`, {
              method: "POST",
              headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
            });
          } catch {}
        }
        clearAuthToken();
        window.location.replace(returnUrl);
        return;
      }

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
          if (data?.token) {
            // Switching accounts in the app hands over a new session: end the
            // one it handed over before, so it doesn't linger in the devices
            // list. Never touches a session the user signed into themselves.
            const previous = getAuthToken();
            if (previous && previous !== data.token && isSessionFromApp()) {
              fetch(`${API_URL}/v1.0/logout`, {
                method: "POST",
                headers: { Accept: "application/json", Authorization: `Bearer ${previous}` },
                keepalive: true,
              }).catch(() => {});
            }
            setAuthToken(data.token);
            markSessionFromApp();
          }
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
      <Spinner className="h-10 w-10" />
    </div>
  );
}
