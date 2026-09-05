"use client";

import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ContactForm } from "@/features/contact/ContactForm";
import { SOCIAL_LINKS } from "@/constants/social";
import {
  XIcon,
  InstagramIcon,
  LinkedInIcon,
  FacebookIcon,
} from "@/components/icons/social-icons";
import { fadeInUpOnMount } from "@/styles/animations";
import { useEntranceDelay } from "@/lib/a11y/use-entrance-delay";

const businessInfo: Array<{ icon: typeof Mail; label: string; href?: string }> =
  [
    {
      icon: Mail,
      label: "info@tffdigital.com",
      href: "mailto:info@tffdigital.com",
    },
    { icon: Phone, label: "+91 72068 09816", href: "tel:+917206809816" },
    { icon: MapPin, label: "Zirakpur, Punjab, India" },
  ];

const socialLinks = [
  { label: "LinkedIn", href: SOCIAL_LINKS.linkedin, icon: LinkedInIcon },
  { label: "Instagram", href: SOCIAL_LINKS.instagram, icon: InstagramIcon },
  { label: "X (Twitter)", href: SOCIAL_LINKS.x, icon: XIcon },
  { label: "Facebook", href: SOCIAL_LINKS.facebook, icon: FacebookIcon },
];

export function ContactFormSection() {
  const entranceDelay = useEntranceDelay();

  return (
    <section className="pt-2 pb-8 lg:pt-4 lg:pb-12">
      <Container size="full" className="max-w-[1280px]">
        {/* Visually hidden: keeps the h1 -> h3 "Business info" heading in valid order without adding a visible section title the design doesn't call for. */}
        <h2 className="sr-only">Contact form and business information</h2>
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          {/* Mount-triggered, not scroll-triggered: this section is above the
              fold and holds the site's primary CTA, so it must never depend on
              an IntersectionObserver callback to become visible and clickable
              (audit FORM-RT-2). */}
          <motion.div {...fadeInUpOnMount}>
            <ContactForm />
          </motion.div>

          <motion.div
            {...fadeInUpOnMount}
            transition={{
              ...fadeInUpOnMount.transition,
              delay: entranceDelay(0.1),
            }}
            className="flex flex-col gap-6"
          >
            <Card>
              <h3 className="font-heading text-base font-bold text-white">
                Business info
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {businessInfo.map(({ icon: Icon, label, href }) => (
                  <li
                    key={label}
                    className="font-body text-muted flex items-center gap-2 text-sm"
                  >
                    <Icon className="text-primary h-4 w-4 shrink-0" />
                    {href ? (
                      <a
                        href={href}
                        className="transition-colors hover:text-white"
                      >
                        {label}
                      </a>
                    ) : (
                      label
                    )}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex gap-3">
                {socialLinks.map(({ label, href, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-secondary)_100%)] text-white transition-opacity hover:opacity-85"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </Card>

            <Card className="relative min-h-[220px] flex-1 overflow-hidden p-0">
              {/* Keyless Google Maps embed of the business location shown in
                  the card above; next.config.ts CSP frame-src allows it. */}
              <iframe
                src="https://www.google.com/maps?q=Zirakpur,+Punjab,+India&output=embed"
                title="Map showing TFF Digital's location in Zirakpur, Punjab, India"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0 grayscale-[15%]"
              />
            </Card>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
