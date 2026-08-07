"use client";

import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
  label?: string;
  error?: string;
  placeholder?: string;
}

export function Select({
  options,
  label,
  error,
  placeholder,
  id,
  className,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;
  const errorId = error && selectId ? `${selectId}-error` : undefined;
  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label htmlFor={selectId} className="font-body text-sm text-muted">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        defaultValue={placeholder ? "" : undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={cn(
          "h-12 w-full rounded-lg border border-border-strong bg-glass px-4 font-body text-sm text-white outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/50",
          error && "border-red-500",
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled className="bg-background text-muted">
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-background">
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} className="text-sm text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
