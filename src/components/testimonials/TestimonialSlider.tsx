"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TestimonialCard } from "@/components/testimonials/TestimonialCard";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/data/testimonials";

export interface TestimonialSliderProps {
  testimonials: Testimonial[];
}

const AUTOPLAY_MS = 5500;
const SLIDE_TRANSITION = { duration: 0.45, ease: [0, 0, 0.2, 1] as const };
/** Pointer must travel this many px (mostly horizontally) before a swipe starts. */
const SWIPE_START_PX = 8;

interface SwipeSession {
  pointerId: number;
  startX: number;
  startY: number;
  startOffset: number;
  lastX: number;
  lastT: number;
  velocity: number;
  active: boolean;
}

/**
 * Transform-based horizontal carousel: slides sit on a flex track that is
 * translated by -offset(index). Slide widths are pure CSS (~1 card on
 * mobile, ~1.8 on tablet, ~2.2 on desktop, next card peeking) and the
 * track is measured on resize, so index -> offset stays correct at every
 * viewport without per-breakpoint JS. Swipe is implemented with raw
 * pointer events rather than a gesture library so plain clicks on card
 * content (e.g. "Read more") keep working untouched.
 */
export function TestimonialSlider({ testimonials }: TestimonialSliderProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstSlideRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<SwipeSession | null>(null);
  const suppressClickRef = useRef(false);

  const [index, setIndex] = useState(0);
  // step = slide width + gap; maxOffset keeps the last slide flush with the
  // right edge instead of leaving a blank region after it.
  const [metrics, setMetrics] = useState({
    step: 0,
    maxOffset: 0,
    visibleCount: 1,
  });
  const [paused, setPaused] = useState(false);

  const controls = useAnimationControls();
  const reducedMotion = useReducedMotion();

  const maxIndex =
    metrics.step > 0
      ? Math.max(0, Math.ceil(metrics.maxOffset / metrics.step - 0.001))
      : testimonials.length - 1;

  const offsetFor = useCallback(
    (i: number) => Math.min(i * metrics.step, metrics.maxOffset),
    [metrics],
  );

  const goTo = useCallback(
    (i: number) => {
      const next = Math.min(Math.max(i, 0), maxIndex);
      setIndex(next);
      controls.start({
        x: -offsetFor(next),
        transition: reducedMotion ? { duration: 0 } : SLIDE_TRANSITION,
      });
    },
    [controls, maxIndex, offsetFor, reducedMotion],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const slide = firstSlideRef.current;
    if (!viewport || !track || !slide) return;

    const measure = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = slide.getBoundingClientRect().width + gap;
      const maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);
      const visibleCount = Math.max(
        1,
        Math.round((viewport.clientWidth + gap) / step),
      );
      setMetrics({ step, maxOffset, visibleCount });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [testimonials.length]);

  // Re-snap after a resize changes the geometry under the current index.
  useEffect(() => {
    const clamped = Math.min(index, maxIndex);
    if (clamped !== index) setIndex(clamped);
    controls.set({ x: -offsetFor(clamped) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics]);

  useEffect(() => {
    if (paused || reducedMotion || maxIndex === 0) return;
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      goTo(index >= maxIndex ? 0 : index + 1);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, reducedMotion, maxIndex, index, goTo]);

  const handlePointerDown = (event: React.PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    if (metrics.step === 0) return;
    swipeRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffset: offsetFor(index),
      lastX: event.clientX,
      lastT: performance.now(),
      velocity: 0,
      active: false,
    };
  };

  const handlePointerMove = (event: React.PointerEvent) => {
    const swipe = swipeRef.current;
    if (!swipe || event.pointerId !== swipe.pointerId) return;
    const dx = event.clientX - swipe.startX;
    const dy = event.clientY - swipe.startY;

    if (!swipe.active) {
      if (Math.abs(dx) < SWIPE_START_PX) return;
      // Mostly-vertical movement means the user is scrolling the page.
      if (Math.abs(dy) > Math.abs(dx)) {
        swipeRef.current = null;
        return;
      }
      swipe.active = true;
      setPaused(true);
      const viewport = viewportRef.current;
      if (viewport) {
        viewport.setPointerCapture(event.pointerId);
        viewport.style.userSelect = "none";
        viewport.style.cursor = "grabbing";
      }
    }

    const now = performance.now();
    const dt = now - swipe.lastT;
    if (dt > 0) {
      const instantVelocity = ((event.clientX - swipe.lastX) / dt) * 1000;
      swipe.velocity = 0.8 * instantVelocity + 0.2 * swipe.velocity;
      swipe.lastX = event.clientX;
      swipe.lastT = now;
    }

    // Rubber-band past the first/last slide instead of clamping hard.
    let desired = swipe.startOffset - dx;
    if (desired < 0) desired *= 0.25;
    else if (desired > metrics.maxOffset)
      desired = metrics.maxOffset + (desired - metrics.maxOffset) * 0.25;
    controls.set({ x: -desired });
  };

  const releasePointer = (event: React.PointerEvent) => {
    const viewport = viewportRef.current;
    if (viewport) {
      if (viewport.hasPointerCapture(event.pointerId)) {
        viewport.releasePointerCapture(event.pointerId);
      }
      viewport.style.userSelect = "";
      viewport.style.cursor = "";
    }
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    const swipe = swipeRef.current;
    if (!swipe || event.pointerId !== swipe.pointerId) return;
    swipeRef.current = null;
    if (!swipe.active) return;
    releasePointer(event);
    // The pointerup also produces a click on whatever card content the
    // pointer ends over; swallow that one click so a swipe never triggers
    // "Read more" or the profile links.
    suppressClickRef.current = true;
    setPaused(false);
    const dx = event.clientX - swipe.startX;
    const projected = swipe.startOffset - dx - swipe.velocity * 0.15;
    goTo(Math.round(projected / metrics.step));
  };

  const handlePointerCancel = (event: React.PointerEvent) => {
    const swipe = swipeRef.current;
    if (!swipe || event.pointerId !== swipe.pointerId) return;
    swipeRef.current = null;
    if (!swipe.active) return;
    releasePointer(event);
    setPaused(false);
    goTo(index);
  };

  const handleClickCapture = (event: React.MouseEvent) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const firstVisible =
    metrics.step > 0 ? Math.round(offsetFor(index) / metrics.step) : 0;
  const isSlideHidden = (i: number) =>
    i < firstVisible || i > firstVisible + metrics.visibleCount - 1;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Client testimonials"
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setPaused(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goTo(index - 1);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          goTo(index + 1);
        }
      }}
    >
      {/* [contain:paint] stops the off-screen track from adding phantom
          horizontal scroll range to the page in Chromium, which overflow-hidden
          alone does not prevent for composited (transformed) children. */}
      <div
        ref={viewportRef}
        className="cursor-grab overflow-hidden [contain:paint]"
        style={{ touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onClickCapture={handleClickCapture}
      >
        <motion.div
          ref={trackRef}
          className="flex items-stretch gap-5 md:gap-6"
          animate={controls}
        >
          {testimonials.map((testimonial, i) => (
            <div
              key={testimonial.id}
              ref={i === 0 ? firstSlideRef : undefined}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${testimonials.length}`}
              inert={isSlideHidden(i) || undefined}
              className="w-[88%] flex-none sm:w-[70%] md:w-[54%] lg:w-[43%]"
            >
              <TestimonialCard testimonial={testimonial} />
            </div>
          ))}
        </motion.div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="Previous testimonials"
          className="border-border-strong bg-glass focus-visible:ring-primary focus-visible:ring-offset-background flex h-10 w-10 items-center justify-center rounded-full border text-white transition-all duration-300 outline-none hover:border-transparent hover:bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-secondary)_100%)] focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2">
          {Array.from({ length: maxIndex + 1 }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index || undefined}
              className={cn(
                "focus-visible:ring-primary/60 h-1.5 rounded-full transition-all duration-300 outline-none focus-visible:ring-2",
                i === index
                  ? "w-5 bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-secondary)_100%)]"
                  : "w-1.5 bg-white/20 hover:bg-white/40",
              )}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === maxIndex}
          aria-label="Next testimonials"
          className="border-border-strong bg-glass focus-visible:ring-primary focus-visible:ring-offset-background flex h-10 w-10 items-center justify-center rounded-full border text-white transition-all duration-300 outline-none hover:border-transparent hover:bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-secondary)_100%)] focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
