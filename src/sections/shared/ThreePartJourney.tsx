"use client";

import { motion } from "framer-motion";
import { Search, Palette, Rocket } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconCircle } from "@/components/ui/IconCircle";
import { fadeInUp } from "@/styles/animations";
import { useEntranceDelay } from "@/lib/a11y/use-entrance-delay";

const journey = [
  {
    icon: Search,
    title: "Understand & Research",
    description:
      "We decode your business, map the market, and pinpoint the exact audience worth chasing.",
    points: [
      "Understand the business",
      "Research opportunities",
      "Identify ideal audience",
    ],
  },
  {
    icon: Palette,
    title: "Strategy & Identity",
    description:
      "We build the strategy, design the experiences, and craft a brand identity that commands attention.",
    points: ["Build strategy", "Design experiences", "Create brand identity"],
  },
  {
    icon: Rocket,
    title: "Launch, Optimize, Scale",
    description:
      "We ship fast, measure everything, and double down on what compounds.",
    points: ["Launch", "Optimize", "Scale & deliver growth"],
  },
];

export function ThreePartJourney() {
  const entranceDelay = useEntranceDelay();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {journey.map((item, index) => (
        <motion.div
          key={item.title}
          {...fadeInUp}
          transition={{
            ...fadeInUp.transition,
            delay: entranceDelay(index * 0.05),
          }}
        >
          <Card className="flex h-full flex-col gap-4">
            <div className="flex items-center gap-3">
              <IconCircle icon={item.icon} size="sm" />
              <span className="font-body text-muted text-xs">0{index + 1}</span>
            </div>
            <h3 className="font-heading text-base font-bold text-white">
              {item.title}
            </h3>
            <p className="font-body text-muted text-sm">{item.description}</p>
            <ul className="mt-auto flex flex-col gap-1.5">
              {item.points.map((point) => (
                <li key={point} className="font-body text-xs text-white/70">
                  • {point}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
