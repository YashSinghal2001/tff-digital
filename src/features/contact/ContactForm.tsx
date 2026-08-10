"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactFormSchema, type ContactFormValues } from "@/schemas/forms/contact.schema";
import { submitContactFormAction } from "@/features/contact/actions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { serviceOptions, budgetOptions } from "@/constants/contact-form";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
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

    setSubmitError(result.message || "Something went wrong sending your message. Please try again.");
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[25px] border border-border-strong bg-glass p-10 text-center">
        <p className="font-heading text-lg font-bold text-white">Message sent</p>
        <p className="font-body text-sm text-muted">
          Thanks for reaching out — we&apos;ll get back to you within 24 hours.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => setSubmitted(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 rounded-[25px] border border-border-strong bg-glass p-6 sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Name*" placeholder="Jane Doe" {...register("name")} error={errors.name?.message} />
        <Input
          label="Work email*"
          type="email"
          placeholder="jane@company.com"
          {...register("email")}
          error={errors.email?.message}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Phone" type="tel" placeholder="(555) 000-0000" {...register("phone")} />
        <Input label="Company" placeholder="Company name" {...register("company")} />
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

      {submitError ? (
        <p role="alert" className="text-center font-body text-sm text-red-400">
          {submitError}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Sending..." : "Send a message"}
      </Button>

      <p className="text-center font-body text-xs text-muted">
        By submitting, you agree to our privacy policy.
      </p>
    </form>
  );
}
