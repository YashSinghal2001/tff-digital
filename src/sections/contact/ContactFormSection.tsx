"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Phone, MapPin, Link2, Globe, Send, MapPinned } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { ContactForm } from "@/features/contact/ContactForm";
import { fadeInUp } from "@/styles/animations";

const businessInfo: Array<{ icon: typeof Mail; label: string; href?: string }> = [
  { icon: Mail, label: "info@tffdigita.com", href: "mailto:info@tffdigita.com" },
  { icon: Phone, label: "+91 72068 09816", href: "tel:+917206809816" },
  { icon: MapPin, label: "Zirakpur, Punjab, India" },
];

const socialLinks = [
  { label: "LinkedIn", href: "#", icon: Link2 },
  { label: "Instagram", href: "#", icon: Globe },
  { label: "YouTube", href: "#", icon: Send },
];

export function ContactFormSection() {
  return (
    <section className="pt-2 pb-8 lg:pt-4 lg:pb-12">
      <Container size="full" className="max-w-[1280px]">
        {/* Visually hidden: keeps the h1 -> h3 "Business info" heading in valid order without adding a visible section title the design doesn't call for. */}
        <h2 className="sr-only">Contact form and business information</h2>
        <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <motion.div {...fadeInUp}>
            <ContactForm />
          </motion.div>

          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.1 }}
            className="flex flex-col gap-6"
          >
            <Card>
              <h3 className="font-heading text-base font-bold text-white">Business info</h3>
              <ul className="mt-4 flex flex-col gap-3">
                {businessInfo.map(({ icon: Icon, label, href }) => (
                  <li key={label} className="flex items-center gap-2 font-body text-sm text-muted">
                    <Icon className="h-4 w-4 shrink-0 text-primary" />
                    {href ? (
                      <a href={href} className="transition-colors hover:text-white">
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
                  <Link
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-secondary)_100%)] text-white"
                  >
                    <Icon className="h-4 w-4" />
                  </Link>
                ))}
              </div>
            </Card>

            <Card className="relative flex min-h-[220px] flex-1 items-center justify-center overflow-hidden">
              <MapPinned className="h-8 w-8 text-white/30" strokeWidth={1} />
              <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-border-strong bg-glass px-4 py-2 font-body text-xs text-muted">
                Map placeholder
              </span>
            </Card>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
