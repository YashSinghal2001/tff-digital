"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ROUTES } from "@/constants/routes";

export function ContactForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
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
      // A dedicated route (CLIENT-2), not an in-page panel: the client
      // requirement calls for a real Thank You page, and it gets the App
      // Router's built-in navigation announcer for free — no bespoke
      // role="status" region or manual focus management to keep in sync.
      router.push(ROUTES.thankYou);
      return;
    }

    setSubmitError(
      result.message ||
        "Something went wrong sending your message. Please try again.",
    );
  };

  return (
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
        <p role="alert" className="font-body text-center text-sm text-red-400">
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
  );
}
