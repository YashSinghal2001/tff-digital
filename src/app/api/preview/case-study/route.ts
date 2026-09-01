import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { draftMode } from "next/headers";
import { getCaseStudyPreviewByDatabaseId } from "@/services/case-study.service";
import { isPlaceholderCaseStudySlug } from "@/lib/content/case-study-placeholders";
import { isWordPressError } from "@/lib/wordpress/errors";
import { isValidPreviewSecret, parsePreviewId } from "@/lib/wordpress/preview-request";
import { ROUTES } from "@/constants/routes";

/**
 * Entry point for WordPress's "Preview" / "Preview changes" button on a
 * Case Study (wired via the preview_post_link filter in
 * wordpress-plugin/tff-headless-leads/tff-headless-leads.php). WordPress
 * redirects the editor's browser here with ?secret=...&id=<post ID>; on
 * success this enables Next.js Draft Mode and redirects to the real
 * /case-studies/[slug] URL — the CMS domain is never the final destination.
 *
 * Two independent layers gate the draft content, not one:
 *   1. `secret` — must match WORDPRESS_PREVIEW_SECRET, or this route 401s
 *      before ever contacting WordPress. Deliberately returns the same
 *      generic 401 whether the secret is wrong or simply unconfigured, so
 *      the response can't be used to fingerprint server configuration.
 *   2. The actual draft content — fetched via WordPress-authenticated
 *      GraphQL (see getCaseStudyPreviewByDatabaseId / preview-auth.ts).
 *      Even a leaked/guessed secret only lets someone flip on this
 *      browser's own draft-mode cookie; without the server-held WordPress
 *      Application Password, no draft content is retrievable through it.
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!isValidPreviewSecret(secret)) {
    return new NextResponse("Invalid preview secret", { status: 401 });
  }

  const id = parsePreviewId(request.nextUrl.searchParams.get("id"));
  if (id === null) {
    return new NextResponse("Missing or invalid case study id", { status: 400 });
  }

  let caseStudy;
  try {
    caseStudy = await getCaseStudyPreviewByDatabaseId(id);
  } catch (error) {
    // Never leak WordPress/GraphQL error detail (config, network, or auth
    // failure) to the response — log server-side only, matching the
    // resilience pattern used everywhere else in this app.
    console.error("[preview/case-study] Failed to resolve preview content", error);
    const status = isWordPressError(error) && error.kind === "config" ? 500 : 502;
    return new NextResponse("Could not load the preview right now.", { status });
  }

  if (!caseStudy || isPlaceholderCaseStudySlug(caseStudy.slug)) {
    return new NextResponse("Case study not found", { status: 404 });
  }

  (await draftMode()).enable();

  // `preview=true` is a human-readable marker for the editor's URL bar
  // only — draft-mode's own httpOnly cookie is the sole source of truth for
  // whether the content page actually fetches/renders draft data.
  const target = new URL(`${ROUTES.caseStudy(caseStudy.slug)}?preview=true`, request.url);
  return NextResponse.redirect(target);
}
