"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/button-variants";
import { Logo } from "@/components/layout/Logo";
import { ROUTES } from "@/constants/routes";
import { createFocusTrap } from "@/lib/a11y/focus-trap";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "About", href: ROUTES.about },
  { label: "Services", href: ROUTES.services },
  { label: "Process", href: `${ROUTES.home}#process` },
  { label: "Work", href: `${ROUTES.home}#work` },
  { label: "Testimonials", href: `${ROUTES.home}#testimonials` },
  { label: "Blog", href: ROUTES.blog },
  { label: "Contact", href: ROUTES.contact },
];

// This project moves Tailwind's `xl` breakpoint to 75rem (see
// --breakpoint-xl in src/app/globals.css); the mobile toggle and panel are
// `xl:hidden`, so an open menu must close if the viewport crosses it —
// otherwise the page stays inert with no visible control to release it.
const DESKTOP_MEDIA_QUERY = "(min-width: 75rem)";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Every close path — Escape, backdrop tap, link activation — returns focus
  // to the toggle that opened the menu (A11Y-4). On a route change Next
  // moves focus again afterwards; on a same-page hash link the toggle is
  // the only sensible landing spot since the panel is about to disappear.
  const close = useCallback(() => {
    setOpen(false);
    toggleRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Focus trap while the mobile menu is open (A11Y-4). The header is the
  // trapped region: Logo → toggle → panel links → CTA cycle with Tab and
  // Shift+Tab; initial focus lands on the first panel link; Escape closes
  // and restores focus to the toggle; the skip link, <main> and <footer>
  // are inert for the duration so nothing behind the menu can be focused
  // or clicked. See src/lib/a11y/focus-trap.ts for the mechanics.
  useEffect(() => {
    if (!open || !headerRef.current) return;
    return createFocusTrap({
      container: headerRef.current,
      initialFocus: panelRef.current?.querySelector<HTMLElement>("a[href]"),
      onEscape: close,
    });
  }, [open, close]);

  // Widening past the desktop breakpoint hides the toggle and panel via CSS
  // while `open` would stay true — leaving the page inert with no visible
  // way to release it. Close (without focusing the now-hidden toggle).
  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      if (event.matches) setOpen(false);
    };
    if (media.matches) {
      setOpen(false);
      return;
    }
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [open]);

  return (
    <header ref={headerRef} className="fixed inset-x-0 top-4 z-50">
      {open && (
        <div
          className="bg-background/80 fixed inset-0 -z-10 backdrop-blur-sm xl:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}
      <Container size="full" className="max-w-[1280px]">
        <div className="border-border-strong bg-glass flex h-[69px] items-center justify-between rounded-[25px] border px-6 backdrop-blur-md">
          <Logo priority className="h-8 sm:h-9" />

          <nav className="hidden items-center gap-8 xl:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-body text-sm text-white/90 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Link
            href={ROUTES.contact}
            className={cn(
              buttonVariants({ size: "sm" }),
              "hidden h-11 px-5 text-sm xl:inline-flex",
            )}
          >
            Book Free Consultation
          </Link>

          <button
            ref={toggleRef}
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
            className="flex h-10 w-10 items-center justify-center rounded-full text-white xl:hidden"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div
          ref={panelRef}
          id="mobile-nav-panel"
          className={cn(
            "border-border-strong bg-glass mt-2 flex flex-col gap-1 rounded-[25px] border p-4 backdrop-blur-md xl:hidden",
            open ? "flex" : "hidden",
          )}
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={close}
              className="font-body rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={ROUTES.contact}
            onClick={close}
            className={cn(
              buttonVariants({ size: "sm" }),
              "mt-2 h-11 px-5 text-sm",
            )}
          >
            Book Free Consultation
          </Link>
        </div>
      </Container>
    </header>
  );
}
