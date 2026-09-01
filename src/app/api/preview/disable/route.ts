import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { draftMode } from "next/headers";
import { ROUTES } from "@/constants/routes";

/**
 * Clears Next.js Draft Mode's cookie. Not wired into any visible UI (the
 * Case Study page's design is unchanged) — reach it directly, or from a
 * future content type's own preview flow; draft mode is a single global
 * toggle, not per-content-type, so one shared disable route covers all of
 * them.
 */
export async function GET(request: NextRequest) {
  (await draftMode()).disable();
  return NextResponse.redirect(new URL(ROUTES.home, request.url));
}
