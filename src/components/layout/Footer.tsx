"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { buttonVariants } from "@/components/ui/button-variants";
import { Logo } from "@/components/layout/Logo";
import {
  FOOTER_QUICK_LINKS,
  FOOTER_SERVICE_LINKS,
} from "@/components/layout/footer-links";
import { ROUTES } from "@/constants/routes";
import { SOCIAL_LINKS } from "@/constants/social";
import {
  XIcon,
  InstagramIcon,
  LinkedInIcon,
  FacebookIcon,
  PinterestIcon,
} from "@/components/icons/social-icons";

const footerLinks = {
  Services: FOOTER_SERVICE_LINKS,
  "Quick Links": FOOTER_QUICK_LINKS,
};

const socialLinks = [
  { label: "X (Twitter)", href: SOCIAL_LINKS.x, icon: XIcon },
  { label: "Instagram", href: SOCIAL_LINKS.instagram, icon: InstagramIcon },
  { label: "LinkedIn", href: SOCIAL_LINKS.linkedin, icon: LinkedInIcon },
  { label: "Facebook", href: SOCIAL_LINKS.facebook, icon: FacebookIcon },
  { label: "Pinterest", href: SOCIAL_LINKS.pinterest, icon: PinterestIcon },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const onSubscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="border-t border-border-subtle">
      <Container size="full" className="max-w-[1280px] py-10 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr] lg:gap-12">
          <div>
            <Logo asLink={false} className="h-10" />
            <p className="mt-4 max-w-xs font-body text-sm text-muted">
              Find Strategy. Target Right. Finish Strong. We build digital growth systems
              for brands that want measurable results.
            </p>

            <p className="mt-5 font-heading text-sm font-semibold text-white">
              Get growth insights, monthly.
            </p>
            {subscribed ? (
              <p role="status" className="mt-3 font-body text-sm font-semibold text-primary">
                You&apos;re subscribed — thanks for joining.
              </p>
            ) : (
              <form onSubmit={onSubscribe} className="mt-3 flex max-w-xs gap-2">
                <Input
                  type="email"
                  aria-label="Email address"
                  placeholder="you@company.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-11"
                />
                <button type="submit" className={buttonVariants({ size: "sm", className: "h-11 shrink-0" })}>
                  Subscribe
                </button>
              </form>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-glass text-white transition-colors hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <h3 className="font-heading text-sm font-semibold text-white">{heading}</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="font-body text-sm text-muted transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <h3 className="font-heading text-sm font-semibold text-white">Contact</h3>
              <ul className="mt-4 flex flex-col gap-3">
                <li className="flex items-center gap-2 font-body text-sm text-muted">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a href="mailto:info@tffdigital.com" className="transition-colors hover:text-white">
                    info@tffdigital.com
                  </a>
                </li>
                <li className="flex items-center gap-2 font-body text-sm text-muted">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a href="tel:+917206809816" className="transition-colors hover:text-white">
                    +91 72068 09816
                  </a>
                </li>
                <li className="flex items-center gap-2 font-body text-sm text-muted">
                  <MapPin className="h-4 w-4 shrink-0" /> Zirakpur, Punjab, India
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border-subtle pt-6">
          {/* Mobile: centered stack (copyright → legal → tagline). Desktop: one
              row of equal thirds so the copyright is centered across the full
              footer width, legal links sit left, tagline sits right. */}
          <div className="flex flex-col items-center gap-3 text-center lg:grid lg:grid-cols-3 lg:items-center lg:gap-4">
            <div className="order-2 flex items-center gap-x-3 font-body text-xs text-muted lg:order-1 lg:justify-self-start">
              <Link
                href={ROUTES.privacyPolicy}
                className="transition-colors duration-150 hover:text-white"
              >
                Privacy Policy
              </Link>
              <span aria-hidden="true" className="text-border-strong">
                |
              </span>
              <Link
                href={ROUTES.termsAndConditions}
                className="transition-colors duration-150 hover:text-white"
              >
                Terms &amp; Conditions
              </Link>
            </div>

            <p className="order-1 font-body text-sm text-muted lg:order-2 lg:text-center">
              © {new Date().getFullYear()} TFF Digital. All rights reserved.
            </p>

            <p className="order-3 font-body text-xs text-muted lg:justify-self-end lg:text-right">
              Find Strategy · Target Right · Finish Strong
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}
