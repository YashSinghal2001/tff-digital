const PREVIEW_WIDTH = 800;
const PREVIEW_HEIGHT = 600;

/**
 * Rejects loopback/private/link-local IPv4 and IPv6 hosts so a
 * WordPress-entered Project URL can never target internal infrastructure
 * through the preview pipeline, even though the URL is only ever handed to
 * a third-party image service (see getWebsitePreviewUrl) — this app never
 * fetches the target itself, but the input is still treated as untrusted.
 */
function isPrivateOrLocalHostname(hostnameRaw: string): boolean {
  const host = hostnameRaw.toLowerCase().replace(/^\[|\]$/g, "");

  if (host === "localhost" || host === "0.0.0.0" || host === "::1" || host === "::") {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 127 || a === 10 || a === 0) return true; // loopback, 10.0.0.0/8, 0.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 169 && b === 254) return true; // link-local
    return false;
  }

  // IPv6 unique-local (fc00::/7) and link-local (fe80::/10).
  if (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:")) {
    return true;
  }

  return false;
}

/**
 * True only for a Project URL safe to hand to the preview service: a
 * syntactically valid http(s) URL that isn't localhost or a private/internal
 * address. Rejects everything else, including non-URL strings and other
 * schemes (javascript:, data:, file:, ...) by construction — only http/https
 * ever passes.
 */
export function isPreviewableProjectUrl(
  projectUrl: string | null | undefined,
): projectUrl is string {
  if (!projectUrl) return false;

  let parsed: URL;
  try {
    parsed = new URL(projectUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
  if (isPrivateOrLocalHostname(parsed.hostname)) return false;

  return true;
}

/**
 * Builds a cacheable website-screenshot URL for a Case Study's WordPress
 * "Project URL" field, using WordPress.com's public mshots service (the
 * same infrastructure behind WordPress.com's own site-preview thumbnails) —
 * a plain GET image endpoint, so no API key and no server-side fetch on our
 * side. The browser requests the image directly; mshots caches the
 * screenshot on its end, and next/image applies this project's existing
 * remote-image cache (see next.config.ts images.minimumCacheTTL) on top —
 * the same pipeline every other WordPress-sourced image already goes
 * through, reused rather than duplicated.
 *
 * Returns null for anything not safe/valid to preview — callers must fall
 * back to the existing placeholder in that case (missing field, malformed
 * URL, disallowed scheme, or a local/private address).
 */
export function getWebsitePreviewUrl(projectUrl: string | null | undefined): string | null {
  if (!isPreviewableProjectUrl(projectUrl)) return null;

  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(projectUrl)}?w=${PREVIEW_WIDTH}&h=${PREVIEW_HEIGHT}`;
}
