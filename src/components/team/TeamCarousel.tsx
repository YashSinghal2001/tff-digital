"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TeamMemberCard } from "@/components/team/TeamMemberCard";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/data/team";

export interface TeamCarouselProps {
  members: TeamMember[];
}

const AUTOPLAY_MS = 6000;
const SLIDE_TRANSITION = "transform 0.45s cubic-bezier(0, 0, 0.2, 1)";
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
 * Same viewport/track carousel layout as TestimonialSlider (slides on a flex
 * track translated by -offset(index), widths pure CSS, geometry re-measured
 * on resize), but the track is moved with a CSS transition + direct style
 * writes instead of framer-motion's rAF-driven useAnimationControls tween:
 * the inline transform is written synchronously, so the track's logical
 * position can never be left mid-flight when rAF is throttled (background
 * or fully occluded windows produce zero frames). React renders the track
 * with a constant transform so re-renders never clobber the imperatively
 * written position. Widths are exact fractions (1 / 2 / 3 cards per view,
 * no peek) so every index lands the last card flush with the right edge;
 * the flex track's stretch keeps all cards equal height regardless of bio
 * length. Swipe uses raw pointer events, mirroring TestimonialSlider.
 */
export function TeamCarousel({ members }: TeamCarouselProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const firstSlideRef = useRef<HTMLDivElement>(null);
  const swipeRef = useRef<SwipeSession | null>(null);

  const [index, setIndex] = useState(0);
  // step = slide width + gap; maxOffset keeps the last slide flush with the
  // right edge instead of leaving a blank region after it.
  const [metrics, setMetrics] = useState({
    step: 0,
    maxOffset: 0,
    visibleCount: 1,
  });
  const [paused, setPaused] = useState(false);

  const reducedMotion = useReducedMotion();

  const maxIndex =
    metrics.step > 0
      ? Math.max(0, Math.ceil(metrics.maxOffset / metrics.step - 0.001))
      : members.length - 1;

  const offsetFor = useCallback(
    (i: number) => Math.min(i * metrics.step, metrics.maxOffset),
    [metrics],
  );

  const setTrackX = useCallback(
    (x: number, animate: boolean) => {
      const track = trackRef.current;
      if (!track) return;
      track.style.transition =
        animate && !reducedMotion ? SLIDE_TRANSITION : "none";
      track.style.transform = `translate3d(${-x}px, 0, 0)`;
    },
    [reducedMotion],
  );

  const goTo = useCallback(
    (i: number) => {
      const next = Math.min(Math.max(i, 0), maxIndex);
      setIndex(next);
      setTrackX(offsetFor(next), true);
    },
    [maxIndex, offsetFor, setTrackX],
  );

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const slide = firstSlideRef.current;
    if (!viewport || !track || !slide) return;

    // Geometry is anchored to the track, not the viewport: the viewport
    // carries breathing padding for the hover lift/glow, so its clientWidth
    // includes that padding and would skew the flush-edge math.
    const measure = () => {
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      const step = slide.getBoundingClientRect().width + gap;
      const maxOffset = Math.max(0, track.scrollWidth - track.clientWidth);
      const visibleCount = Math.max(
        1,
        Math.round((track.clientWidth + gap) / step),
      );
      setMetrics({ step, maxOffset, visibleCount });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [members.length]);

  // Re-snap (without animating) after a resize changes the geometry under
  // the current index.
  useEffect(() => {
    const clamped = Math.min(index, maxIndex);
    // Re-snapping `index` to a ResizeObserver-driven geometry change, not a
    // value derivable during render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (clamped !== index) setIndex(clamped);
    setTrackX(offsetFor(clamped), false);
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
    setTrackX(desired, false);
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

  const firstVisible =
    metrics.step > 0 ? Math.round(offsetFor(index) / metrics.step) : 0;
  const isSlideHidden = (i: number) =>
    i < firstVisible || i > firstVisible + metrics.visibleCount - 1;
  // Middle card of the visible trio (or the lone mobile card) gets slightly
  // stronger emphasis; with 2-up there is no center, so nothing is raised.
  const centerIndex =
    metrics.visibleCount % 2 === 1
      ? firstVisible + (metrics.visibleCount - 1) / 2
      : -1;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Meet the TFF Digital team"
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
          alone does not prevent for composited (transformed) children.
          The padding (cancelled by matching negative margins, so layout
          rhythm is untouched) moves the clip boundary away from the cards:
          the hover lift + glow get 40px of vertical room, and the sides get
          20px — no more than the track gap, so off-screen slides still can't
          peek in at resting positions. Paint containment clips at the
          padding edge, which is exactly what makes this trick work. */}
      <div
        ref={viewportRef}
        className="-mx-5 -my-10 cursor-grab overflow-hidden px-5 py-10 [contain:paint]"
        style={{ touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
      >
        {/* Constant rendered transform: every position change goes through
            setTrackX, and re-renders re-apply this identical value, so React
            never overwrites the imperative track position. */}
        <div
          ref={trackRef}
          className="flex items-stretch gap-5 md:gap-6"
          style={{ transform: "translate3d(0, 0, 0)" }}
        >
          {members.map((member, i) => (
            <div
              key={member.id}
              ref={i === 0 ? firstSlideRef : undefined}
              role="group"
              aria-roledescription="slide"
              aria-label={`${member.name} — ${i + 1} of ${members.length}`}
              inert={isSlideHidden(i) || undefined}
              className="w-full flex-none md:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
            >
              <TeamMemberCard member={member} emphasized={i === centerIndex} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="Previous team members"
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
          aria-label="Next team members"
          className="border-border-strong bg-glass focus-visible:ring-primary focus-visible:ring-offset-background flex h-10 w-10 items-center justify-center rounded-full border text-white transition-all duration-300 outline-none hover:border-transparent hover:bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-secondary)_100%)] focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-35"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
