"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { buttonVariants } from "@/components/ui/button-variants";
import { Logo } from "@/components/layout/Logo";
import { ROUTES } from "@/constants/routes";
import { SOCIAL_LINKS } from "@/constants/social";

type BrandIconProps = { className?: string };

function XIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

function InstagramIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
    </svg>
  );
}

function LinkedInIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function FacebookIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function PinterestIcon({ className }: BrandIconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
    </svg>
  );
}

const footerLinks = {
  Services: [
    { label: "CRO", href: ROUTES.services },
    { label: "SEO", href: ROUTES.service("seo") },
    { label: "PPC", href: ROUTES.services },
    { label: "Branding", href: ROUTES.services },
    { label: "Web Design & Dev", href: ROUTES.services },
    { label: "Social Media Marketing", href: ROUTES.service("smm") },
  ],
  "Quick Links": [
    { label: "Home", href: ROUTES.home },
    { label: "About us", href: ROUTES.about },
    { label: "Services", href: ROUTES.services },
    { label: "Testimonials", href: `${ROUTES.home}#testimonials` },
    { label: "Blog", href: ROUTES.blog },
    { label: "Contact us", href: ROUTES.contact },
  ],
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
      <Container size="full" className="max-w-[1280px] py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Logo asLink={false} className="h-10" />
            <p className="mt-5 max-w-xs font-body text-sm text-muted">
              Find Strategy. Target Right. Finish Strong. We build digital growth systems
              for brands that want measurable results.
            </p>

            <p className="mt-6 font-heading text-sm font-semibold text-white">
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

            <div className="mt-6 flex flex-wrap gap-3">
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
                  <Mail className="h-4 w-4 shrink-0" /> hello@tffdigital.com
                </li>
                <li className="flex items-center gap-2 font-body text-sm text-muted">
                  <Phone className="h-4 w-4 shrink-0" /> +1 (415) 555-0132
                </li>
                <li className="flex items-center gap-2 font-body text-sm text-muted">
                  <MapPin className="h-4 w-4 shrink-0" /> Zirakpur, Punjab, India
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-border-subtle pt-8 text-sm text-muted">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} TFF Digital. All rights reserved.</p>
            <p>Find Strategy · Target Right · Finish Strong</p>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
            <Link href={ROUTES.privacyPolicy} className="transition-colors hover:text-white">
              Privacy Policy
            </Link>
            <span aria-hidden="true" className="text-border-strong">
              |
            </span>
            <Link href={ROUTES.termsAndConditions} className="transition-colors hover:text-white">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
