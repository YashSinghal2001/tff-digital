"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Link2, Globe, Send, Mail, Phone, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import { buttonVariants } from "@/components/ui/button-variants";
import { Logo } from "@/components/layout/Logo";
import { ROUTES } from "@/constants/routes";

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
  { label: "LinkedIn", href: "#", icon: Link2 },
  { label: "Instagram", href: "#", icon: Globe },
  { label: "Twitter", href: "#", icon: Send },
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

            <div className="mt-6 flex gap-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-border-strong bg-glass text-white transition-colors hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </Link>
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
            <p>© {new Date().getFullYear()} Target Find &amp; Finish Digital. All rights reserved.</p>
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
