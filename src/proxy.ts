import { NextResponse, type NextRequest } from "next/server";
import { checkHomePreviewAccess } from "@/lib/preview/home-preview-auth";

// Only gates the /home-preview staging homepage; every other route bypasses
// this file entirely via the matcher below.
const NOINDEX = "noindex, nofollow";

export function proxy(request: NextRequest) {
  const access = checkHomePreviewAccess(request.headers.get("authorization"), {
    username: process.env.HOME_PREVIEW_USERNAME,
    password: process.env.HOME_PREVIEW_PASSWORD,
  });

  if (access === "disabled") {
    return new NextResponse("Not Found", {
      status: 404,
      headers: { "X-Robots-Tag": NOINDEX, "Cache-Control": "no-store" },
    });
  }
  if (access === "denied") {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate":
          'Basic realm="TFF Digital preview", charset="UTF-8"',
        "X-Robots-Tag": NOINDEX,
        "Cache-Control": "no-store",
      },
    });
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", NOINDEX);
  return response;
}

export const config = {
  matcher: ["/home-preview", "/home-preview/:path*"],
};
