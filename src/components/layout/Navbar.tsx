"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/button-variants";
import { Logo } from "@/components/layout/Logo";
import { ROUTES } from "@/constants/routes";
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

export function Navbar() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Focus trap while the mobile menu is open (A11Y-4): body scroll is locked
  // but nothing stopped keyboard focus from leaving the visually-open menu.
  // Focus moves into the panel on open; Tab/Shift+Tab cycle through the
  // toggle button plus the panel links; Escape closes and restores focus to
  // the toggle. Link clicks close without restoring — navigation moves focus.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const toggle = toggleRef.current;
    panel?.querySelector<HTMLElement>("a")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle?.focus();
        return;
      }
      if (event.key !== "Tab" || !panel || !toggle) return;
      // offsetParent filter: if the viewport was widened past xl while open,
      // toggle and panel are display:none but `open` is stale-true — trapping
      // Tab among unfocusable nodes would freeze the keyboard entirely.
      const focusable = [
        toggle,
        ...panel.querySelectorAll<HTMLElement>("a[href]"),
      ].filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!active || !focusable.includes(active)) {
        event.preventDefault();
        first.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-4 z-50">
      {open && (
        <div
          className="fixed inset-0 -z-10 bg-background/80 backdrop-blur-sm xl:hidden"
          onClick={() => {
            setOpen(false);
            toggleRef.current?.focus();
          }}
          aria-hidden="true"
        />
      )}
      <Container size="full" className="max-w-[1280px]">
        <div className="flex h-[69px] items-center justify-between rounded-[25px] border border-border-strong bg-glass px-6 backdrop-blur-md">
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
            className={cn(buttonVariants({ size: "sm" }), "hidden h-11 px-5 text-sm xl:inline-flex")}
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
            "mt-2 flex flex-col gap-1 rounded-[25px] border border-border-strong bg-glass p-4 backdrop-blur-md xl:hidden",
            open ? "flex" : "hidden",
          )}
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 font-body text-sm text-white/90 hover:bg-white/5"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={ROUTES.contact}
            onClick={() => setOpen(false)}
            className={cn(buttonVariants({ size: "sm" }), "mt-2 h-11 px-5 text-sm")}
          >
            Book Free Consultation
          </Link>
        </div>
      </Container>
    </header>
  );
}
