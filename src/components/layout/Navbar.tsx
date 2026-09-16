"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/button-variants";
import { Logo } from "@/components/layout/Logo";
import { ROUTES } from "@/constants/routes";
import { createFocusTrap } from "@/lib/a11y/focus-trap";
import { cn } from "@/lib/utils";

interface ServiceLink {
  label: string;
  href: string;
}

const servicesLinks: ServiceLink[] = [
  { label: "AEO & SEO", href: ROUTES.service("aeo-seo") },
  { label: "SMM", href: ROUTES.service("smm") },
  { label: "Meta Ads", href: ROUTES.service("meta-ads") },
  { label: "Web Development", href: ROUTES.service("web-development") },
  { label: "Video Editing", href: ROUTES.service("video-editing") },
  { label: "ZOHO One", href: ROUTES.service("zoho-one") },
];

type NavLink =
  | { type: "link"; label: string; href: string }
  | { type: "dropdown"; label: string; items: ServiceLink[] };

const navLinks: NavLink[] = [
  { type: "link", label: "About", href: ROUTES.about },
  { type: "dropdown", label: "Services", items: servicesLinks },
  { type: "link", label: "Process", href: `${ROUTES.home}#process` },
  { type: "link", label: "Work", href: `${ROUTES.home}#work` },
  { type: "link", label: "Testimonials", href: `${ROUTES.home}#testimonials` },
  { type: "link", label: "Blog", href: ROUTES.blog },
  { type: "link", label: "Contact", href: ROUTES.contact },
];

// Desktop dropdown: a disclosure button (FAQ.tsx's aria-expanded/aria-controls
// idiom) rather than an ARIA menu widget — six plain links, no arrow-key menu
// navigation needed. Opens on hover or focus, closes on outside click, Escape,
// blur past the menu, mouseleave, or picking a link.
function DesktopServicesMenu({ label, items }: { label: string; items: ServiceLink[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      ref={ref}
      className="relative flex h-full items-center"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!ref.current?.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="desktop-services-menu"
        className="font-body flex items-center gap-1 text-sm text-white/90 transition-colors hover:text-white"
      >
        {label}
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-200", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <div
        id="desktop-services-menu"
        hidden={!open}
        className="border-border-strong bg-glass absolute left-0 top-full flex w-48 flex-col gap-0.5 rounded-xl border p-1.5 backdrop-blur-lg"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className="font-body rounded-lg px-3 py-1.5 text-sm text-white/90 hover:bg-white/5"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// Mobile: same accordion mechanics as FAQ.tsx, with its own independent
// open state so it doesn't fight the outer panel's open/close.
function MobileServicesMenu({
  label,
  items,
  onNavigate,
}: {
  label: string;
  items: ServiceLink[];
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-services-menu"
        onClick={() => setOpen((prev) => !prev)}
        className="font-body flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/5"
      >
        {label}
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      <div id="mobile-services-menu" hidden={!open} className="flex flex-col gap-1 pl-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className="font-body rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/5"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

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
      // Syncing React state to the external viewport (matchMedia), not
      // something derivable at render time.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

          <nav className="hidden h-full items-center gap-8 xl:flex">
            {navLinks.map((link) =>
              link.type === "dropdown" ? (
                <DesktopServicesMenu key={link.label} label={link.label} items={link.items} />
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="font-body text-sm text-white/90 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ),
            )}
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
          {navLinks.map((link) =>
            link.type === "dropdown" ? (
              <MobileServicesMenu
                key={link.label}
                label={link.label}
                items={link.items}
                onNavigate={close}
              />
            ) : (
              <Link
                key={link.label}
                href={link.href}
                onClick={close}
                className="font-body rounded-lg px-3 py-2 text-sm text-white/90 hover:bg-white/5"
              >
                {link.label}
              </Link>
            ),
          )}
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
