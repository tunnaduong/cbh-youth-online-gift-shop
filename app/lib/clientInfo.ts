import { isSessionFromApp } from "./auth";

/**
 * Describes this browser to the API, which shows it in the user's "logged-in
 * devices" list - same headers and labels as the main site's
 * utils/clientInfo.js, so a session looks the same whichever CBH site used
 * it last. Values are URL-encoded (the API decodes them).
 */

const BROWSERS: [string, RegExp][] = [
  // Order matters: most of these also contain "Chrome" and "Safari".
  ["Edge", /Edg(?:e|A|iOS)?\/(\d+)/],
  ["Opera", /OPR\/(\d+)/],
  ["Cốc Cốc", /coc_coc_browser\/(\d+)/],
  ["Samsung Internet", /SamsungBrowser\/(\d+)/],
  ["Firefox", /(?:Firefox|FxiOS)\/(\d+)/],
  ["Chrome", /(?:Chrome|CriOS)\/(\d+)/],
  ["Safari", /Version\/(\d+).*Safari/],
];

// The mobile app's WebViews append this to their user agent.
const APP_WEBVIEW_UA = /CBHYouthApp\//;

function detectOs(ua: string): string {
  if (/Windows/.test(ua)) return "Windows";
  if (/Android/.test(ua)) return "Android";
  if (/iPhone|iPod/.test(ua)) return "iPhone";
  if (/iPad/.test(ua)) return "iPad";
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Linux/.test(ua)) return "Linux";
  return "";
}

function detectBrowser(ua: string): string {
  for (const [name, pattern] of BROWSERS) {
    const match = ua.match(pattern);
    if (match) return `${name} ${match[1]}`;
  }
  return "";
}

export function getClientHeaders(): Record<string, string> {
  if (typeof navigator === "undefined") return {};
  const ua = navigator.userAgent || "";
  const headers: Record<string, string> = { "X-Client-Platform": "web" };

  const os = detectOs(ua);
  const browser = detectBrowser(ua);
  // Sessions the mobile app created are labelled as such: its own WebView,
  // or a browser it opened and signed in (/auth/set-token?code=).
  let model = browser;
  if (APP_WEBVIEW_UA.test(ua)) {
    model = "WebView trong ứng dụng CBH Youth";
  } else if (isSessionFromApp()) {
    model = browser ? `${browser} · mở từ ứng dụng` : "Mở từ ứng dụng CBH Youth";
  }

  if (os) headers["X-Device-Name"] = encodeURIComponent(os);
  if (model) headers["X-Device-Model"] = encodeURIComponent(model);
  return headers;
}
