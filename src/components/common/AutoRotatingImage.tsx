"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AutoRotatingImageProps {
  images: { src: string; alt: string }[];
  /** Passed through to next/image `sizes`. */
  sizes: string;
  intervalMs?: number;
  imageClassName?: string;
}

/**
 * Stacked fill-images that crossfade on a timer. Renders inside an existing
 * positioned container — no controls, no layout of its own.
 */
export function AutoRotatingImage({
  images,
  sizes,
  intervalMs = 4000,
  imageClassName,
}: AutoRotatingImageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Continuous decorative motion pauses under prefers-reduced-motion
    // (A11Y-5) — same autoplay guard as the testimonial/team carousels.
    if (images.length < 2 || reducedMotion) return;
    const id = setInterval(
      () => setActiveIndex((index) => (index + 1) % images.length),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [images.length, intervalMs, reducedMotion]);

  return (
    <>
      {images.map((image, index) => (
        <Image
          key={image.src}
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          aria-hidden={index !== activeIndex}
          className={cn(
            "object-cover transition-opacity duration-700 ease-out",
            index === activeIndex ? "opacity-100" : "opacity-0",
            imageClassName,
          )}
        />
      ))}
    </>
  );
}
