"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Next's App Router can render a route's loading.tsx fallback (no target
 * element in the DOM yet) at the moment it tries to scroll to a URL hash,
 * then never retries once the real content streams in — so links like
 * "/#work" silently land at the top of the page. This retries the scroll
 * until the target element exists.
 */
export function HashScrollHandler() {
  const pathname = usePathname();

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash;
      if (!hash) return;

      const id = decodeURIComponent(hash.slice(1));
      let attempts = 0;
      let lastAbsoluteTop: number | null = null;
      let stableCount = 0;

      // Content above the target (images, streamed sections) can still be
      // shifting layout after the element first appears, so keep polling
      // its document-relative position and re-issuing a smooth scroll
      // whenever it moves, until it holds steady.
      const tryScroll = () => {
        const el = document.getElementById(id);
        if (el) {
          const absoluteTop = el.getBoundingClientRect().top + window.scrollY;
          if (lastAbsoluteTop !== null && Math.abs(absoluteTop - lastAbsoluteTop) < 2) {
            stableCount += 1;
          } else {
            stableCount = 0;
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          lastAbsoluteTop = absoluteTop;
          if (stableCount >= 3) return;
        }
        attempts += 1;
        if (attempts < 40) {
          setTimeout(tryScroll, 200);
        }
      };

      tryScroll();
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, [pathname]);

  return null;
}
