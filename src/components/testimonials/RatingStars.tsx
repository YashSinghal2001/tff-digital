import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RatingStarsProps {
  rating: number;
  className?: string;
}

/**
 * Renders a fixed 5-star row, filling stars up to the rounded rating so a
 * 4.0 shows 4 filled + 1 empty rather than 5 filled. The accessible label
 * carries the exact numeric rating so screen readers aren't left guessing
 * from the visual fill alone.
 */
export function RatingStars({ rating, className }: RatingStarsProps) {
  const filled = Math.round(rating);

  return (
    <span
      role="img"
      aria-label={`Rated ${rating.toFixed(1)} out of 5 stars`}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          className={cn(
            "h-3.5 w-3.5",
            index < filled ? "fill-primary text-primary" : "fill-transparent text-white/20",
          )}
        />
      ))}
    </span>
  );
}
