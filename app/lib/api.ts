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
 *
 * Only a genuine 401/403 (the token itself is invalid/expired) means "log
 * this user out" - any other failure (500, a network blip) throws instead,
 * so AuthContext can keep the existing session up rather than bouncing the
 * user to a logged-out state over a transient error. The user should only
 * ever get logged out by pressing "Đăng xuất".
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

  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error(`Request failed (${res.status})`);

  const data = await res.json();
  return data?.data ?? data;
}

export function getAvatarUrl(username: string): string {
  return `${API_URL}/v1.0/users/${username}/avatar`;
}

export async function getStudentVerificationStatus(): Promise<{ is_verified: boolean; discount_percent: number } | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_URL}/v1.0/student-verification/status`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    // The API wraps some payloads in { data: ... } and returns others flat -
    // getCurrentUser unwraps the same way.
    const json = await res.json();
    return json?.data ?? json;
  } catch {
    return null;
  }
}
