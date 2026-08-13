"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { UpworkIcon } from "@/components/icons/UpworkIcon";
import { fadeInUp } from "@/styles/animations";
import { cn } from "@/lib/utils";

const UPWORK_PROFILE_URL = "https://www.upwork.com/freelancers/upworkseoexpert";

const stats: Array<{ value: string; label: string; highlight?: boolean }> = [
  { value: "100%", label: "Job Success" },
  { value: "Top Rated Plus", label: "Upwork Status", highlight: true },
  { value: "72", label: "Total Jobs" },
  { value: "9,444", label: "Total Hours" },
];

export function TrustedBrands() {
  return (
    <section className="pb-8 pt-0 sm:pb-10">
      <Container size="full" className="max-w-[1280px]">
        <motion.div
          {...fadeInUp}
          className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(115deg,#0e1430_0%,#0c1025_48%,#131033_100%)] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-10 sm:py-7 lg:px-10 lg:py-6"
        >
          {/* Top gradient accent line */}
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_0%,rgba(56,130,246,0.55)_25%,rgba(139,92,246,0.55)_75%,transparent_100%)]"
          />

          {/* Ambient glows: blue behind the verification block, purple near the CTA */}
          <span
            aria-hidden
            className="bg-primary/10 pointer-events-none absolute top-1/2 -left-20 h-56 w-56 -translate-y-1/2 rounded-full blur-[90px]"
          />
          <span
            aria-hidden
            className="bg-secondary/10 pointer-events-none absolute top-1/2 -right-16 h-56 w-56 -translate-y-1/2 rounded-full blur-[90px]"
          />

          <div className="relative grid grid-cols-1 gap-7 md:grid-cols-[1fr_auto] md:items-center md:gap-x-6 min-[80rem]:grid-cols-[auto_1fr_auto]">
            {/* Verification block */}
            <div className="flex items-center justify-center gap-4 md:justify-start">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] text-[#14A800] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <UpworkIcon className="h-5 w-5" />
              </span>
              <div className="text-left whitespace-nowrap">
                <p className="font-body text-primary text-[10px] tracking-[0.2em] uppercase">
                  Proven on Upwork
                </p>
                <p className="font-heading mt-0.5 flex items-center gap-1.5 text-base font-semibold text-white">
                  Verified on Upwork
                  <BadgeCheck
                    className="h-4 w-4 shrink-0 text-[#14A800]"
                    aria-hidden="true"
                  />
                </p>
                <p className="font-body text-muted/80 text-xs">
                  Kanchan R. — Freelancer Profile
                </p>
              </div>
            </div>

            {/* Stats */}
            <div
              className={cn(
                "grid grid-cols-2 gap-x-4 gap-y-6 border-y border-white/5 py-6 text-center",
                "md:col-span-2 md:row-start-2 md:flex md:items-center md:justify-between md:gap-x-0 md:border-y-0 md:border-t md:pt-7 md:pb-0",
                "min-[80rem]:col-span-1 min-[80rem]:col-start-2 min-[80rem]:row-start-1 min-[80rem]:border-t-0 min-[80rem]:border-l min-[80rem]:border-white/5 min-[80rem]:py-0 min-[80rem]:pl-6",
              )}
            >
              {stats.map((stat, index) => (
                <div key={stat.label} className="contents">
                  {index > 0 && (
                    <span
                      aria-hidden
                      className="hidden h-10 w-px shrink-0 bg-white/10 md:block"
                    />
                  )}
                  <div>
                    <p className="font-heading text-lg leading-tight font-bold text-white sm:text-xl md:whitespace-nowrap min-[80rem]:text-2xl">
                      {stat.highlight ? (
                        <span className="bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-secondary)_100%)] bg-clip-text text-transparent">
                          {stat.value}
                        </span>
                      ) : (
                        stat.value
                      )}
                    </p>
                    <p className="font-body text-muted/70 mt-1 text-[10px] tracking-[0.14em] uppercase sm:text-[11px] md:whitespace-nowrap">
                      {stat.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex justify-center md:col-start-2 md:row-start-1 md:justify-end min-[80rem]:col-start-3">
              <motion.a
                href={UPWORK_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="group font-heading focus-visible:ring-primary focus-visible:ring-offset-background inline-flex h-11 items-center gap-2 rounded-full bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-secondary)_100%)] px-6 text-sm font-semibold whitespace-nowrap text-white shadow-[0_0_24px_rgba(56,130,246,0.25)] transition-[box-shadow,filter] duration-200 outline-none hover:shadow-[0_0_36px_rgba(139,92,246,0.35)] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2"
              >
                View Upwork Profile
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </motion.a>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
