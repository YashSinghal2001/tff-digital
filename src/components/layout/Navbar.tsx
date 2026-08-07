"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { buttonVariants } from "@/components/ui/button-variants";
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

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-6 z-50">
      {open && (
        <div
          className="fixed inset-0 -z-10 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}
      <Container size="full" className="max-w-[1280px]">
        <div className="flex h-[69px] items-center justify-between rounded-[25px] border border-border-strong bg-glass px-6 backdrop-blur-md">
          <Link href={ROUTES.home} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-secondary)_100%)] font-heading text-sm font-bold text-white">
              TFF
            </span>
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-heading text-sm font-bold tracking-wide text-white">
                TARGET FIND &amp; FINISH
              </span>
              <span className="text-[10px] tracking-[0.2em] text-muted">DIGITAL</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
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
            className={cn(buttonVariants({ size: "sm" }), "hidden h-11 px-5 text-sm lg:inline-flex")}
          >
            Book Free Consultation
          </Link>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white lg:hidden"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div
          className={cn(
            "mt-2 flex flex-col gap-1 rounded-[25px] border border-border-strong bg-glass p-4 backdrop-blur-md lg:hidden",
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
