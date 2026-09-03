"use client";

import { useState } from "react";
import Image from "next/image";
import { UserRound } from "lucide-react";

export interface AuthorAvatarProps {
  src: string | null;
  alt: string;
}

/**
 * Split out from AuthorCard (a Server Component) because the broken-image
 * fallback needs client state — a Server Component cannot pass onError to
 * next/image (audit MEDIA-1). Mirrors SelectedWorkCard's useState+onError
 * pattern for the identical third-party-image problem, and receives plain
 * strings rather than the Author object so nothing extra lands in the
 * hydration payload. Renders inside AuthorCard's positioned 56px circle —
 * no layout of its own (same contract as AutoRotatingImage).
 */
export function AuthorAvatar({ src, alt }: AuthorAvatarProps) {
  const [failed, setFailed] = useState(false);

  // Covers both fallback cases at once: no avatar at all, or a URL that
  // failed to load (mirrors SelectedWorkCard's showPreview). Keeps the
  // UserRound fallback in exactly one place.
  if (!src || failed) {
    return <UserRound className="h-6 w-6" aria-hidden="true" />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="56px"
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}
