"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  contactFormSchema,
  type ContactFormValues,
} from "@/schemas/forms/contact.schema";
import { submitContactFormAction } from "@/features/contact/actions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { serviceOptions, budgetOptions } from "@/constants/contact-form";

// Single source of truth for both the visible confirmation panel and the
// screen-reader announcement built from it below (FORMA11Y-1), so the two
// can never drift out of sync.
const SUCCESS_TITLE = "Message sent";
const SUCCESS_DESCRIPTION =
  "Thanks for reaching out — we'll get back to you within 24 hours.";
const SUCCESS_ANNOUNCEMENT = `${SUCCESS_TITLE}. ${SUCCESS_DESCRIPTION}`;

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const wasSubmitted = useRef(false);

  // On success the whole form unmounts — including the submit button that
  // held focus, which would silently strand focus on <body> — so focus moves
  // to the success panel to give keyboard users a cue. The reverse path has
  // the same problem ("Send another message" unmounts the focused button),
  // so focus moves to the first field when the form returns.
  //
  // The screen-reader announcement itself is a SEPARATE, always-mounted
  // role="status" node below (FORMA11Y-1), not this panel. Two things would
  // go wrong if the panel carried role="status" as well as the focus move:
  // moving focus into a live region at the moment its content appears is a
  // well-documented source of double/garbled announcements in NVDA and JAWS,
  // and — separately — inserting a brand-new element with role="status" and
  // its content already attached in one commit is not reliably announced by
  // several screen readers to begin with (the region needs to already exist
  // in the DOM before its text changes). Keeping one persistent, hidden
  // status node whose text toggles solves both problems at once.
  useEffect(() => {
    if (submitted) {
      wasSubmitted.current = true;
      successRef.current?.focus();
    } else if (wasSubmitted.current) {
      wasSubmitted.current = false;
      document.getElementById("name")?.focus();
    }
  }, [submitted]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    // Figma's form has no consent checkbox — agreement is implied by the
    // "By submitting..." disclaimer below the button, so default it true.
    defaultValues: { consent: true },
  });

  const onSubmit = async (values: ContactFormValues) => {
    setSubmitError(null);
    const result = await submitContactFormAction(values);

    if (result.success) {
      setSubmitted(true);
      reset();
      return;
    }

    setSubmitError(
      result.message ||
        "Something went wrong sending your message. Please try again.",
    );
  };

  return (
    <>
      {/* Persistent live region (FORMA11Y-1): present in the DOM whether or
          not the form has been submitted, so screen readers only ever have
          one status node to track and its TEXT change is what triggers the
          announcement — not the node's own arrival. Visually hidden; the
          sighted confirmation below is unchanged. */}
      <div role="status" className="sr-only">
        {submitted ? SUCCESS_ANNOUNCEMENT : ""}
      </div>
      {submitted ? (
        <div
          ref={successRef}
          tabIndex={-1}
          className="border-border-strong bg-glass flex flex-col items-center justify-center gap-3 rounded-[25px] border p-10 text-center outline-none"
        >
          <p className="font-heading text-lg font-bold text-white">
            {SUCCESS_TITLE}
          </p>
          <p className="font-body text-muted text-sm">{SUCCESS_DESCRIPTION}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSubmitted(false)}
          >
            Send another message
          </Button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="border-border-strong bg-glass flex flex-col gap-5 rounded-[25px] border p-6 sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Name*"
              placeholder="Jane Doe"
              {...register("name")}
              error={errors.name?.message}
            />
            <Input
              label="Work email*"
              type="email"
              placeholder="jane@company.com"
              {...register("email")}
              error={errors.email?.message}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label="Phone"
              type="tel"
              placeholder="(555) 000-0000"
              {...register("phone")}
            />
            <Input
              label="Company"
              placeholder="Company name"
              {...register("company")}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Select
              label="Services of interest*"
              placeholder="Select a service"
              options={serviceOptions}
              {...register("serviceInterest")}
              error={errors.serviceInterest?.message}
            />
            <Select
              label="Monthly Budget*"
              placeholder="Select a range"
              options={budgetOptions}
              {...register("budget")}
              error={errors.budget?.message}
            />
          </div>

          <Textarea
            label="What are you trying to solve?"
            placeholder="A little context goes a long way"
            {...register("message")}
            error={errors.message?.message}
          />

          {/* Honeypot (audit FORM-2): off-screen, out of the tab order and hidden
          from assistive tech, so no real visitor can reach or fill it — bots
          that fill every input in the DOM do. The value is judged on the
          server (contact.service.ts), so removing this field in devtools
          doesn't get a spam submission through. */}
          <div
            aria-hidden="true"
            className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
          >
            <label htmlFor="website">Website</label>
            <input
              id="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...register("website")}
            />
          </div>

          {submitError ? (
            <p
              role="alert"
              className="font-body text-center text-sm text-red-400"
            >
              {submitError}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Sending..." : "Send a message"}
          </Button>

          <p className="font-body text-muted text-center text-xs">
            By submitting, you agree to our privacy policy.
          </p>
        </form>
      )}
    </>
  );
}
