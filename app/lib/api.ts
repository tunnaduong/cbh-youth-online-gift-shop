import { getAuthToken } from "./auth";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.chuyenbienhoa.com";

export interface CbhUser {
  id: number;
  username: string;
  profile_name?: string;
  email?: string;
  email_verified_at?: string | null;
  total_points?: number;
  rank?: number | null;
  [key: string]: unknown;
}

/**
 * Same endpoint (GET /v1.0/user) and Bearer-token auth the main site's own
 * axios client uses - see cbh-youth-online-next-js's AxiosCustom.js. The
 * token comes from the shared auth_token cookie (see ./auth), so a user
 * logged into the main site is already logged in here.
 */
export async function getCurrentUser(): Promise<CbhUser | null> {
  const token = getAuthToken();
  if (!token) return null;

  const res = await fetch(`${API_URL}/v1.0/user`, {
    headers: {
      Accept: "application/json",
      "X-From-Frontend": "true",
      Authorization: `Bearer ${token}`,
    },
    // Always reflect the current session - never cache a user response.
    cache: "no-store",
  });

  if (!res.ok) {
    // 401/expired token, etc. - treat as logged out rather than throwing,
    // callers just want to know "is there a usable session right now".
    return null;
  }

  const data = await res.json();
  return data?.data ?? data;
}

export function getAvatarUrl(username: string): string {
  return `${API_URL}/v1.0/users/${username}/avatar`;
}
