import Image from "next/image";
import { cn } from "@/lib/utils";
import type { TeamMember } from "@/data/team";

export interface TeamMemberCardProps {
  member: TeamMember;
  /** Center card of the visible desktop trio (or the single mobile card). */
  emphasized?: boolean;
}

/**
 * One native card of the team carousel: portrait on top, profile below.
 * Portraits are studio cut-outs on the deck's light backdrop, so the image
 * panel deliberately stays light against the dark glass body — the same
 * light-artwork-on-dark-card contrast the section shipped with before.
 */
export function TeamMemberCard({ member, emphasized }: TeamMemberCardProps) {
  return (
    <article
      className={cn(
        "group bg-glass hover:border-primary/60 relative flex h-full flex-col overflow-hidden rounded-[25px] border transition-all duration-300 hover:z-10 hover:-translate-y-1 hover:shadow-[0_0_36px_0_rgba(56,130,246,0.16)] motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        emphasized
          ? "border-primary/45 shadow-[0_0_28px_0_rgba(56,130,246,0.12)]"
          : "border-border-strong",
      )}
    >
      {/* Fixed-height stage over a deep navy surface with a restrained
          blue/purple ambient glow. The portrait sits on an inset stage
          (never touching the card edges) and is top-anchored inside a
          wrapper whose height is the member's zoom factor: zoom > 1
          enlarges the figure and lets only the region below the hands
          (jacket, hips, legs — chosen per member from the source
          composition) bleed past the divider, so heads, shoulders, and
          hands are never clipped. The panel height, not the image,
          controls the card height. */}
      <div className="border-border-subtle relative h-64 overflow-hidden border-b bg-[color-mix(in_srgb,var(--color-background)_82%,#000000)] md:h-72">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_28%,color-mix(in_srgb,var(--color-primary)_20%,transparent)_0%,transparent_62%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--color-secondary)_15%,transparent),transparent)]"
        />
        <div className="absolute inset-x-4 top-3 bottom-0">
          <div
            className="relative w-full"
            style={{ height: `${member.image.zoom * 100}%` }}
          >
            <Image
              src={member.image.src}
              alt={member.image.alt}
              fill
              sizes="(min-width: 1280px) 358px, (min-width: 1024px) 30vw, (min-width: 768px) 46vw, 92vw"
              className="object-contain object-top transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              draggable={false}
            />
          </div>
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(to_top,color-mix(in_srgb,var(--color-background)_55%,transparent),transparent)]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="font-body text-primary text-[10px] font-semibold tracking-[0.2em] uppercase">
          {member.company}
        </p>
        <h3 className="font-heading mt-2 text-[22px] leading-tight font-bold text-white">
          {member.name}
        </h3>
        <p className="font-body text-muted mt-1 text-sm font-semibold">
          {member.role}
        </p>

        <span
          aria-hidden="true"
          className="mt-3 h-0.5 w-10 rounded-full bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-secondary)_100%)]"
        />

        <p className="border-primary/40 font-body mt-3 border-l-2 pl-4 text-sm text-white/60 italic">
          {member.personalLine}
        </p>
      </div>
    </article>
  );
}
