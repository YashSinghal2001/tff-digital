/**
 * Shared safety gate for a Case Study's WordPress "Project URL" field.
 *
 * That field is free text: WordPress carries only a `"format": "uri"` schema
 * hint and enforces nothing server-side, so a `javascript:`/`data:` value
 * would be stored happily and this app's own check is the only enforcement
 * layer in the whole pipeline. Both consumers of the field — the "Visit
 * project" link on a case-study page and the mshots screenshot pipeline —
 * go through this scheme check (audit SEC3-1).
 */
export function isSafeProjectUrl(
  projectUrl: string | null | undefined,
): projectUrl is string {
  if (!projectUrl) return false;

  let parsed: URL;
  try {
    parsed = new URL(projectUrl);
  } catch {
    // Not an absolute URL at all — including relative paths and bare
    // hostnames, neither of which belongs in an external "Visit project"
    // link.
    return false;
  }

  return parsed.protocol === "http:" || parsed.protocol === "https:";
}
