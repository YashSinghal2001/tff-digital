"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { UpworkIcon } from "@/components/icons/UpworkIcon";
import { RatingStars } from "@/components/testimonials/RatingStars";
import { EndorsementTags } from "@/components/testimonials/EndorsementTags";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/data/testimonials";

export interface TestimonialCardProps {
  testimonial: Testimonial;
}

// Reviews longer than this read as a wall of text in a 3-col card, so they
// collapse behind "Read more" instead of stretching the card's height.
const EXPAND_THRESHOLD = 200;

export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = testimonial.review.length > EXPAND_THRESHOLD;
  const reviewId = `testimonial-review-${testimonial.id}`;

  return (
    <Card className="flex h-full flex-col gap-4 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border-subtle bg-white/5 px-3 py-1 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-[#14A800]">
        <UpworkIcon className="h-3 w-3" />
        Upwork Client Feedback
      </span>

      <h3 className="font-heading text-base font-bold text-white">{testimonial.title}</h3>

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-xs text-muted">
        <RatingStars rating={testimonial.rating} />
        <span className="font-semibold text-white">{testimonial.rating.toFixed(1)}</span>
        <span aria-hidden="true">|</span>
        <span>{testimonial.dateRange}</span>
      </div>

      <div>
        <p
          id={reviewId}
          className={cn(
            "font-body text-sm text-white/90",
            !expanded && needsTruncation && "line-clamp-5",
          )}
        >
          &ldquo;{testimonial.review}&rdquo;
        </p>
        {needsTruncation ? (
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            aria-controls={reviewId}
            className="mt-2 font-body text-xs font-semibold text-primary outline-none transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {expanded ? "Read less" : "Read more"}
            <span className="sr-only"> of the review for {testimonial.title}</span>
          </button>
        ) : null}
      </div>

      {testimonial.freelancerResponse ? (
        <div className="border-l-2 border-primary/40 pl-4">
          <p className="font-body text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
            Freelancer&apos;s response
          </p>
          <p className="mt-1 font-body text-sm text-white/70 italic">
            &ldquo;{testimonial.freelancerResponse}&rdquo;
          </p>
        </div>
      ) : null}

      <EndorsementTags items={testimonial.endorsements} className="mt-auto pt-2" />
    </Card>
  );
}
