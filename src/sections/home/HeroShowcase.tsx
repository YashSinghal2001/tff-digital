"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  ChartLine,
  MousePointerClick,
  PieChart,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { IconCircle } from "@/components/ui/IconCircle";
import { cn } from "@/lib/utils";

interface SlideCard {
  icon: LucideIcon;
  headline: string;
  subline?: string;
  lines: string[];
}

interface Slide {
  image: { src: string; alt: string; positionClassName?: string };
  /** Order: top-left, top-right, bottom-left, bottom-right. */
  cards: [SlideCard, SlideCard, SlideCard, SlideCard];
}

const slides: Slide[] = [
  {
    image: {
      src: "/founders/kanchan.jpg",
      alt: "Kanchan Rana, TFF Digital co-founder and SEO expert",
      positionClassName: "object-top",
    },
    cards: [
      {
        icon: Search,
        headline: "SEO",
        subline: "Rank Higher.",
        lines: ["Get Found."],
      },
      {
        icon: TrendingUp,
        headline: "CRO +64%",
        lines: ["Convert More.", "Grow Faster."],
      },
      {
        icon: ChartLine,
        headline: "Growth in Progress",
        lines: ["Data-driven strategies", "that deliver consistent", "results."],
      },
      {
        icon: Users,
        headline: "Leads 1,932+",
        lines: ["Real Results.", "Real Growth."],
      },
    ],
  },
  {
    image: {
      src: "/founders/raju.jpg",
      alt: "Raju Gorai, TFF Digital co-founder and performance marketing expert",
      positionClassName: "object-top",
    },
    cards: [
      {
        icon: BarChart3,
        headline: "4.2X",
        subline: "ROAS Increase",
        lines: ["Across Ad Campaigns"],
      },
      {
        icon: Users,
        headline: "3.8X",
        subline: "Lead Generation",
        lines: ["Growth"],
      },
      {
        icon: MousePointerClick,
        headline: "68%",
        subline: "Reduction in CPA",
        lines: ["Lower Cost,", "Higher Conversions"],
      },
      {
        icon: PieChart,
        headline: "+127%",
        subline: "Revenue Growth",
        lines: ["Through Paid Media"],
      },
    ],
  },
];

const cornerClasses = [
  "left-0 top-2 sm:-left-24 sm:-top-2",
  "right-0 top-2 sm:-right-24 sm:-top-2",
  "bottom-2 left-0 sm:-left-24 sm:-bottom-2",
  "bottom-2 right-0 sm:-right-24 sm:-bottom-2",
];

/**
 * Hero right-side visual: auto-rotating founder image with four floating
 * stat cards. A single active-slide state drives both, so the image and
 * its matching cards always crossfade together.
 */
export function HeroShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setActiveIndex((index) => (index + 1) % slides.length),
      4000,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto flex h-[320px] w-[320px] items-center justify-center rounded-full bg-white/5 sm:h-[400px] sm:w-[400px] lg:h-[min(400px,52vh)] lg:w-[min(400px,52vh)]">
      <div className="absolute inset-0 rounded-full border border-primary/40 shadow-[var(--shadow-glow)]" />

      <div className="absolute inset-0 overflow-hidden rounded-full">
        {slides.map((slide, index) => (
          <Image
            key={slide.image.src}
            src={slide.image.src}
            alt={slide.image.alt}
            fill
            sizes="(min-width: 640px) 400px, 320px"
            aria-hidden={index !== activeIndex}
            className={cn(
              "object-cover transition-opacity duration-700 ease-out",
              slide.image.positionClassName,
              index === activeIndex ? "opacity-100" : "opacity-0",
            )}
          />
        ))}
      </div>

      {cornerClasses.map((cornerClass, corner) => (
        <div
          key={cornerClass}
          className={cn("absolute z-10 grid max-w-[46%] sm:max-w-none", cornerClass)}
        >
          {slides.map((slide, index) => {
            const card = slide.cards[corner];
            return (
              <div
                key={slide.image.src}
                aria-hidden={index !== activeIndex}
                className={cn(
                  "col-start-1 row-start-1 flex items-start gap-2.5 rounded-2xl border border-border-strong bg-glass p-2.5 backdrop-blur-md transition-all duration-700 ease-out sm:p-3.5",
                  "shadow-[0_0_30px_rgba(56,130,246,0.15)]",
                  index === activeIndex
                    ? "scale-100 opacity-100"
                    : "pointer-events-none scale-95 opacity-0",
                )}
              >
                <IconCircle icon={card.icon} size="sm" className="hidden sm:inline-flex" />
                <div>
                  <p className="font-heading text-xs font-bold text-white sm:text-sm">
                    {card.headline}
                  </p>
                  {card.subline && (
                    <p className="font-body text-[10px] font-semibold text-white/90 sm:text-xs">
                      {card.subline}
                    </p>
                  )}
                  {card.lines.map((line) => (
                    <p
                      key={line}
                      className="font-body text-[10px] leading-snug text-muted sm:text-[11px]"
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
