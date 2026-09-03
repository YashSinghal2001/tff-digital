import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { draftMode } from "next/headers";
import { getServiceOfferingPreviewByDatabaseId } from "@/services/service-offering.service";
import { isWordPressError } from "@/lib/wordpress/errors";
import { isValidPreviewSecret, parsePreviewId } from "@/lib/wordpress/preview-request";
import { ROUTES } from "@/constants/routes";

/**
 * Entry point for WordPress's "Preview" / "Preview changes" button on a
 * Service (wired via the shared permalink filter in
 * wordpress-plugin/tff-headless-leads/tff-headless-leads.php). Structurally
 * identical to /api/preview/case-study/route.ts — see that file's doc
 * comment for the full two-layer security rationale (shared secret gates
 * only who can flip on this browser's own draft-mode cookie; the actual
 * draft content still requires the server-held WordPress Application
 * Password, never reachable from the browser).
 */
export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (!isValidPreviewSecret(secret)) {
    // Mirrors case-study/route.ts: log the rejection (audit LOG-1), never
    // the attempted value; response body unchanged.
    console.warn(
      "[preview/service] Rejected preview request: invalid or missing secret",
      { hadSecret: secret !== null },
    );
    return new NextResponse("Invalid preview secret", { status: 401 });
  }

  const id = parsePreviewId(request.nextUrl.searchParams.get("id"));
  if (id === null) {
    return new NextResponse("Missing or invalid service id", { status: 400 });
  }

  let service;
  try {
    service = await getServiceOfferingPreviewByDatabaseId(id);
  } catch (error) {
    console.error("[preview/service] Failed to resolve preview content", error);
    const status = isWordPressError(error) && error.kind === "config" ? 500 : 502;
    return new NextResponse("Could not load the preview right now.", { status });
  }

  if (!service) {
    return new NextResponse("Service not found", { status: 404 });
  }

  (await draftMode()).enable();

  const target = new URL(`${ROUTES.service(service.slug)}?preview=true`, request.url);
  return NextResponse.redirect(target);
}
