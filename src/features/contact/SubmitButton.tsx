"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button-variants";
import { duration, easing } from "@/styles/animations";
import { cn } from "@/lib/utils";

export type SubmitPhase = "idle" | "submitting" | "success" | "error";

export interface SubmitButtonProps {
  phase: SubmitPhase;
}

const LABEL_TRANSITION = { duration: duration.fast, ease: easing.standard };

// Persistent live region (FORMA11Y-1 pattern): decoupled from the visible
// label so a phase change is announced even though the button keeps focus
// throughout — an aria-label swap alone isn't reliably re-announced by every
// screen reader.
const STATUS_MESSAGE: Record<SubmitPhase, string> = {
  idle: "",
  submitting: "Sending your message…",
  success: "Message sent.",
  error: "Something went wrong. You can try again.",
};

/**
 * Animated submit control for the contact form (CLIENT-2 successor). Width
 * stays fixed while sending — only the label swaps for a spinner — and only
 * contracts to a circle once the real API response has already succeeded,
 * where it draws a checkmark and picks up the existing --shadow-glow token.
 *
 * `prefers-reduced-motion` gets a structurally simpler path (no width morph,
 * no spinner, no path-drawing), not just a faster version of the same one —
 * MotionConfig's reducedMotion="user" already neutralizes transform-based
 * keys sitewide, but the spinner/checkmark here are new enough surface that
 * an explicit branch is clearer than relying on that alone.
 */
export function SubmitButton({ phase }: SubmitButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const isBusy = phase === "submitting" || phase === "success";

  return (
    <motion.button
      type="submit"
      disabled={isBusy}
      aria-disabled={isBusy}
      aria-label={
        phase === "submitting"
          ? "Sending your message"
          : phase === "success"
            ? "Message sent"
            : undefined
      }
      animate={
        prefersReducedMotion
          ? undefined
          : {
              width: phase === "success" ? 46 : "100%",
              scale: phase === "submitting" ? 0.98 : 1,
              x: phase === "error" ? [0, -6, 6, -4, 4, 0] : 0,
            }
      }
      transition={{
        width: { duration: duration.slow, ease: easing.out },
        scale: { duration: duration.base, ease: easing.out },
        x: { duration: 0.4, ease: easing.standard },
      }}
      className={cn(
        buttonVariants({
          className: "relative mx-auto w-full overflow-hidden disabled:opacity-100",
        }),
        phase === "success" &&
          !prefersReducedMotion &&
          "shadow-[var(--shadow-glow)]",
      )}
    >
      <span aria-live="polite" className="sr-only">
        {STATUS_MESSAGE[phase]}
      </span>

      {prefersReducedMotion ? (
        <span>
          {phase === "success"
            ? "Sent"
            : phase === "submitting"
              ? "Sending"
              : phase === "error"
                ? "Try again"
                : "Send a message"}
        </span>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {phase === "idle" && (
            <motion.span
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={LABEL_TRANSITION}
            >
              Send a message
            </motion.span>
          )}
          {phase === "submitting" && (
            <motion.span
              key="submitting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={LABEL_TRANSITION}
              className="inline-flex h-5 w-5 items-center justify-center"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 animate-spin motion-reduce:[animation-duration:2.4s]"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeOpacity="0.25"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="14 42"
                />
              </svg>
            </motion.span>
          )}
          {phase === "success" && (
            <motion.svg
              key="success"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: duration.fast }}
              aria-hidden="true"
            >
              <motion.path
                d="M5 12.5l4.5 4.5L19 7.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: duration.slow,
                  ease: easing.out,
                  delay: duration.fast,
                }}
              />
            </motion.svg>
          )}
          {phase === "error" && (
            <motion.span
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={LABEL_TRANSITION}
            >
              Try again
            </motion.span>
          )}
        </AnimatePresence>
      )}
    </motion.button>
  );
}
