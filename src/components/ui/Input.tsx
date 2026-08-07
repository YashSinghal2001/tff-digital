"use client";

import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name;
  const errorId = error && inputId ? `${inputId}-error` : undefined;
  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label htmlFor={inputId} className="font-body text-sm text-muted">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          "h-12 w-full rounded-lg border border-border-strong bg-glass px-4 font-body text-sm text-white placeholder:text-muted/60 outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/50",
          error && "border-red-500",
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
