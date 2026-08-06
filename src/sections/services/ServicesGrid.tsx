"use client";

import {
  Search,
  Sparkles,
  Share2,
  CodeXml,
  Video,
  PenTool,
  TrendingUp,
  FileText,
  UserRound,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { FeatureGrid } from "@/components/common/FeatureGrid";
import { ROUTES } from "@/constants/routes";

const services = [
  {
    icon: Search,
    title: "SEO",
    description:
      "Rank for the queries your customers actually search — and turn organic into your most durable growth channel.",
    href: ROUTES.service("seo"),
  },
  {
    icon: Sparkles,
    title: "Google Ads & PPC",
    description: "Profitable paid acquisition engineered around unit economics — not vanity metrics.",
    href: ROUTES.services,
  },
  {
    icon: Share2,
    title: "Social Media Marketing",
    description: "Content and paid social that stops the scroll, builds community, and drives revenue.",
    href: ROUTES.service("smm"),
  },
  {
    icon: CodeXml,
    title: "Website Design & Development",
    description: "Fast, accessible, scalable sites engineered for growth teams to move quickly.",
    href: ROUTES.services,
  },
  {
    icon: Video,
    title: "Video Editing",
    description: "Story-driven video that performs across paid, organic, and product surfaces.",
    href: ROUTES.services,
  },
  {
    icon: PenTool,
    title: "Graphic Design",
    description: "Systems, campaigns, and assets that keep every touchpoint on-brand.",
    href: ROUTES.services,
  },
  {
    icon: TrendingUp,
    title: "Conversion Rate Optimization",
    description: "Turn the traffic you already have into revenue with a rigorous experimentation program.",
    href: ROUTES.services,
  },
  {
    icon: FileText,
    title: "Content Marketing",
    description: "SEO-led content that compounds — earning rankings, trust, and pipeline over time.",
    href: ROUTES.services,
  },
  {
    icon: UserRound,
    title: "Personal Branding",
    description: "Founder-led content that builds authority across paid, social, and product surfaces.",
    href: ROUTES.services,
  },
];

export function ServicesGrid() {
  return (
    <section id="grid" className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        {/* Visually hidden: keeps the h1 -> h3 card titles in valid heading order without adding a visible section title the design doesn't call for. */}
        <h2 className="sr-only">Our services</h2>
        <FeatureGrid items={services} titleClassName="text-lg" />
      </Container>
    </section>
  );
}
