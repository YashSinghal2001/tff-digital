/**
 * HTTP Basic auth check for the /home-preview staging route (see src/proxy.ts).
 * Credentials come only from HOME_PREVIEW_USERNAME / HOME_PREVIEW_PASSWORD;
 * with either unset the route is disabled (fail closed), never open.
 */
export type HomePreviewAccess = "disabled" | "denied" | "granted";

export interface HomePreviewCredentials {
  username?: string;
  password?: string;
}

// Length still leaks, the content doesn't; fine for a staging gate.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function checkHomePreviewAccess(
  authorization: string | null,
  { username, password }: HomePreviewCredentials,
): HomePreviewAccess {
  if (!username || !password) return "disabled";
  const match = authorization?.match(/^Basic\s+(\S+)$/i);
  if (!match) return "denied";
  let decoded: string;
  try {
    decoded = atob(match[1]);
  } catch {
    return "denied";
  }
  const separator = decoded.indexOf(":");
  if (separator === -1) return "denied";
  const userOk = safeEqual(decoded.slice(0, separator), username);
  const passOk = safeEqual(decoded.slice(separator + 1), password);
  return userOk && passOk ? "granted" : "denied";
}
