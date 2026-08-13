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
    <Card className="hover:border-primary/40 flex h-full flex-col gap-4 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_12px_32px_-12px_rgba(56,130,246,0.3)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <span className="border-border-subtle font-body inline-flex w-fit items-center gap-1.5 rounded-full border bg-white/5 px-3 py-1 text-[10px] font-semibold tracking-[0.12em] text-[#14A800] uppercase">
        <UpworkIcon className="h-3 w-3" />
        Upwork Client Feedback
      </span>

      <h3 className="font-heading text-base font-bold text-white">
        {testimonial.title}
      </h3>

      <div className="font-body text-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <RatingStars rating={testimonial.rating} />
        <span className="font-semibold text-white">
          {testimonial.rating.toFixed(1)}
        </span>
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
            className="font-body text-primary focus-visible:ring-primary/50 mt-2 text-xs font-semibold transition-colors outline-none hover:text-white focus-visible:ring-2"
          >
            {expanded ? "Read less" : "Read more"}
            <span className="sr-only">
              {" "}
              of the review for {testimonial.title}
            </span>
          </button>
        ) : null}
      </div>

      {testimonial.freelancerResponse ? (
        <div className="border-primary/40 border-l-2 pl-4">
          <p className="font-body text-muted text-[11px] font-medium tracking-[0.1em] uppercase">
            Freelancer&apos;s response
          </p>
          <p className="font-body mt-1 text-sm text-white/70 italic">
            &ldquo;{testimonial.freelancerResponse}&rdquo;
          </p>
        </div>
      ) : null}

      <EndorsementTags
        items={testimonial.endorsements}
        className="mt-auto pt-2"
      />
    </Card>
  );
}
