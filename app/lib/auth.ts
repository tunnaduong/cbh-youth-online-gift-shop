/**
 * Reads the login session set by the main CBH Youth Online site
 * (www.chuyenbienhoa.com). That app sets its `auth_token` cookie with
 * `domain=".chuyenbienhoa.com"`, so it's automatically sent to any
 * *.chuyenbienhoa.com subdomain (including this giftshop) - there is no
 * separate login flow here, just a read of the shared cookie plus a call to
 * the same backend API the main app uses.
 */

const AUTH_COOKIE_NAME = "auth_token";

export function getAuthToken(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!match) return null;
  const value = match.slice(AUTH_COOKIE_NAME.length + 1);
  return value ? decodeURIComponent(value) : null;
}

export function isLoggedIn(): boolean {
  return !!getAuthToken();
}

/**
 * Clears the shared auth_token cookie for the whole *.chuyenbienhoa.com
 * domain, the same one this app only ever reads - this is the one place
 * this app writes to it, and only in response to the user pressing
 * "Đăng xuất" (see AuthContext.logout). Setting an already-expired
 * `expires` on the same domain/path is how a cookie set elsewhere gets
 * removed from here without needing a server round-trip.
 */
export function clearAuthToken(): void {
  if (typeof document === "undefined") return;
  const domain = window.location.hostname.endsWith("chuyenbienhoa.com")
    ? ".chuyenbienhoa.com"
    : window.location.hostname;
  document.cookie = `${AUTH_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.chuyenbienhoa.com";

/**
 * The main site's own /login page - this app has no login form of its own.
 * `continue` brings the user back here once they've signed in there, which
 * sets the shared cookie this app then picks up on next load.
 */
export function getLoginUrl(returnTo?: string): string {
  const target =
    returnTo ?? (typeof window !== "undefined" ? window.location.href : "/");
  return `${SITE_URL}/login?continue=${encodeURIComponent(target)}`;
}
