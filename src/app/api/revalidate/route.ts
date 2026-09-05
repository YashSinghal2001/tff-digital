import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { revalidateConfig } from "@/config/revalidate.config";
import { fetchGraphQL } from "@/lib/wordpress/client";
import { isWordPressError } from "@/lib/wordpress/errors";
import { secretsMatch } from "@/lib/wordpress/secret-compare";
import { resolveRevalidationTargets } from "@/lib/wordpress/revalidate-targets";
import { revalidateWebhookSchema } from "@/schemas/api/revalidate-webhook.schema";

/**
 * WordPress → Next.js on-demand revalidation (audit CACHE-1). The WordPress
 * plugin POSTs here when a Service, Case Study or Blog Post is published,
 * updated, unpublished, trashed or deleted, so the change reaches the
 * cached pages immediately instead of at the next 30s ISR window — and so
 * a deleted entry does not keep serving for as long as WordPress happens
 * to be reachable again. Time-based ISR stays in place as the safety net
 * (a missed or failed webhook degrades to today's behaviour, never worse).
 *
 * Security: POST only; a Bearer token compared in constant time against
 * WORDPRESS_REVALIDATE_SECRET. With no secret configured the endpoint is
 * disabled (503) and nothing is revalidated — the deployment simply keeps
 * time-based ISR. The body is validated before any path is computed, and a
 * slug can only ever name a concrete route under a known content type, so
 * a caller cannot choose arbitrary paths or trigger a site-wide purge.
 * Rejections are logged without the presented value (audit LOG-1).
 *
 * Outage guard: revalidatePath() invalidates the cached copy outright, and
 * Next regenerates it on the next visit with no stale fallback — so during
 * a CMS outage (the recurring Bluehost IP ban, INFRA-1) an editor's save
 * would turn a healthy stale page into a 500 until the CMS answers again
 * (reproduced against a served build). Time-based ISR does not have that
 * failure mode: it keeps serving the last good copy when a background
 * refresh fails. So before invalidating anything this probes the CMS from
 * this deployment (the same egress the renders use) and, if it cannot
 * answer, revalidates nothing and returns 503 — the pages stay up, and the
 * change lands at the next successful ISR refresh once the CMS is back.
 */

// Cheapest valid WPGraphQL request: no resolvers, no database. Uncached, so
// the probe can never be answered from the data cache.
const PROBE_QUERY = "query RevalidateProbe { __typename }";

async function cmsIsReachable(): Promise<boolean> {
  try {
    await fetchGraphQL<{ __typename: string }>(PROBE_QUERY, undefined, {
      cache: "no-store",
    });
    return true;
  } catch (error) {
    if (isWordPressError(error)) return false;
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const expected = revalidateConfig.secret;
  if (!expected) {
    console.warn(
      "[revalidate] Rejected webhook: WORDPRESS_REVALIDATE_SECRET is not configured",
    );
    return NextResponse.json(
      { error: "Revalidation is not configured" },
      { status: 503 },
    );
  }

  const provided = bearerToken(request.headers.get("authorization"));
  if (!secretsMatch(expected, provided)) {
    console.warn("[revalidate] Rejected webhook: invalid or missing secret", {
      hadSecret: provided !== null,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON body" }, { status: 400 });
  }

  const parsed = revalidateWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid payload",
        issues: parsed.error.issues.map(
          (issue) => `${issue.path.join(".") || "<root>"}: ${issue.code}`,
        ),
      },
      { status: 400 },
    );
  }

  const { type, slug, event } = parsed.data;

  if (!(await cmsIsReachable())) {
    console.warn(
      "[revalidate] CMS unreachable; nothing revalidated so the cached pages keep serving",
      { type, slug, event },
    );
    return NextResponse.json(
      { error: "CMS unreachable; nothing revalidated" },
      { status: 503 },
    );
  }

  const targets = resolveRevalidationTargets({ type, slug });
  try {
    for (const target of targets) {
      revalidatePath(target.path, target.kind);
    }
  } catch (error) {
    console.error("[revalidate] revalidatePath failed", { type, slug }, error);
    return NextResponse.json({ error: "Revalidation failed" }, { status: 500 });
  }

  const paths = targets.map((target) => target.path);
  console.info("[revalidate] Revalidated", { type, slug, event, paths });
  return NextResponse.json({ revalidated: true, type, slug, paths });
}

function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}
