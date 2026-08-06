"use client";

import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, id, className, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;
  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <label htmlFor={textareaId} className="font-body text-sm text-muted">
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        rows={5}
        className={cn(
          "w-full resize-none rounded-lg border border-border-strong bg-glass px-4 py-3 font-body text-sm text-white placeholder:text-muted/60 outline-none transition-colors focus:border-primary focus-visible:ring-2 focus-visible:ring-primary/50",
          error && "border-red-500",
          className,
        )}
        {...props}
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
