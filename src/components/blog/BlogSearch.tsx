"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export interface BlogSearchProps {
  defaultValue?: string;
  className?: string;
}

export function BlogSearch({ defaultValue = "", className }: BlogSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    router.push(trimmed ? `${ROUTES.blog}?q=${encodeURIComponent(trimmed)}` : ROUTES.blog);
  };

  return (
    <form
      role="search"
      onSubmit={onSubmit}
      className={cn(
        "flex w-full items-center gap-2 rounded-full border border-border-strong bg-glass px-5 py-2.5",
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      <label htmlFor="blog-search" className="sr-only">
        Search articles
      </label>
      <input
        id="blog-search"
        name="q"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search articles..."
        className="w-full bg-transparent font-body text-sm text-white placeholder:text-muted focus:outline-none"
      />
    </form>
  );
}
