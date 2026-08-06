import Image from "next/image";
import { UserRound } from "lucide-react";
import type { Author } from "@/types/domain/author";
import { cn } from "@/lib/utils";

export interface AuthorCardProps {
  author: Author;
  className?: string;
}

export function AuthorCard({ author, className }: AuthorCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-[25px] border border-border-strong bg-glass p-6",
        className,
      )}
    >
      <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-strong bg-white/5 text-primary">
        {author.avatar ? (
          <Image
            src={author.avatar.url}
            alt={author.avatar.altText || author.name}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <UserRound className="h-6 w-6" aria-hidden="true" />
        )}
      </span>

      <div>
        <p className="font-heading text-sm font-bold text-white">{author.name}</p>
        {author.bio ? <p className="mt-1 font-body text-xs text-muted">{author.bio}</p> : null}
      </div>
    </div>
  );
}
