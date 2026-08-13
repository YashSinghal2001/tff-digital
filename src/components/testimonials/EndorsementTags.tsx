import { cn } from "@/lib/utils";

export interface EndorsementTagsProps {
  items: string[];
  className?: string;
}

export function EndorsementTags({ items, className }: EndorsementTagsProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="font-body text-[11px] font-medium uppercase tracking-[0.1em] text-muted">
        Endorsed by client
      </p>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item}>
            <span className="inline-flex rounded-full border border-border-subtle bg-white/5 px-3 py-1 font-body text-xs text-white/80">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
